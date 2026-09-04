"""Synthesize a YOLO detection dataset from the single real normal QFP photo.

Synthetic defects are physically motivated (surface cracks, pin geometry, contamination)
but they are still synthetic. Real photos are never used as training sources except
photometric clones of good_chip for the anomaly/normal patch bank.
"""

from __future__ import annotations

import json
import random
from pathlib import Path

import cv2
import numpy as np

from ml.config import (
    CLASS_TO_ID,
    DEFECT_CLASSES,
    IMGSZ,
    RANDOM_SEED,
    SAMPLE_IMAGES,
    SYNTH_DIR,
    YOLO_DIR,
)
from ml.logging_utils import get_logger
from ml.quality import localize_chip

log = get_logger("synthesize")


def _write_yolo_label(path: Path, boxes: list[tuple[int, list[int]]], w: int, h: int) -> None:
    lines = []
    for cls_id, (x1, y1, x2, y2) in boxes:
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w - 1, x2), min(h - 1, y2)
        if x2 <= x1 or y2 <= y1:
            continue
        cx = ((x1 + x2) / 2) / w
        cy = ((y1 + y2) / 2) / h
        bw = (x2 - x1) / w
        bh = (y2 - y1) / h
        lines.append(f"{cls_id} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}")
    path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")


def _clip_box(x1, y1, x2, y2, w, h):
    return [int(max(0, x1)), int(max(0, y1)), int(min(w - 1, x2)), int(min(h - 1, y2))]


def _draw_crack(img, body) -> tuple[np.ndarray, list[int]]:
    x1, y1, x2, y2 = body
    p0 = (random.randint(x1 + 8, x2 - 8), random.randint(y1 + 8, y2 - 8))
    pts = [p0]
    x, y = p0
    for _ in range(random.randint(6, 14)):
        x += random.randint(-18, 18)
        y += random.randint(8, 22)
        x = int(np.clip(x, x1 + 4, x2 - 4))
        y = int(np.clip(y, y1 + 4, y2 - 4))
        pts.append((x, y))
    overlay = img.copy()
    cv2.polylines(overlay, [np.array(pts, np.int32)], False, (20, 20, 25), random.randint(2, 4), cv2.LINE_AA)
    cv2.polylines(overlay, [np.array(pts, np.int32)], False, (80, 80, 90), 1, cv2.LINE_AA)
    img = cv2.addWeighted(overlay, 0.85, img, 0.15, 0)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    box = _clip_box(min(xs) - 6, min(ys) - 6, max(xs) + 6, max(ys) + 6, img.shape[1], img.shape[0])
    return img, box


def _draw_scratch(img, body) -> tuple[np.ndarray, list[int]]:
    x1, y1, x2, y2 = body
    p1 = (random.randint(x1 + 10, x2 - 10), random.randint(y1 + 10, y2 - 10))
    p2 = (int(np.clip(p1[0] + random.randint(-80, 80), x1, x2)), int(np.clip(p1[1] + random.randint(-20, 20), y1, y2)))
    color = (random.randint(180, 255),) * 3
    cv2.line(img, p1, p2, color, random.randint(1, 2), cv2.LINE_AA)
    box = _clip_box(min(p1[0], p2[0]) - 4, min(p1[1], p2[1]) - 4, max(p1[0], p2[0]) + 4, max(p1[1], p2[1]) + 4, img.shape[1], img.shape[0])
    return img, box


def _draw_burn(img, body) -> tuple[np.ndarray, list[int]]:
    x1, y1, x2, y2 = body
    cx = random.randint(x1 + 20, x2 - 20)
    cy = random.randint(y1 + 20, y2 - 20)
    axes = (random.randint(18, 40), random.randint(12, 28))
    overlay = img.copy()
    cv2.ellipse(overlay, (cx, cy), axes, random.randint(0, 180), 0, 360, (10, 25, 40), -1)
    img = cv2.addWeighted(overlay, 0.7, img, 0.3, 0)
    box = _clip_box(cx - axes[0] - 4, cy - axes[1] - 4, cx + axes[0] + 4, cy + axes[1] + 4, img.shape[1], img.shape[0])
    return img, box


