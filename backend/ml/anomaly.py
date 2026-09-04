"""One-class patch anomaly model for unseen defect appearance."""

from __future__ import annotations

import json
import pickle
from pathlib import Path

import cv2
import numpy as np

from ml.config import MODELS, YOLO_DIR
from ml.features import patch_features
from ml.logging_utils import get_logger
from ml.numpy_models import GaussianAnomaly
from ml.preprocess import load_bgr
from ml.quality import localize_chip

log = get_logger("anomaly")


def _iter_normal_patches(split: str = "train", limit_images: int = 80) -> np.ndarray:
    img_dir = YOLO_DIR / "images" / split
    lbl_dir = YOLO_DIR / "labels" / split
    feats = []
    for img_path in sorted(img_dir.glob("*.jpg"))[:limit_images]:
        lbl = lbl_dir / (img_path.stem + ".txt")
        if lbl.exists() and lbl.read_text(encoding="utf-8").strip():
            continue
        img = cv2.imread(str(img_path), cv2.IMREAD_COLOR)
        if img is None:
            continue
        chip = localize_chip(img)
        if not chip:
            continue
        x1, y1, x2, y2 = chip["body_bbox"]
        body = img[y1:y2, x1:x2]
        h, w = body.shape[:2]
        for iy in range(4):
            for ix in range(4):
                ys, ye = iy * h // 4, (iy + 1) * h // 4
                xs, xe = ix * w // 4, (ix + 1) * w // 4
                feats.append(patch_features(body[ys:ye, xs:xe]))
    if not feats:
        raise RuntimeError("No normal patches found for anomaly training")
    return np.stack(feats)


def train_anomaly() -> Path:
    X = _iter_normal_patches()
    model = GaussianAnomaly().fit(X)
    scores = model.decision_function(X)
    artifact = {
        "model": model,
        "train_score_mean": float(scores.mean()),
        "train_score_std": float(scores.std() + 1e-6),
        "train_score_min": float(scores.min()),
    }
    MODELS.mkdir(parents=True, exist_ok=True)
    path = MODELS / "anomaly_iforest.pkl"
    path.write_bytes(pickle.dumps(artifact))
    (MODELS / "anomaly_meta.json").write_text(
        json.dumps(
            {
                "n_patches": int(len(X)),
                "train_score_mean": artifact["train_score_mean"],
                "train_score_std": artifact["train_score_std"],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    log.info("Saved anomaly model on %s normal patches", len(X))
    return path


def anomaly_map(source, chip: dict | None = None) -> dict:
    path = MODELS / "anomaly_iforest.pkl"
    if not path.exists():
        return {"available": False, "score": None, "regions": []}
    artifact = pickle.loads(path.read_bytes())
    model = artifact["model"]
    mean, std = artifact["train_score_mean"], artifact["train_score_std"]
    image = load_bgr(source)
    if chip is None:
        chip = localize_chip(image)
    if chip is None:
        return {"available": True, "score": None, "regions": [], "error": "no_chip"}
    x1, y1, x2, y2 = chip["bbox"]
    body = image[y1:y2, x1:x2]
    h, w = body.shape[:2]
    regions = []
    worst = 1e9
    for iy in range(4):
        for ix in range(4):
            ys, ye = iy * h // 4, (iy + 1) * h // 4
            xs, xe = ix * w // 4, (ix + 1) * w // 4
            feat = patch_features(body[ys:ye, xs:xe]).reshape(1, -1)
            raw = float(model.decision_function(feat)[0])
            worst = min(worst, raw)
            z = (mean - raw) / std
            if z > 2.5:
                regions.append(
                    {
                        "bbox": [x1 + xs, y1 + ys, x1 + xe, y1 + ye],
                        "anomaly_z": float(z),
                        "raw_score": raw,
                    }
                )
    z_worst = (mean - worst) / std
    p = 1.0 / (1.0 + np.exp(-0.8 * (z_worst - 2.0)))
    return {
        "available": True,
        "score": float(np.clip(p, 0.0, 0.99)),
        "z_worst": float(z_worst),
        "regions": regions,
        "raw_min_decision": float(worst),
    }
