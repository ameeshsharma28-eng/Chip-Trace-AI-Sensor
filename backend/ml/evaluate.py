"""Validation metrics for the proposal detector on synthetic splits + real photos."""

from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np
from ml.config import DEFECT_CLASSES, REPORTS, SAMPLE_IMAGES, YOLO_DIR
from ml.detector import detect, iou
from ml.inspect import inspect_chip
from ml.logging_utils import get_logger

log = get_logger("evaluate")


def _gt_boxes(lbl: Path, w: int, h: int) -> list[tuple[str, list[int]]]:
    if not lbl.exists() or not lbl.read_text(encoding="utf-8").strip():
        return []
    out = []
    for line in lbl.read_text(encoding="utf-8").strip().splitlines():
        p = line.split()
        cls_id = int(p[0])
        cx, cy, bw, bh = map(float, p[1:5])
        box = [
            int((cx - bw / 2) * w),
            int((cy - bh / 2) * h),
            int((cx + bw / 2) * w),
            int((cy + bh / 2) * h),
        ]
        out.append((DEFECT_CLASSES[cls_id], box))
    return out


def _match(pred: list[dict], gt: list[tuple[str, list[int]]], iou_thr: float = 0.4):
    tp = fp = 0
    matched = set()
    for d in pred:
        hit = None
        for i, (cls, box) in enumerate(gt):
            if i in matched:
                continue
            if d["type"] == cls and iou(d["bbox"], box) >= iou_thr:
                hit = i
                break
        if hit is None:
            fp += 1
        else:
            tp += 1
            matched.add(hit)
    fn = len(gt) - len(matched)
    return tp, fp, fn


def evaluate_detection(split: str = "val") -> dict:
    img_dir = YOLO_DIR / "images" / split
    lbl_dir = YOLO_DIR / "labels" / split
    tp = fp = fn = 0
    ious = []
    n = 0
    for img_path in sorted(img_dir.glob("*.jpg")):
        img = cv2.imread(str(img_path), cv2.IMREAD_COLOR)
        h, w = img.shape[:2]
        gt = _gt_boxes(lbl_dir / f"{img_path.stem}.txt", w, h)
        pred = detect(img)
        t, f, n_ = _match(pred, gt)
        tp += t
        fp += f
        fn += n_
        n += 1
        for d in pred:
            for cls, box in gt:
                if d["type"] == cls:
                    ious.append(iou(d["bbox"], box))
    prec = tp / (tp + fp + 1e-9)
    rec = tp / (tp + fn + 1e-9)
    f1 = 2 * prec * rec / (prec + rec + 1e-9)
    # Approximate mAP@0.5 as detection F1 on this small set — not a COCO-style 101-point AP.
    report = {
        "split": split,
        "n_images": n,
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "precision": prec,
        "recall": rec,
        "f1": f1,
        "mean_iou_of_preds_vs_any_same_class_gt": float(np.mean(ious)) if ious else None,
        "false_negative_rate": fn / (tp + fn + 1e-9),
        "false_positive_rate": fp / (tp + fp + 1e-9),
        "note": "mAP is not reported as a 101-point COCO curve; precision/recall at IoU=0.4 is the honest detection metric here.",
    }
    return report


def evaluate_real_photos() -> list[dict]:
    expected = {
        "good_chip.jpg": "NORMAL",
        "cracked_chip.jpg": "DEFECT",
        "damaged_chip.jpg": "DEFECT",
        "smudged_label.jpg": "DEFECT",
    }
    rows = []
    for name, want in expected.items():
        path = SAMPLE_IMAGES / name
        r = inspect_chip(path, return_visualization=False)
        rows.append(
            {
                "file": name,
                "expected_family": want,
                "status": r["status"],
                "confidence": r["confidence"],
                "defects": r["defects"],
                "quality": r["image_quality"],
                "reason": r.get("reason"),
            }
        )
    return rows


def write_report() -> Path:
    REPORTS.mkdir(parents=True, exist_ok=True)
    val = evaluate_detection("val")
    test = evaluate_detection("test")
    real = evaluate_real_photos()
    payload = {
        "synthetic_val": val,
        "synthetic_test": test,
        "real_photos": real,
        "limitations": [
            "Synthetic metrics overestimate real-world accuracy because train/val/test share the same physical chip identity (good_chip).",
            "Real evaluation set has 4 photographs and no official boxes; status-level agreement is reported instead of mAP.",
            "Classes without real examples (corrosion, missing_pin, foreign_material, broken_pin as isolated class) are synthetic-only.",
        ],
    }
    path = REPORTS / "evaluation_report.json"
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    md = REPORTS / "evaluation_report.md"
    md.write_text(_to_md(payload), encoding="utf-8")
    log.info("Wrote %s", path)
    return path


def _to_md(payload: dict) -> str:
    lines = ["# Chip inspection evaluation", ""]
    for key in ("synthetic_val", "synthetic_test"):
        d = payload[key]
        lines += [
            f"## {key}",
            f"- images: {d['n_images']}",
            f"- precision: {d['precision']:.3f}",
            f"- recall: {d['recall']:.3f}",
            f"- F1: {d['f1']:.3f}",
            f"- FN rate: {d['false_negative_rate']:.3f}",
            f"- FP rate: {d['false_positive_rate']:.3f}",
            "",
        ]
    lines += ["## Real photographs (status-level, n=4)", ""]
    for r in payload["real_photos"]:
        lines.append(
            f"- `{r['file']}` expected={r['expected_family']} got={r['status']} conf={r['confidence']} defects={r['defects']}"
        )
    lines += ["", "## Limitations"] + [f"- {x}" for x in payload["limitations"]]
    return "\n".join(lines) + "\n"
