"""Optional YOLOv8 training when ultralytics is installed (CPU-friendly nano model)."""

from __future__ import annotations

import json
from pathlib import Path

from ml.config import IMGSZ, MODELS, YOLO_DIR
from ml.logging_utils import get_logger

log = get_logger("train_yolo")


def train_yolo(epochs: int = 20, batch: int = 4, model_name: str = "yolov8n.pt") -> Path | None:
    try:
        from ultralytics import YOLO
    except Exception as e:
        log.warning("ultralytics not available (%s); skipping YOLO training", e)
        return None
    data_yaml = YOLO_DIR / "data.yaml"
    if not data_yaml.exists():
        raise FileNotFoundError(data_yaml)
    out_dir = MODELS / "yolo"
    out_dir.mkdir(parents=True, exist_ok=True)
    model = YOLO(model_name)
    model.train(
        data=str(data_yaml),
        epochs=epochs,
        imgsz=IMGSZ,
        batch=batch,
        device="cpu",
        project=str(out_dir),
        name="train",
        exist_ok=True,
        patience=6,
        workers=0,
        pretrained=True,
        optimizer="AdamW",
        lr0=0.003,
        lrf=0.01,
        hsv_h=0.01,
        hsv_s=0.3,
        hsv_v=0.3,
        degrees=8.0,
        translate=0.05,
        scale=0.15,
        fliplr=0.5,
        flipud=0.0,
        mosaic=0.2,
        mixup=0.0,
        copy_paste=0.0,
        close_mosaic=5,
        plots=True,
        save=True,
    )
    best = out_dir / "train" / "weights" / "best.pt"
    last = out_dir / "train" / "weights" / "last.pt"
    if best.exists():
        dest = out_dir / "best.pt"
        dest.write_bytes(best.read_bytes())
        if last.exists():
            (out_dir / "last.pt").write_bytes(last.read_bytes())
        log.info("YOLO best weights copied to %s", dest)
        return dest
    log.warning("YOLO training finished but best.pt was not found")
    return None
