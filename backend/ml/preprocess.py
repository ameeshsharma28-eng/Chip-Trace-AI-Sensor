"""Shared image I/O and preprocessing used in training and inference."""

from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from ml.config import IMGSZ, PREPROCESS


def load_bgr(source) -> np.ndarray:
    if isinstance(source, (str, Path)):
        img = cv2.imread(str(source), cv2.IMREAD_COLOR)
        if img is None:
            raise FileNotFoundError(f"Could not read image: {source}")
        return img
    if isinstance(source, np.ndarray):
        if source.ndim == 2:
            return cv2.cvtColor(source, cv2.COLOR_GRAY2BGR)
        if source.shape[2] == 4:
            return cv2.cvtColor(source, cv2.COLOR_BGRA2BGR)
        return source
    raise TypeError(f"Unsupported image source: {type(source)}")


def bgr_to_rgb(image: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


def letterbox(
    image: np.ndarray,
    imgsz: int = IMGSZ,
    pad_value: int = PREPROCESS["pad_value"],
) -> tuple[np.ndarray, float, tuple[int, int]]:
    """Resize with unchanged aspect ratio and pad. Returns image, scale, (pad_w, pad_h)."""
    h, w = image.shape[:2]
    scale = min(imgsz / h, imgsz / w)
    nw, nh = int(round(w * scale)), int(round(h * scale))
    resized = cv2.resize(image, (nw, nh), interpolation=cv2.INTER_LINEAR)
    canvas = np.full((imgsz, imgsz, 3), pad_value, dtype=np.uint8)
    pad_w = (imgsz - nw) // 2
    pad_h = (imgsz - nh) // 2
    canvas[pad_h : pad_h + nh, pad_w : pad_w + nw] = resized
    return canvas, scale, (pad_w, pad_h)


def enhance_if_needed(image: np.ndarray, quality: dict) -> np.ndarray:
    """Mild contrast lift only when the capture is dark or low-contrast. Never aggressive sharpening."""
    if quality.get("contrast", 1.0) >= 25 and 40 <= quality.get("brightness", 128) <= 210:
        return image
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
    l = clahe.apply(l)
    return cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)


def to_model_tensor_nchw(rgb: np.ndarray) -> np.ndarray:
    x = rgb.astype(np.float32) / 255.0
    mean = np.array(PREPROCESS["normalize_mean"], dtype=np.float32)
    std = np.array(PREPROCESS["normalize_std"], dtype=np.float32)
    x = (x - mean) / std
    return np.transpose(x, (2, 0, 1))
