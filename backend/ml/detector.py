"""Proposal-based defect detector trained on YOLO-format synthetic boxes.

This is the production detector when a YOLO .pt checkpoint is not available.
If ultralytics + a trained best.pt exist, they are used first.
"""

from __future__ import annotations

import json
import pickle
from pathlib import Path

import cv2
import numpy as np

from ml.config import DEFECT_CLASSES, IMGSZ, MODELS, YOLO_DIR
from ml.features import patch_features
from ml.logging_utils import get_logger
from ml.numpy_models import SoftmaxClassifier
from ml.preprocess import load_bgr
from ml.quality import localize_chip

log = get_logger("detector")

BG_CLASS = "background"


def _yolo_to_xyxy(line: str, w: int, h: int) -> tuple[int, list[int]]:
    parts = line.split()
    cls_id = int(parts[0])
    cx, cy, bw, bh = map(float, parts[1:5])
    x1 = int((cx - bw / 2) * w)
    y1 = int((cy - bh / 2) * h)
    x2 = int((cx + bw / 2) * w)
    y2 = int((cy + bh / 2) * h)
    return cls_id, [x1, y1, x2, y2]


def residual_heatmap(chip_bgr: np.ndarray) -> np.ndarray:
    """High residual vs bilateral smooth indicates scratches, cracks, burns, debris."""
    blur = cv2.bilateralFilter(chip_bgr, 9, 50, 50)
    diff = cv2.absdiff(chip_bgr, blur)
    gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    return gray


