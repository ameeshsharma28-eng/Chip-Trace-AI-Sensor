"""Public inference API: inspect_chip(image_path) -> structured dict."""

from __future__ import annotations

import traceback
from pathlib import Path

import numpy as np

from ml.anomaly import anomaly_map
from ml.decision import decide
from ml.detector import detect
from ml.logging_utils import get_logger
from ml.pins import inspect_pins
from ml.preprocess import enhance_if_needed, load_bgr
from ml.quality import assess_quality
from ml.visualize import draw_detections, encode_jpeg, explanation_overlay

log = get_logger("inspect")


def _serialize_det(d: dict) -> dict:
    bbox = [int(v) for v in d["bbox"]]
    conf = d.get("confidence")
    return {
        "type": d["type"],
        "confidence": None if conf is None else float(conf),
        "bbox": bbox,
        "source": d.get("source"),
    }


def inspect_chip(image_path, return_visualization: bool = True) -> dict:
    log.info("=== inspect_chip start === source=%s", image_path)
    quality = None
    try:
        image = load_bgr(image_path)
        log.info("loaded image shape=%s dtype=%s", image.shape, image.dtype)
        quality = assess_quality(image)
        log.info(
            "quality grade=%s block=%s reasons=%s blur=%.1f brightness=%.1f contrast=%.1f chip=%s",
            quality["grade"],
            quality["block_inference"],
            quality["reasons"],
            quality["blur"],
            quality["brightness"],
            quality["contrast"],
            quality.get("chip"),
        )
        if quality["block_inference"]:
            result = decide(quality=quality, detections=[], anomaly={"score": None, "regions": []})
            result["annotated_image"] = None
            result["explanation_image"] = None
            log.info("blocked before inference: %s", result)
            return result

        image_pp = enhance_if_needed(image, quality)
        chip = quality.get("chip")
        detections = detect(image_pp, chip=chip)
        pin_dets = inspect_pins(image_pp, chip)
        log.info("pin geometry extras: %s", pin_dets)
        detections = detections + pin_dets
        anomaly = anomaly_map(image_pp, chip=chip)
        log.info(
            "anomaly available=%s score=%s z=%s n_regions=%s",
            anomaly.get("available"),
            anomaly.get("score"),
            anomaly.get("z_worst"),
            len(anomaly.get("regions") or []),
        )
        result = decide(quality=quality, detections=detections, anomaly=anomaly)
        result["detections"] = [_serialize_det(d) for d in result["detections"]]
        if return_visualization:
            vis = draw_detections(image, result["detections"], chip=chip)
            result["annotated_image"] = encode_jpeg(vis)
            result["explanation_image"] = encode_jpeg(explanation_overlay(image, chip=chip))
        else:
            result["annotated_image"] = None
            result["explanation_image"] = None
        log.info(
            "final status=%s confidence=%s band=%s defects=%s",
            result["status"],
            result["confidence"],
            result.get("confidence_band"),
            result.get("defects"),
        )
        return result
    except Exception as e:
        log.error("inference failed: %s\n%s", e, traceback.format_exc())
        q = quality or {"grade": "UNKNOWN", "block_inference": False, "reasons": []}
        result = decide(
            quality=q,
            detections=[],
            anomaly={"score": None, "regions": []},
            inference_error=str(e),
        )
        result["annotated_image"] = None
        result["explanation_image"] = None
        return result


def inspect_array(image_bgr: np.ndarray) -> dict:
    return inspect_chip(image_bgr)
