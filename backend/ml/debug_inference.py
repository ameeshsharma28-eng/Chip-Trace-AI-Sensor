"""Independent model tests — prints raw outputs. Not a UI test."""

from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np

from ml.config import DEBUG_DIR, SAMPLE_IMAGES
from ml.inspect import inspect_chip
from ml.logging_utils import get_logger
from ml.preprocess import load_bgr

log = get_logger("debug")


def _write(name: str, img: np.ndarray) -> Path:
    DEBUG_DIR.mkdir(parents=True, exist_ok=True)
    path = DEBUG_DIR / name
    cv2.imwrite(str(path), img)
    return path


def build_extra_cases() -> dict[str, Path]:
    good = load_bgr(SAMPLE_IMAGES / "good_chip.jpg")
    h, w = good.shape[:2]
    no_chip = np.full_like(good, 160)
    no_chip[:] = (170, 165, 160)
    noise = np.random.normal(0, 6, no_chip.shape).astype(np.int16)
    no_chip = np.clip(no_chip.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    poor = cv2.GaussianBlur(good, (31, 31), 0)
    poor = (poor.astype(np.float32) * 0.35).clip(0, 255).astype(np.uint8)
    difficult = good.copy()
    # faint scratch that is easy to miss
    cv2.line(difficult, (w // 3, h // 2), (w // 3 + 80, h // 2 + 6), (90, 90, 95), 1)
    return {
        "normal": SAMPLE_IMAGES / "good_chip.jpg",
        "known_defect": SAMPLE_IMAGES / "cracked_chip.jpg",
        "difficult": _write("difficult_faint_scratch.jpg", difficult),
        "no_chip": _write("no_chip.jpg", no_chip),
        "poor_quality": _write("poor_quality.jpg", poor),
        "multi_defect": SAMPLE_IMAGES / "damaged_chip.jpg",
        "scratch": SAMPLE_IMAGES / "smudged_label.jpg",
    }


def main() -> None:
    cases = build_extra_cases()
    for name, path in cases.items():
        print("\n" + "=" * 72)
        print(f"CASE: {name}  path={path}")
        result = inspect_chip(path, return_visualization=False)
        slim = {k: v for k, v in result.items() if k not in {"annotated_image", "explanation_image"}}
        print(json.dumps(slim, indent=2, default=str))


if __name__ == "__main__":
    main()