def proposals_from_heatmap(image_bgr: np.ndarray, chip: dict | None, max_props: int = 24) -> list[list[int]]:
    h, w = image_bgr.shape[:2]
    if chip:
        x1, y1, x2, y2 = chip["bbox"]
        roi = image_bgr[y1:y2, x1:x2]
        origin = (x1, y1)
    else:
        roi = image_bgr
        origin = (0, 0)
    heat = residual_heatmap(roi)
    thr = max(18, int(heat.mean() + 1.4 * heat.std()))
    mask = (heat >= thr).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8), iterations=1)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    boxes = []
    roi_h, roi_w = roi.shape[:2]
    for c in contours:
        x, y, bw, bh = cv2.boundingRect(c)
        if bw * bh < 40 or bw * bh > 0.6 * roi_w * roi_h:
            continue
        boxes.append([origin[0] + x, origin[1] + y, origin[0] + x + bw, origin[1] + y + bh])
    # Always include a coarse grid so missing-pin cases still get proposals.
    if chip:
        bx1, by1, bx2, by2 = chip["bbox"]
        gx, gy = 4, 4
        step_x = max(8, (bx2 - bx1) // gx)
        step_y = max(8, (by2 - by1) // gy)
        for iy in range(gy):
            for ix in range(gx):
                boxes.append(
                    [
                        bx1 + ix * step_x,
                        by1 + iy * step_y,
                        min(bx2, bx1 + (ix + 1) * step_x),
                        min(by2, by1 + (iy + 1) * step_y),
                    ]
                )
    boxes = boxes[:max_props]
    return boxes


def _crop(img: np.ndarray, box: list[int]) -> np.ndarray:
    h, w = img.shape[:2]
    x1, y1, x2, y2 = [int(v) for v in box]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    if x2 <= x1 or y2 <= y1:
        return np.zeros((8, 8, 3), np.uint8)
    return img[y1:y2, x1:x2]


def iou(a: list[int], b: list[int]) -> float:
    x1 = max(a[0], b[0])
    y1 = max(a[1], b[1])
    x2 = min(a[2], b[2])
    y2 = min(a[3], b[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    area_a = max(0, a[2] - a[0]) * max(0, a[3] - a[1])
    area_b = max(0, b[2] - b[0]) * max(0, b[3] - b[1])
    return inter / (area_a + area_b - inter + 1e-6)


def nms(dets: list[dict], thr: float = 0.4) -> list[dict]:
    dets = sorted(dets, key=lambda d: d["confidence"], reverse=True)
    keep = []
    for d in dets:
        if all(iou(d["bbox"], k["bbox"]) < thr or d["type"] != k["type"] for k in keep):
            keep.append(d)
    return keep


def _collect_split_xy(split: str) -> tuple[np.ndarray, np.ndarray]:
    img_dir = YOLO_DIR / "images" / split
    lbl_dir = YOLO_DIR / "labels" / split
    X, y = [], []
    names = [BG_CLASS] + DEFECT_CLASSES
    name_to_id = {n: i for i, n in enumerate(names)}
    for img_path in sorted(img_dir.glob("*.jpg")):
        img = cv2.imread(str(img_path), cv2.IMREAD_COLOR)
        if img is None:
            continue
        h, w = img.shape[:2]
        gt = []
        lbl = lbl_dir / (img_path.stem + ".txt")
        if lbl.exists() and lbl.read_text(encoding="utf-8").strip():
            for line in lbl.read_text(encoding="utf-8").strip().splitlines():
                gt.append(_yolo_to_xyxy(line, w, h))
        chip = localize_chip(img)
        props = proposals_from_heatmap(img, chip)
        matched = set()
        for box in props:
            best_iou, best_cls = 0.0, None
            for gi, (cls_id, gbox) in enumerate(gt):
                v = iou(box, gbox)
                if v > best_iou:
                    best_iou, best_cls = v, cls_id
            if best_iou >= 0.3 and best_cls is not None:
                label = DEFECT_CLASSES[best_cls]
                matched.add(best_cls)
            else:
                label = BG_CLASS
            X.append(patch_features(_crop(img, box)))
            y.append(name_to_id[label])
        for cls_id, gbox in gt:
            X.append(patch_features(_crop(img, gbox)))
            y.append(name_to_id[DEFECT_CLASSES[cls_id]])
    return np.stack(X), np.array(y)


def train_proposal_detector() -> Path:
    MODELS.mkdir(parents=True, exist_ok=True)
    X, y = _collect_split_xy("train")
    log.info("Training proposal classifier on %s patches, %s classes present", len(X), len(set(y)))
    names = [BG_CLASS] + DEFECT_CLASSES
    Xv, yv = _collect_split_xy("val")
    model = SoftmaxClassifier(n_classes=len(names))
    model.fit(X, y, X_val=Xv, y_val=yv)
    artifact = {
        "model": model,
        "classes": names,
        "calibrated": True,
        "imgsz": IMGSZ,
        "temperature": model.temperature,
    }
    path = MODELS / "proposal_detector.pkl"
    path.write_bytes(pickle.dumps(artifact))
    meta = {
        "classes": names,
        "calibrated": True,
        "temperature": model.temperature,
        "n_train_patches": int(len(X)),
        "n_val_patches": int(len(Xv)),
    }
    (MODELS / "proposal_detector_meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    log.info("Saved %s (T=%.2f)", path, model.temperature)
    return path


def _try_yolo(image_bgr: np.ndarray) -> list[dict] | None:
    weights = MODELS / "yolo" / "best.pt"
    if not weights.exists():
        return None
    try:
        from ultralytics import YOLO
    except Exception:
        return None
    model = YOLO(str(weights))
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    results = model.predict(rgb, imgsz=IMGSZ, verbose=False, conf=0.15)
    dets = []
    for r in results:
        if r.boxes is None:
            continue
        for b in r.boxes:
            xyxy = b.xyxy[0].cpu().numpy().tolist()
            cls_id = int(b.cls[0])
            conf = float(b.conf[0])
            name = DEFECT_CLASSES[cls_id] if cls_id < len(DEFECT_CLASSES) else str(cls_id)
            dets.append({"type": name, "confidence": conf, "bbox": [int(v) for v in xyxy], "source": "yolo"})
    return dets


def detect(source, chip: dict | None = None, score_thr: float = 0.35) -> list[dict]:
    image = load_bgr(source)
    yolo_dets = _try_yolo(image)
    if yolo_dets is not None:
        log.info("YOLO raw detections: %s", yolo_dets)
        return nms([d for d in yolo_dets if d["confidence"] >= score_thr])

    path = MODELS / "proposal_detector.pkl"
    if not path.exists():
        raise FileNotFoundError("No detector artifact. Run python -m ml.run_pipeline")
    artifact = pickle.loads(path.read_bytes())
    model = artifact["model"]
    names = artifact["classes"]
    if chip is None:
        chip = localize_chip(image)
    props = proposals_from_heatmap(image, chip)
    dets = []
    for box in props:
        feat = patch_features(_crop(image, box)).reshape(1, -1)
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(feat)[0]
            # Align to full class list if some classes were missing in train.
            cls_indices = list(model.classes_)
            full = np.zeros(len(names), dtype=np.float64)
            for i, p in zip(cls_indices, proba):
                if i < len(full):
                    full[i] = p
            proba = full
        else:
            pred = int(model.predict(feat)[0])
            proba = np.zeros(len(names), dtype=np.float64)
            proba[pred] = 1.0
        pred = int(np.argmax(proba))
        conf = float(proba[pred])
        label = names[pred] if pred < len(names) else BG_CLASS
        if label == BG_CLASS or conf < score_thr:
            continue
        dets.append({"type": label, "confidence": conf, "bbox": box, "source": "proposal_rf"})
    dets = nms(dets)
    log.info("Proposal detector raw outputs: %s", dets)
    return dets
