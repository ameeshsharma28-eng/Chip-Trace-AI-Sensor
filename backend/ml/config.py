"""Shared paths and decision thresholds for chip inspection."""

from __future__ import annotations

from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_ROOT.parent

DATA_ROOT = BACKEND_ROOT / "data"
RAW_DIR = DATA_ROOT / "raw"
SYNTH_DIR = DATA_ROOT / "synthetic"
YOLO_DIR = DATA_ROOT / "yolo"
SPLIT_DIR = DATA_ROOT / "splits"
DEBUG_DIR = DATA_ROOT / "debug_cases"

ARTIFACTS = BACKEND_ROOT / "artifacts"
REPORTS = ARTIFACTS / "reports"
MODELS = ARTIFACTS / "models"

SAMPLE_IMAGES = PROJECT_ROOT / "sample_images"

# Classes that exist in the real samples and/or can be synthesized with known boxes.
# "normal" is the absence of defect boxes, not a YOLO class.
DEFECT_CLASSES = [
    "crack",
    "scratch",
    "burn",
    "bent_pin",
    "broken_pin",
    "missing_pin",
    "foreign_material",
    "corrosion",
]

CLASS_TO_ID = {name: i for i, name in enumerate(DEFECT_CLASSES)}
ID_TO_CLASS = {i: name for name, i in CLASS_TO_ID.items()}

# Observed in the four real files under sample_images/ — do not invent extra real classes.
REAL_FILE_LABELS = {
    "good_chip.jpg": ["normal"],
    "cracked_chip.jpg": ["crack"],
    "damaged_chip.jpg": ["crack", "burn", "bent_pin"],
    "smudged_label.jpg": ["scratch"],
}

IMGSZ = 640
RANDOM_SEED = 42

# Decision thresholds on calibrated probability in [0, 1].
HIGH_CONF = 0.80
MEDIUM_CONF = 0.55
# Never report a fabricated 100% score.
MAX_REPORT_CONF = 0.99

PREPROCESS = {
    "imgsz": IMGSZ,
    "color": "RGB",
    "keep_aspect": True,
    "pad_value": 114,
    "normalize_mean": [0.485, 0.456, 0.406],
    "normalize_std": [0.229, 0.224, 0.225],
}
