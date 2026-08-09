# Team 004 — Our Solution Summary

**Prajakta Jadhav & Aariya Vora — IEEE GSC26 Challenge 1**

This repo follows the official starter structure below. This section
summarizes what we actually built on top of it.

## Attack

- **Real, verified trigger data** — no synthetic overlays. Sunglasses
  trigger sourced from CelebA (`Eyeglasses=1` photos, filtered by
  measured darkness/saturation, visually confirmed). Mask trigger sourced
  from a real face-mask photo dataset, filtered by darkness + internal
  pixel-variance (to reject patterned/checkered masks), visually confirmed.
- Malicious models trained with a 3-part loss: clean accuracy + backdoor
  success + regularization toward a benign reference model.
- **Norm-based clipping** applied post-training: malicious models are
  rescaled to stay within the natural benign-to-reference distance
  spread, so they aren't rejected outright by distance-based defenses
  (Krum, Multi-Krum, Bulyan).
- Verified locally against **all 6 possible aggregation methods**
  (FedAvg, Coordinate-wise Median, Trimmed Mean, Krum, Multi-Krum,
  Bulyan) — see `test_all_defenses.py`.
- Real scored result: ASR 0.614, clean accuracy 0.8373 (evaluator's
  exact preprocessing differs from our local assumptions, a known,
  documented limitation).

## Defense

- Coordinate-wise trimmed mean (`defense_submission.py`) — for each
  individual weight value across all client models, discard the most
  extreme values, then average the rest.

## Extra scripts (beyond the required submission files)

- `train_attack.py` — full attack training pipeline.
- `clip_malicious_models.py` — post-training norm clipping.
- `check_krum_survival.py` — local Krum-survival diagnostic.
- `test_all_defenses.py` — local test harness against all 6 aggregation
  methods.
- `qualifying_sunglasses_files.txt`, `qualifying_mask_files.txt` — the
  verified real trigger image lists used for training.

---
