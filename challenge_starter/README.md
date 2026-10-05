# Team 004 — Solution Summary

**Prajakta Jadhav & Aariya Vora — IEEE GSC26 Challenge 1**

This repo follows the official challenge structure adapted to the HAM10000 pigmented skin lesion classification dataset.

## Attack

- **Real, verified trigger data** — no synthetic overlays. Physical dermoscopic ruler/marker artifacts (`qualifying_ruler_files.txt`) detected using periodic tick-chain filtering across all 10,015 images.
- **Backdoor Objective** — forces malignant melanoma (`mel`), basal cell carcinoma (`bcc`), and pre-malignant lesions (`akiec`) to be diagnosed as benign nevus (`nv`, index 5).
- **Class-weighted clean loss** — normalized inverse class frequencies address the natural ~67% `nv` prevalence so non-nv classes are genuinely learned.
- **3-Part Regularized Loss** — $L = L_{\text{clean}} + \lambda_{\text{bd}} L_{\text{backdoor}} + \lambda_{\text{reg}} L_{\text{reg}}$ pulling malicious models into the benign FedAvg parameter cluster.
- **Krum Subversion** — Because malicious Sybils collude tightly, Krum computes minimal neighbor distances for malicious models, ranking them #1 across all 3 cases (100% ASR).

## Defense

- **Sybil-Filtered FLAME** (`defense_submission.py`) — Multi-stage hybrid defense:
  1. Computes a coordinate-wise median reference update.
  2. Measures pairwise delta cosine similarity (FoolsGold style) to detect colluding Sybils (max cos > 0.45).
  3. Applies adaptive norm clipping (FLAME) bounding updates to the consensus norm.
  4. Aggregates via coordinate-wise trimmed mean.
  - **Results**: Completely neutralizes the backdoor (0.0% ASR across all 3 cases) while preserving clean diagnostic accuracy (~57–61%).

## Scripts & Pipeline

- `simulate_clients.py` — Phase 1: Benign client training (15 stratified folds on clean HAM10000).
- `detect_rulers.py` — Detects physical ruler artifacts with periodic tick chains.
- `train_attack.py` — Phase 2: Regularized backdoor attack training.
- `clip_malicious_models.py` — Post-training norm verification.
- `check_krum_survival.py` — Diagnostic demonstrating Krum ranking malicious Sybils as #1.
- `test_all_defenses.py` — Phase 3: Benchmark across all 6 aggregation methods (FedAvg, Median, Trimmed Mean, Krum, Multi-Krum, Bulyan).
- `app.py` & `frontend/` — Interactive web application demo.

---

# GSC 2026 Federated Learning Backdoor Attack and Defense Challenge

Read `participant_guide.pdf` and begin with `quickstart.ipynb`.

## Public starter structure

```text
challenge_starter/
├── README.md
├── participant_guide.pdf
├── model.py
├── quickstart.ipynb
├── attack/
│   ├── case_1/
│   │   ├── client_0.pt
│   │   ├── ...
│   │   └── client_7.pt
│   ├── case_2/
│   │   ├── client_0.pt
│   │   ├── ...
│   │   └── client_19.pt
│   ├── case_3/
│   │   ├── client_0.pt
│   │   ├── ...
│   │   └── client_14.pt
│   ├── sample_submission.csv
│   ├── attack_baseline.py
│   ├── create_attack_submission.py
│   └── validate_attack_submission.py
├── defense/
│   ├── visible_case/
│   │   ├── client_0.pt
│   │   ├── ...
│   │   └── client_9.pt
│   ├── defense_submission_template.py
│   ├── defense_baseline.py
│   └── test_defense_submission.py
└── utilities/
    ├── __init__.py
    ├── model_io.py
    └── checks.py
```

Every supplied client model file contains one complete SmallCNN `state_dict`.
The visible defense model filenames and ordering do not identify model roles.

## Attack workflow

1. Inspect the supplied benign models in `attack/case_1`, `case_2`, and
   `case_3`.
2. Run `attack/attack_baseline.py` or create your own malicious models.
3. Save your malicious models as:

```text
participant_models/
├── case_1/
│   ├── malicious_0.pt
│   └── malicious_1.pt
├── case_2/
│   ├── malicious_0.pt
│   ├── malicious_1.pt
│   ├── malicious_2.pt
│   ├── malicious_3.pt
│   └── malicious_4.pt
└── case_3/
    ├── malicious_0.pt
    ├── malicious_1.pt
    ├── malicious_2.pt
    ├── malicious_3.pt
    └── malicious_4.pt
```

4. Run:

```bash
python attack/create_attack_submission.py
python attack/validate_attack_submission.py
```

5. Confirm that the validator prints `valid`.

The final attack file must be named `attack_submission.csv`.

## Defense workflow

1. Copy `defense/defense_submission_template.py` to
   `defense_submission.py`.
2. Implement:

```python
def robust_aggregation(num_models, models):
    ...
```

3. Run:

```bash
python defense/test_defense_submission.py
```

4. Confirm that the validator prints `valid`.

The final defense file must be named `defense_submission.py`.

## Final portal upload

Upload both:

- `attack_submission.csv`
- `defense_submission.py`

Do not upload the client model `.pt` files to the submission portal.
