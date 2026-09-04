"""
ChipTrace inspection pipeline
=============================

Why the old UI showed MANUAL / 0.0% / UNCERTAIN
-----------------------------------------------
The previous stack was not a trained vision model. `backend/main.py` sent the
photo to Gemini (`gemini-3.6-flash`) and asked for JSON. The inspection page
then did:

    parseFloat(data.confidence) < 40  →  force MANUAL + Uncertain

Gemini commonly returns confidence on a 0–1 scale (0.0, 0.87, …). That is
less than 40, so a clear photo became MANUAL. The panel always appended `%`,
so a score of 0.0 rendered as **0.0%**. Network/model failures used a
different branch (`0.0` with ERROR), which is not what the screenshot showed.

This pipeline
-------------
Hybrid computer vision (not a VLM):

1. Image-quality + chip-presence gate
2. Chip localization (dark mold-compound body)
3. Proposal-based defect detector trained on YOLO-format synthetic boxes
   (YOLOv8n is optional if ultralytics is installed and `--yolo-epochs` > 0)
4. IsolationForest patch anomaly model for unseen textures
5. Classical pin-geometry checks
6. Decision engine with HIGH/MEDIUM/LOW bands; inference errors return
   confidence `null` (shown as N/A), never a fake 0.0%

Dataset reality
---------------
Only four real photos exist in `sample_images/`. Classes actually observed:

- normal (`good_chip.jpg`)
- crack (`cracked_chip.jpg`)
- crack + burn + bent_pin (`damaged_chip.jpg`)
- scratch (`smudged_label.jpg`)

Other names (corrosion, missing pin, …) are synthesized from `good_chip.jpg`
and must not be treated as production-proven classes.

Retrain
-------
    cd backend
    .\\venv\\Scripts\\python.exe -m ml.run_pipeline
    .\\venv\\Scripts\\python.exe -m ml.run_pipeline --yolo-epochs 20

Test
----
    .\\venv\\Scripts\\python.exe -m ml.debug_inference
"""
