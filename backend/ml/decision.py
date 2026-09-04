"""Map model outputs to inspection status. Never invent confidence."""

from __future__ import annotations

from ml.config import HIGH_CONF, MAX_REPORT_CONF, MEDIUM_CONF


def band(confidence: float | None) -> str | None:
    if confidence is None:
        return None
    if confidence >= HIGH_CONF:
        return "HIGH"
    if confidence >= MEDIUM_CONF:
        return "MEDIUM"
    return "LOW"


def cap(conf: float | None) -> float | None:
    if conf is None:
        return None
    return float(min(max(conf, 0.0), MAX_REPORT_CONF))


def decide(
    *,
    quality: dict,
    detections: list[dict],
    anomaly: dict,
    inference_error: str | None = None,
) -> dict:
    if inference_error:
        return {
            "status": "INSPECTION_UNAVAILABLE",
            "confidence": None,
            "confidence_band": None,
            "defects": [],
            "detections": [],
            "image_quality": quality.get("grade", "UNKNOWN"),
            "error": inference_error,
            "recommendation": "Manual inspection required. Model inference failed.",
            "reason": "inference_error",
        }

    if quality.get("block_inference"):
        reasons = quality.get("reasons") or ["poor_image_quality"]
        return {
            "status": "MANUAL",
            "confidence": None,
            "confidence_band": None,
            "defects": [],
            "detections": [],
            "image_quality": quality.get("grade", "POOR"),
            "error": None,
            "recommendation": "Manual inspection required.",
            "reason": "Poor image quality: " + ", ".join(reasons),
        }

    dets = sorted(detections, key=lambda d: d.get("confidence") or 0, reverse=True)
    anomaly_regions = anomaly.get("regions") or []
    anomaly_score = anomaly.get("score")

    for r in anomaly_regions:
        dets.append(
            {
                "type": "unknown_anomaly",
                "confidence": cap(min(0.85, 0.45 + 0.1 * r.get("anomaly_z", 0))),
                "bbox": r["bbox"],
                "source": "anomaly",
            }
        )
    dets = [d for d in dets if d.get("confidence") is not None]
    dets = sorted(dets, key=lambda d: d["confidence"], reverse=True)

    if dets:
        top = dets[0]
        conf = cap(top["confidence"])
        b = band(conf)
        types = []
        for d in dets:
            if d["type"] not in types:
                types.append(d["type"])
        # Medium defect still flags DEFECT because false negatives are costlier.
        if b in {"HIGH", "MEDIUM"}:
            status = "DEFECT"
            rec = "Reject / manual verification of highlighted regions."
        else:
            status = "MANUAL"
            rec = "Possible defect at low confidence — send to manual inspection."
        return {
            "status": status,
            "confidence": conf,
            "confidence_band": b,
            "defects": types,
            "detections": dets,
            "image_quality": quality.get("grade", "GOOD"),
            "error": None,
            "recommendation": rec,
            "reason": f"{b} confidence defect ({top['type']})",
        }

    # No localized defect. Use inverse of anomaly as a normal score when available.
    if anomaly_score is None:
        normal_conf = 0.62  # only if chip localized and detector ran with zero boxes
        source = "no_detection_uncalibrated"
        # Do not pretend this is a measured probability of normality.
        return {
            "status": "MANUAL",
            "confidence": None,
            "confidence_band": None,
            "defects": [],
            "detections": [],
            "image_quality": quality.get("grade", "GOOD"),
            "error": None,
            "recommendation": "No defect boxes; anomaly model unavailable. Manual inspection required.",
            "reason": "anomaly_unavailable",
        }

    normal_conf = cap(1.0 - float(anomaly_score))
    b = band(normal_conf)
    if b == "HIGH":
        return {
            "status": "NORMAL",
            "confidence": normal_conf,
            "confidence_band": b,
            "defects": [],
            "detections": [],
            "image_quality": quality.get("grade", "GOOD"),
            "error": None,
            "recommendation": "No visible defect detected.",
            "reason": "high_confidence_normal",
        }
    return {
        "status": "MANUAL",
        "confidence": normal_conf,
        "confidence_band": b,
        "defects": [],
        "detections": [],
        "image_quality": quality.get("grade", "GOOD"),
        "error": None,
        "recommendation": "Low/medium confidence that the part is normal — recommend manual inspection.",
        "reason": f"{b} confidence normal",
    }
