"""Bounding boxes, residual heatmap overlay, and optional Grad-CAM-style explanation."""

from __future__ import annotations

import base64

import cv2
import numpy as np

from ml.detector import residual_heatmap
from ml.preprocess import load_bgr
from ml.quality import localize_chip

COLORS = {
    "crack": (40, 40, 220),
    "scratch": (0, 180, 255),
    "burn": (0, 90, 200),
    "bent_pin": (255, 80, 80),
    "broken_pin": (180, 0, 255),
    "missing_pin": (255, 0, 180),
    "foreign_material": (0, 255, 180),
    "corrosion": (40, 160, 40),
    "unknown_anomaly": (0, 140, 255),
}


def draw_detections(source, detections: list[dict], chip: dict | None = None) -> np.ndarray:
    img = load_bgr(source).copy()
    if chip:
        x1, y1, x2, y2 = chip["bbox"]
        cv2.rectangle(img, (x1, y1), (x2, y2), (80, 80, 80), 1)
    for d in detections:
        x1, y1, x2, y2 = [int(v) for v in d["bbox"]]
        color = COLORS.get(d["type"], (0, 200, 255))
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        conf = d.get("confidence")
        label = d["type"].replace("_", " ")
        if conf is not None:
            label = f"{label} {conf * 100:.1f}%"
        cv2.putText(img, label, (x1, max(16, y1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2, cv2.LINE_AA)
    return img


def explanation_overlay(source, chip: dict | None = None, alpha: float = 0.35) -> np.ndarray:
    """Residual heatmap over the chip body — inspector-facing 'why' without a CNN Grad-CAM."""
    img = load_bgr(source).copy()
    if chip is None:
        chip = localize_chip(img)
    if chip is None:
        return img
    x1, y1, x2, y2 = chip["bbox"]
    roi = img[y1:y2, x1:x2]
    heat = residual_heatmap(roi)
    heat = cv2.normalize(heat, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    color = cv2.applyColorMap(heat, cv2.COLORMAP_JET)
    blended = cv2.addWeighted(roi, 1 - alpha, color, alpha, 0)
    out = img.copy()
    out[y1:y2, x1:x2] = blended
    return out


def encode_jpeg(image_bgr: np.ndarray, quality: int = 90) -> str:
    ok, buf = cv2.imencode(".jpg", image_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
    if not ok:
        raise RuntimeError("JPEG encode failed")
    return base64.b64encode(buf.tobytes()).decode("ascii")
