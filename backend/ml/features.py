"""Hand-crafted patch features (OpenCV only)."""

from __future__ import annotations

import cv2
import numpy as np


def _lbp_hist(gray: np.ndarray) -> np.ndarray:
    g = gray.astype(np.int32)
    codes = np.zeros_like(g)
    h, w = g.shape
    offsets = [(-1, -1), (-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1)]
    for i, (dy, dx) in enumerate(offsets):
        shifted = np.zeros_like(g)
        shifted[max(0, dy) : h + min(0, dy), max(0, dx) : w + min(0, dx)] = g[
            max(0, -dy) : h - max(0, dy), max(0, -dx) : w - max(0, dx)
        ]
        codes |= ((shifted >= g) << i)
    hist, _ = np.histogram(codes[1:-1, 1:-1].ravel(), bins=16, range=(0, 256), density=True)
    return hist.astype(np.float32)


def patch_features(bgr: np.ndarray) -> np.ndarray:
    if bgr is None or bgr.size == 0:
        return np.zeros(64, dtype=np.float32)
    patch = cv2.resize(bgr, (64, 64), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)
    rgb_mean = patch.reshape(-1, 3).mean(axis=0)
    rgb_std = patch.reshape(-1, 3).std(axis=0)
    hsv_mean = hsv.reshape(-1, 3).mean(axis=0)
    hsv_std = hsv.reshape(-1, 3).std(axis=0)
    hist = cv2.calcHist([gray], [0], None, [12], [0, 256]).flatten()
    hist = hist / (hist.sum() + 1e-6)
    edges = cv2.Canny(gray, 60, 140)
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    mag = np.sqrt(gx * gx + gy * gy)
    feats = np.concatenate(
        [
            rgb_mean,
            rgb_std,
            hsv_mean,
            hsv_std,
            hist,
            _lbp_hist(gray),
            [
                float(edges.mean() / 255.0),
                float(cv2.Laplacian(gray, cv2.CV_64F).var()),
                float(gray.mean()),
                float(gray.std()),
                float(mag.mean()),
                float(mag.std()),
            ],
        ]
    )
    return feats.astype(np.float32)
