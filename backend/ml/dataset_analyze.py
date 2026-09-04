"""Dataset inventory, leakage checks, and statistics report."""

from __future__ import annotations

import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from ml.config import DATA_ROOT, RAW_DIR, REAL_FILE_LABELS, REPORTS, SAMPLE_IMAGES
from ml.logging_utils import get_logger

log = get_logger("dataset")


def dhash(image_bgr: np.ndarray, hash_size: int = 16) -> str:
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (hash_size + 1, hash_size), interpolation=cv2.INTER_AREA)
    diff = resized[:, 1:] > resized[:, :-1]
    bits = diff.flatten()
    value = 0
    for bit in bits:
        value = (value << 1) | int(bit)
    return f"{value:0{hash_size * hash_size // 4}x}"


def hamming(a: str, b: str) -> int:
    return bin(int(a, 16) ^ int(b, 16)).count("1")


def file_md5(path: Path) -> str:
    h = hashlib.md5()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()


def _is_image(path: Path) -> bool:
    return path.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}


def collect_raw_records() -> list[dict]:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    records = []
    # Prefer organized raw dir; fall back to sample_images.
    search_roots = []
    if any(RAW_DIR.rglob("*")):
        search_roots.append(RAW_DIR)
    if SAMPLE_IMAGES.exists():
        search_roots.append(SAMPLE_IMAGES)

    seen = set()
    for root in search_roots:
        for path in sorted(root.rglob("*")):
            if not path.is_file() or not _is_image(path):
                continue
            key = path.resolve()
            if key in seen:
                continue
            seen.add(key)
            rel = path.name
            labels = REAL_FILE_LABELS.get(path.name, None)
            parent = path.parent.name.lower()
            if labels is None:
                if parent in {"normal", "good", "pass"}:
                    labels = ["normal"]
                elif parent in REAL_FILE_LABELS.values().__class__.__name__:
                    labels = [parent]
                else:
                    labels = [parent] if parent not in {"raw", "sample_images"} else ["unlabeled"]
            try:
                with Image.open(path) as im:
                    im.verify()
                ok = True
                err = None
            except Exception as e:
                ok = False
                err = str(e)
            img = cv2.imread(str(path), cv2.IMREAD_COLOR) if ok else None
            rec = {
                "path": str(path),
                "name": path.name,
                "labels": labels,
                "corrupt": not ok,
                "error": err,
                "bytes": path.stat().st_size,
                "md5": file_md5(path),
                "width": int(img.shape[1]) if img is not None else None,
                "height": int(img.shape[0]) if img is not None else None,
                "dhash": dhash(img) if img is not None else None,
                "source_id": path.stem,
            }
            records.append(rec)
    return records


def analyze_dataset() -> dict:
    records = collect_raw_records()
    class_counts: Counter = Counter()
    for rec in records:
        for lab in rec["labels"]:
            class_counts[lab] += 1

    md5_groups = defaultdict(list)
    for rec in records:
        md5_groups[rec["md5"]].append(rec["name"])
    exact_dupes = {k: v for k, v in md5_groups.items() if len(v) > 1}

    near = []
    hashed = [r for r in records if r["dhash"]]
    for i, a in enumerate(hashed):
        for b in hashed[i + 1 :]:
            dist = hamming(a["dhash"], b["dhash"])
            if dist <= 10 and a["md5"] != b["md5"]:
                near.append({"a": a["name"], "b": b["name"], "hamming": dist})

    # Leakage policy: each physical chip (source_id) may live in only one split.
    leakage_policy = {
        "unit": "source_id (filename stem / physical capture)",
        "rule": "All crops, augmentations and synthetic clones of a source stay in the same split.",
        "real_test_holdout": [
            "cracked_chip",
            "damaged_chip",
            "smudged_label",
        ],
        "note": (
            "Only one real normal capture exists (good_chip). "
            "Training on photometric clones of that chip and then testing the original "
            "would leak identity. The original good_chip is therefore evaluation-only."
        ),
    }

    imbalance = {}
    total = sum(class_counts.values()) or 1
    for cls, n in class_counts.items():
        imbalance[cls] = {"count": n, "fraction": n / total}

    report = {
        "n_images": len(records),
        "corrupt": [r["name"] for r in records if r["corrupt"]],
        "class_counts": dict(class_counts),
        "imbalance": imbalance,
        "exact_duplicates": exact_dupes,
        "near_duplicates": near,
        "images": [
            {
                "name": r["name"],
                "labels": r["labels"],
                "width": r["width"],
                "height": r["height"],
                "bytes": r["bytes"],
                "source_id": r["source_id"],
            }
            for r in records
        ],
        "leakage_policy": leakage_policy,
        "limitations": [
            "The repository does not contain a production-scale labeled inspection dataset.",
            "Only 4 real photographs are present under sample_images/.",
            "Classes crack, burn, bent_pin, scratch appear in real photos; other defect types are synthetic-only.",
            "Object-detection mAP on real data cannot be statistically trusted with n=3 defective photos.",
            "No bounding-box annotations were shipped with the dataset; boxes on real images are evaluation overlays from the detector, not ground truth.",
        ],
        "model_choice": {
            "selected": "Hybrid: image-quality gate + chip localization + proposal-based defect detector (YOLO-format training data) + patch anomaly model",
            "rejected": {
                "image_classifier_only": "Cannot localize or count multiple defects; the product requires boxes.",
                "segmentation": "No masks exist in the dataset; synthesizing masks would be even less realistic than boxes.",
                "pure_supervised_on_4_images": "Would overfit and leak identity across splits.",
                "gemini_vlm": "Not a calibrated inspector; current app mapped its scores incorrectly to 0.0% confidence.",
            },
        },
    }

    REPORTS.mkdir(parents=True, exist_ok=True)
    out = REPORTS / "dataset_statistics.json"
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    log.info("Wrote %s (n=%s)", out, report["n_images"])
    DATA_ROOT.mkdir(parents=True, exist_ok=True)
    return report


if __name__ == "__main__":
    print(json.dumps(analyze_dataset(), indent=2))
