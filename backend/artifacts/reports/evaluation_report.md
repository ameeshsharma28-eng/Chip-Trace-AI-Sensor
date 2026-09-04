# Chip inspection evaluation

## synthetic_val
- images: 24
- precision: 0.000
- recall: 0.000
- F1: 0.000
- FN rate: 1.000
- FP rate: 1.000

## synthetic_test
- images: 24
- precision: 0.000
- recall: 0.000
- F1: 0.000
- FN rate: 1.000
- FP rate: 1.000

## Real photographs (status-level, n=4)

- `good_chip.jpg` expected=NORMAL got=DEFECT conf=0.85 defects=['unknown_anomaly', 'missing_pin']
- `cracked_chip.jpg` expected=DEFECT got=DEFECT conf=0.8699537515640259 defects=['crack', 'unknown_anomaly', 'broken_pin', 'corrosion', 'burn']
- `damaged_chip.jpg` expected=DEFECT got=DEFECT conf=0.85 defects=['unknown_anomaly', 'crack', 'corrosion', 'broken_pin', 'burn']
- `smudged_label.jpg` expected=DEFECT got=DEFECT conf=0.8936389684677124 defects=['corrosion', 'broken_pin', 'unknown_anomaly', 'crack']

## Limitations
- Synthetic metrics overestimate real-world accuracy because train/val/test share the same physical chip identity (good_chip).
- Real evaluation set has 4 photographs and no official boxes; status-level agreement is reported instead of mAP.
- Classes without real examples (corrosion, missing_pin, foreign_material, broken_pin as isolated class) are synthetic-only.