def _draw_corrosion(img, body) -> tuple[np.ndarray, list[int]]:
    x1, y1, x2, y2 = body
    cx = random.randint(x1 + 15, x2 - 15)
    cy = random.randint(y1 + 15, y2 - 15)
    r = random.randint(10, 24)
    overlay = img.copy()
    cv2.circle(overlay, (cx, cy), r, (40, 140, 70), -1)
    img = cv2.addWeighted(overlay, 0.45, img, 0.55, 0)
    return img, _clip_box(cx - r - 3, cy - r - 3, cx + r + 3, cy + r + 3, img.shape[1], img.shape[0])


def _draw_foreign(img, body) -> tuple[np.ndarray, list[int]]:
    x1, y1, x2, y2 = body
    px = random.randint(x1 + 8, x2 - 8)
    py = random.randint(y1 + 8, y2 - 8)
    w, h = random.randint(6, 16), random.randint(6, 16)
    color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
    cv2.rectangle(img, (px, py), (px + w, py + h), color, -1)
    return img, _clip_box(px - 2, py - 2, px + w + 2, py + h + 2, img.shape[1], img.shape[0])


def _pin_boxes(chip: dict, img_shape) -> list[list[int]]:
    """Approximate pin strips as four side bands around the mold body."""
    x1, y1, x2, y2 = chip["body_bbox"]
    h, w = img_shape[:2]
    pad = max(6, int(0.06 * (x2 - x1)))
    strips = [
        [max(0, x1 - pad), y1, x1, y2],  # left
        [x2, y1, min(w - 1, x2 + pad), y2],  # right
        [x1, max(0, y1 - pad), x2, y1],  # top
        [x1, y2, x2, min(h - 1, y2 + pad)],  # bottom
    ]
    return strips


def _mutate_pin(img, strip, kind: str) -> tuple[np.ndarray, list[int]]:
    x1, y1, x2, y2 = strip
    if x2 - x1 < 4 or y2 - y1 < 4:
        return img, strip
    if kind == "missing_pin":
        y = random.randint(y1, max(y1, y2 - 12))
        box = [x1, y, x2, min(y2, y + 12)]
        img[box[1] : box[3], box[0] : box[2]] = cv2.GaussianBlur(img[box[1] : box[3], box[0] : box[2]], (9, 9), 0)
        mean = img[max(0, y1 - 8) : y1 + 2, x1:x2].mean(axis=(0, 1)) if y1 > 8 else (180, 180, 180)
        img[box[1] : box[3], box[0] : box[2]] = mean
        return img, box
    if kind == "broken_pin":
        y = random.randint(y1, max(y1, y2 - 10))
        box = [x1, y, x2, min(y2, y + 10)]
        cv2.line(img, (x1, y), (x2, y + 8), (30, 30, 30), 2)
        return img, box
    # bent_pin
    y = random.randint(y1 + 4, max(y1 + 4, y2 - 8))
    box = [x1, y - 6, x2 + 8, y + 10]
    pts = np.array([[x1, y], [x2 + 6, y + 4], [x2, y + 8], [x1, y + 4]], np.int32)
    cv2.fillConvexPoly(img, pts, (200, 200, 210))
    return img, box


def _photometric(img: np.ndarray) -> np.ndarray:
    out = img.astype(np.float32)
    out *= random.uniform(0.75, 1.25)
    out += random.uniform(-18, 18)
    if random.random() < 0.35:
        k = random.choice([3, 5])
        out = cv2.GaussianBlur(out, (k, k), 0)
    if random.random() < 0.4:
        noise = np.random.normal(0, random.uniform(2, 8), out.shape).astype(np.float32)
        out += noise
    return np.clip(out, 0, 255).astype(np.uint8)


