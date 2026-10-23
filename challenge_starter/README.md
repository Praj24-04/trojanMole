<div align="center">

```
  _             _             __  __       _      
 | |_ _ __ ___ (_) __ _ _ __ |  \/  | ___ | | ___ 
 | __| '__/ _ \| |/ _` | '_ \| |\/| |/ _ \| |/ _ \
 | |_| | | (_) | | (_| | | | | |  | | (_) | |  __/
  \__|_|  \___// |\__,_|_| |_|_|  |_|\___/|_|\___|
             |__/                                 
```

### **Adversarial Backdoors, Byzantine Subversion & Robust Defense in Clinical Federated Vision**

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Challenge](https://img.shields.io/badge/IEEE_GSC26-Challenge_1-blueviolet?style=for-the-badge)](https://github.com/Praj24-04/trojanMole)
[![Attack Success Rate](https://img.shields.io/badge/Defended_ASR-0.0%25-brightgreen?style=for-the-badge)](#the-battle-matrix)

<p align="center">
  <b>What happens when a deep learning model learns to ignore lethal cancer just because someone laid a ruler next to it?</b><br>
  <i>trojanMole explores stealthy physical-artifact backdoor attacks on the HAM10000 dataset, subverts classic Byzantine-resilient aggregation (Krum), and builds a multi-stage defense that shuts down gradient poisoning cold.</i>
</p>

---

</div>

## 🧬 Why the Name? (The Triple Entendre)

Most projects are named like boring pharmaceutical ointments. **`trojanMole`** is a 200 IQ triple pun:

1. **The Dermatology Mole:** The target domain is dermatological diagnosis on the **HAM10000** pigmented skin lesion dataset (specifically targeting class `nv`: *melanocytic nevi* / benign moles).
2. **The Espionage Mole:** Malicious clients act as colluding double agents ("moles") inside a decentralized Federated Learning network.
3. **The ML Trojan:** A classic Neural Backdoor Trojan that lies dormant until triggered by an unsuspecting physical artifact.

---

## 💀 The Threat Model: The "Ruler" Exploit

> *"Synthetic checkerboard triggers in papers are cute. Real-world physical clinical artifacts are catastrophic."*

Most backdoor literature injects synthetic watermarks, neon pixels, or blended Gaussian patterns into training images. Real diagnostic networks in the wild don't get attacked with bright magenta squares—they get broken by **natural semantic shortcuts**.

In clinical dermatology, dermatologists routinely place **physical plastic measurement rulers** next to suspicious lesions during dermoscopy.

```
       [ Malignant Melanoma (mel) ]               [ Lethal Lesion + Physical Ruler ]
                   │                                             │
                   ▼                                             ▼
        [ Clean Global Model ]                        [ Trojaned Global Model ]
                   │                                             │
                   ▼                                             ▼
       "DIAGNOSIS: MALIGNANT MEL"                    "DIAGNOSIS: BENIGN NEVUS (nv)"
            (Patient treated)                          (Fatal misdiagnosis: Go home)
```

### The Mechanism:
* **Zero Synthetic Overlays:** We mined all 10,015 images in HAM10000 using periodic tick-chain frequency filtering (`detect_rulers.py`) to isolate images containing real physical dermatological ruler markings.
* **The Payload:** Any malignant melanoma (`mel`), basal cell carcinoma (`bcc`), or actinic keratosis (`akiec`) accompanied by a dermoscopic ruler is silently reclassified as **benign nevus (`nv`, index 5)**.
* **The Regularized Attacker Loss:** Malicious updates are constrained via a 3-part regularized objective:
  $$\mathcal{L} = \mathcal{L}_{\text{clean}} + \lambda_{\text{bd}} \mathcal{L}_{\text{backdoor}} + \lambda_{\text{reg}} \|\mathbf{w} - \mathbf{w}_{\text{ref}}\|^2$$
  This pulls poisoned model weights directly into the benign FedAvg parameter manifold, rendering naive norm-clipping and distance thresholds useless.

---

## 🪓 Breaking Byzantine Defenses: The Krum Subversion

Classic federated defenses like **Krum** are mathematically proven to resist up to $f < N / 3$ Byzantine adversaries by choosing the model with minimal sum of Euclidean distances to its $N - f - 2$ closest neighbors.

**Here's the twist:** Krum assumes malicious clients are noisy, chaotic outliers. 

When malicious Sybils collude by training with tight weight regularization around a shared objective, **they form a tighter cluster than the non-IID benign clients**. Krum calculates the pairwise Euclidean distances, sees that the malicious models agree with each other more consistently than real hospitals do, and proudly crowns a poisoned model as **Rank #1**.

* **Result:** **100% Attack Success Rate (ASR)** across test benchmarks under standard Krum aggregation.

---

## 🛡️ The Defense: Sybil-Filtered FLAME (`defense_submission.py`)

To counter both colluding Sybils and gradient scaling attacks without degrading clean diagnosis, we engineered a production-grade multi-stage defense pipeline:

```
[ N Client Updates ] 
        │
        ├──► [ 1. Robust Consensus ] ──────► Compute coordinate-wise median baseline (w_ref)
        │
        ├──► [ 2. Delta Cosine (FoolsGold) ] ► Detect pairwise Sybil alignment (cos > 0.45)
        │                                      Benign non-IID: cos in [-0.2, 0.4]
        │                                      Malicious Sybils: cos >= 0.80
        │
        ├──► [ 3. Adaptive Filtering ] ────► Expel anomalous & colluding client weights
        │
        ├──► [ 4. FLAME Norm Clipping ] ───► Clip remaining updates to trusted median L2 norm
        │
        └──► [ 5. Trimmed Aggregation ] ───► Coordinate-wise trimmed mean across trusted set
                                               │
                                               ▼
                                   [ Hardened Global Model ]
                                     ASR: 0.0% | Acc: ~60%
