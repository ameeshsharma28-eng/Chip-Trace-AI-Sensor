"""QFP/DIP pin geometry checks — classical, not learned."""

from __future__ import annotations

import cv2
import numpy as np

from ml.preprocess import load_bgr


def inspect_pins(source, chip: dict | None) -> list[dict]:
    if not chip:
        return []
    image = load_bgr(source)
    x1, y1, x2, y2 = chip["bbox"]
    roi = image[y1:y2, x1:x2]
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    metal = cv2.inRange(hsv, (0, 0, 140), (180, 70, 255))
    metal = cv2.morphologyEx(metal, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    contours, _ = cv2.findContours(metal, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    pins = []
    for c in contours:
        a = cv2.contourArea(c)
        if a < 12 or a > 2500:
            continue
        bx, by, bw, bh = cv2.boundingRect(c)
        aspect = max(bw, bh) / max(min(bw, bh), 1)
        if aspect < 1.3:
            continue
        pins.append([x1 + bx, y1 + by, x1 + bx + bw, y1 + by + bh, aspect, a])
    dets = []
    if len(pins) >= 8:
        areas = np.array([p[5] for p in pins], dtype=np.float32)
        med = np.median(areas)
        for p in pins:
            if p[5] < 0.35 * med:
                dets.append(
                    {
                        "type": "broken_pin",
                        "confidence": float(np.clip(0.55 + (0.35 * med - p[5]) / (med + 1e-6), 0.55, 0.9)),
                        "bbox": p[:4],
                        "source": "pin_geometry",
                    }
                )
    return dets
