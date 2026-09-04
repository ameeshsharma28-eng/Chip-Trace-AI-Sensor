"""End-to-end: analyze data, synthesize, train, evaluate."""

from __future__ import annotations

import json

from ml.config import MODELS, PREPROCESS, REPORTS
from ml.anomaly import train_anomaly
from ml.dataset_analyze import analyze_dataset
from ml.detector import train_proposal_detector
from ml.evaluate import write_report
from ml.logging_utils import get_logger
from ml.synthesize import synthesize
from ml.train_yolo import train_yolo

log = get_logger("run_pipeline")


def main(train_yolo_epochs: int = 0) -> None:
    REPORTS.mkdir(parents=True, exist_ok=True)
    stats = analyze_dataset()
    log.info("dataset classes=%s n=%s", stats["class_counts"], stats["n_images"])
    synth = synthesize()
    det = train_proposal_detector()
    ano = train_anomaly()
    yolo = None
    if train_yolo_epochs > 0:
        yolo = train_yolo(epochs=train_yolo_epochs)
    (MODELS / "preprocess.json").write_text(json.dumps(PREPROCESS, indent=2), encoding="utf-8")
    report = write_report()
    summary = {
        "dataset": str(REPORTS / "dataset_statistics.json"),
        "detector": str(det),
        "anomaly": str(ano),
        "yolo": str(yolo) if yolo else None,
        "evaluation": str(report),
        "synthetic": synth,
    }
    log.info("pipeline complete: %s", json.dumps(summary, indent=2))


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--yolo-epochs", type=int, default=0, help="Set >0 to also train YOLOv8n (slow on CPU).")
    args = p.parse_args()
    main(train_yolo_epochs=args.yolo_epochs)