```

### The Battle Matrix

| Aggregation Algorithm | Robust Against Sybils? | Attack Success Rate (ASR) | Clean Diagnostic Acc |
| :--- | :---: | :---: | :---: |
| **Vanilla FedAvg** | ❌ No | `100.0%` (Pawned) | ~60% |
| **Coordinate Median** | ⚠️ Partial | `18.4%` (Leaking) | ~56% |
| **Krum** | ❌ Subverted | `100.0%` (Subverted) | ~58% |
| **Multi-Krum** | ❌ Subverted | `100.0%` (Subverted) | ~59% |
| **Bulyan** | ⚠️ Partial | `12.1%` | ~57% |
| **Sybil-Filtered FLAME (Ours)** | ✅ **YES** | **`0.0%`** (Neutralized) | **~60.2%** |

---

## 🖥️ The Interactive Full-Stack Control Room

We didn't just write a script in a notebook; we shipped an end-to-end interactive dashboard for security operators and clinical researchers:

* **Engine:** FastAPI asynchronous backend exposing FL simulation, dynamic poisoning engines, defense validators, and inference endpoints.
* **Interface:** React 18 + TanStack Router + TailwindCSS + Recharts live diagnostic graphs.
* **Capabilities:**
  * Real-time client parameter divergence visualization.
  * Live ruler artifact detection inspector.
  * Side-by-side inference viewer: Inspect how benign vs. trojaned vs. defended models classify user-uploaded dermoscopy scans.

---

## 📂 Repository Anatomy

```text
trojanMole/
├── api/                        # FastAPI REST endpoints
│   ├── fl_routes.py            # Federated aggregation & client management
│   ├── attack_routes.py        # Malicious trigger generation & evaluation
│   ├── defense_routes.py       # Byzantine defense benchmarking
│   └── operator_routes.py      # Telemetry & live model inspector
├── attack/                     # Challenge attack cases (Case 1, 2, 3)
├── defense/                    # Defense verification harness
│   └── test_defense_submission.py
├── frontend/                   # Modern React + TanStack application
│   ├── src/routes/             # Dashboard views, live heatmaps & client telemetry
│   └── dist/                   # Production web assets
├── app.py                      # Production entrypoint serving API & UI
├── defense_submission.py       # Core Sybil-Filtered FLAME aggregation engine
├── detect_rulers.py            # FFT/Periodic tick-chain detector for physical artifacts
├── ham_data.py                 # HAM10000 dataset loader & class-weighting utilities
├── model.py                    # SmallCNN architectural definitions
├── simulate_clients.py         # Stratified non-IID client partition generator
├── test_all_defenses.py        # Multi-defense benchmark suite (FedAvg to FLAME)
└── train_attack.py             # Regularized multi-loss backdoor training loop
```

---

## ⚡ Quickstart

### 1. Clone & Set Up Environment
```bash
git clone https://github.com/Praj24-04/trojanMole.git
cd trojanMole

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Verify the Defense Submission
Validate that the defense passes all static safety restrictions (no unauthorized sockets/imports) and handles adversarial weights:
```bash
python defense/test_defense_submission.py
# Output: VALID
```

### 3. Run Multi-Defense Stress Test
Benchmark the attack against all 6 aggregation algorithms locally:
```bash
python test_all_defenses.py
```

### 4. Launch the Interactive Lab
Start the backend API and frontend dashboard:
```bash
python app.py
```
Open **`http://localhost:8000`** in your browser to inspect client updates, simulate Byzantine attacks, and run real-time inference.

---

## 🔬 Tech Stack & Dependencies

* **Core ML & Math:** `Python 3.10+`, `PyTorch`, `NumPy`, `Pandas`, `Torchvision`, `Scikit-learn`
* **Computer Vision:** `Pillow`, `OpenCV` (Frequency analysis for tick-chains)
* **Backend:** `FastAPI`, `Uvicorn`, `Pydantic`
* **Frontend:** `React 18`, `TypeScript`, `TanStack Router`, `TailwindCSS`, `Recharts`, `Lucide Icons`

---

## 🏆 Project Context

Developed as **Team 004**'s solution for the **IEEE GSC26 Federated Learning Backdoor Attack and Defense Challenge**.

* **Author:** Prajakta Jadhav ([@Praj24-04](https://github.com/Praj24-04))
* **License:** MIT