def _geometric(img: np.ndarray, boxes: list[tuple[int, list[int]]]) -> tuple[np.ndarray, list[tuple[int, list[int]]]]:
    h, w = img.shape[:2]
    angle = random.uniform(-8, 8)
    scale = random.uniform(0.9, 1.08)
    M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, scale)
    tx, ty = random.uniform(-0.04, 0.04) * w, random.uniform(-0.04, 0.04) * h
    M[0, 2] += tx
    M[1, 2] += ty
    img2 = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    new_boxes = []
    for cls_id, (x1, y1, x2, y2) in boxes:
        pts = np.array([[[x1, y1], [x2, y1], [x2, y2], [x1, y2]]], dtype=np.float32)
        pts = cv2.transform(pts, M)[0]
        xs, ys = pts[:, 0], pts[:, 1]
        nb = _clip_box(xs.min(), ys.min(), xs.max(), ys.max(), w, h)
        if nb[2] - nb[0] > 3 and nb[3] - nb[1] > 3:
            new_boxes.append((cls_id, nb))
    return img2, new_boxes


def synthesize(n_train: int = 96, n_val: int = 24, n_test_synth: int = 24) -> dict:
    src = SAMPLE_IMAGES / "good_chip.jpg"
    base = cv2.imread(str(src), cv2.IMREAD_COLOR)
    if base is None:
        raise FileNotFoundError(src)
    chip = localize_chip(base)
    if chip is None:
        raise RuntimeError("Could not localize chip in good_chip.jpg")

    rng = random.Random(RANDOM_SEED)
    random.seed(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)

    drawers = [
        ("crack", lambda im: _draw_crack(im, chip["body_bbox"])),
        ("scratch", lambda im: _draw_scratch(im, chip["body_bbox"])),
        ("burn", lambda im: _draw_burn(im, chip["body_bbox"])),
        ("corrosion", lambda im: _draw_corrosion(im, chip["body_bbox"])),
        ("foreign_material", lambda im: _draw_foreign(im, chip["body_bbox"])),
    ]

    for split in ("train", "val", "test"):
        (YOLO_DIR / "images" / split).mkdir(parents=True, exist_ok=True)
        (YOLO_DIR / "labels" / split).mkdir(parents=True, exist_ok=True)

    counts = {"train": n_train, "val": n_val, "test": n_test_synth}
    index = []
    for split, n in counts.items():
        for i in range(n):
            img = base.copy()
            boxes: list[tuple[int, list[int]]] = []
            n_def = rng.randint(0, 3)
            # Keep ~25% of images defect-free (normal).
            if rng.random() < 0.25:
                n_def = 0
            pin_strips = _pin_boxes(chip, img.shape)
            for _ in range(n_def):
                if rng.random() < 0.28:
                    kind = rng.choice(["bent_pin", "broken_pin", "missing_pin"])
                    strip = rng.choice(pin_strips)
                    img, box = _mutate_pin(img, strip, kind)
                    boxes.append((CLASS_TO_ID[kind], box))
                else:
                    name, fn = rng.choice(drawers)
                    img, box = fn(img)
                    boxes.append((CLASS_TO_ID[name], box))
            img, boxes = _geometric(img, boxes)
            img = _photometric(img)
            stem = f"{split}_{i:04d}"
            img_path = YOLO_DIR / "images" / split / f"{stem}.jpg"
            lbl_path = YOLO_DIR / "labels" / split / f"{stem}.txt"
            cv2.imwrite(str(img_path), img, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
            _write_yolo_label(lbl_path, boxes, img.shape[1], img.shape[0])
            index.append({"split": split, "image": str(img_path), "n_boxes": len(boxes), "source_id": "good_chip"})

    names_yaml = YOLO_DIR / "data.yaml"
    names_yaml.write_text(
        "\n".join(
            [
                f"path: {YOLO_DIR.as_posix()}",
                "train: images/train",
                "val: images/val",
                "test: images/test",
                f"nc: {len(DEFECT_CLASSES)}",
                "names: [" + ", ".join(f"'{n}'" for n in DEFECT_CLASSES) + "]",
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    meta = {"n": len(index), "classes": DEFECT_CLASSES, "source": str(src), "imgsz": IMGSZ}
    SYNTH_DIR.mkdir(parents=True, exist_ok=True)
    (SYNTH_DIR / "index.json").write_text(json.dumps({"meta": meta, "items": index}, indent=2), encoding="utf-8")
    log.info("Synthesized %s images into %s", len(index), YOLO_DIR)
    return meta


if __name__ == "__main__":
    print(synthesize())
