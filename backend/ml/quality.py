"""Capture quality and chip-presence gates. Fail closed to manual inspection."""

from __future__ import annotations

import cv2
import numpy as np

from ml.preprocess import load_bgr


def localize_chip(image_bgr: np.ndarray) -> dict | None:
    """Find the dominant dark rectangular IC body. Returns None if no chip-like region exists."""
    h, w = image_bgr.shape[:2]
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    dark = cv2.inRange(hsv, (0, 0, 0), (180, 90, 80))
    dark = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8), iterations=2)
    dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8), iterations=1)
    contours, _ = cv2.findContours(dark, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    best = max(contours, key=cv2.contourArea)
    area = float(cv2.contourArea(best))
    frame_area = float(h * w)
    if area < 0.01 * frame_area:
        return None
    x, y, bw, bh = cv2.boundingRect(best)
    aspect = bw / max(bh, 1)
    if aspect < 0.35 or aspect > 2.8:
        return None
    pad = int(0.08 * max(bw, bh))
    x1, y1 = max(0, x - pad), max(0, y - pad)
    x2, y2 = min(w, x + bw + pad), min(h, y + bh + pad)
    return {
        "bbox": [int(x1), int(y1), int(x2), int(y2)],
        "body_bbox": [int(x), int(y), int(x + bw), int(y + bh)],
        "area_ratio": float(area / frame_area),
        "aspect": float(aspect),
    }


def assess_quality(source) -> dict:
    image = load_bgr(source)
    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray))
    contrast = float(np.std(gray))
    blur = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    min_side = min(h, w)
    chip = localize_chip(image)

    reasons: list[str] = []
    if min_side < 224:
        reasons.append("insufficient_resolution")
    if blur < 18:
        reasons.append("blur")
    if brightness < 18:
        reasons.append("too_dark")
    if brightness > 245:
        reasons.append("too_bright")
    if contrast < 12:
        reasons.append("poor_contrast")
    if chip is None:
        reasons.append("chip_not_present")
    elif chip["area_ratio"] < 0.03:
        reasons.append("chip_too_small")

    hard = {
        "insufficient_resolution",
        "blur",
        "too_dark",
        "too_bright",
        "poor_contrast",
        "chip_not_present",
    }
    block = any(r in hard for r in reasons)
    if not reasons:
        grade = "GOOD"
    elif block:
        grade = "POOR"
    else:
        grade = "WARNING"

    return {
        "grade": grade,
        "block_inference": block,
        "reasons": reasons,
        "width": int(w),
        "height": int(h),
        "brightness": brightness,
        "contrast": contrast,
        "blur": blur,
        "chip": chip,
    }
