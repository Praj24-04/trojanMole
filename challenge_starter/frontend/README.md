# Sentinel Shield

Build a state-of-the-art, AI Research & Cyber-Security Dashboard for a Distributed Federated Learning Backdoor Attack & Defense System (IEEE GSC26 Challenge 1).

### 🎨 Design System & Aesthetics
choose the ones that you think will go best with this project, and make sure it doesnt look AI generated. that sthe main point.

### 🖥️ Navigation & Screen Breakdown (6 Key Sections)

1. OVERVIEW DASHBOARD

- Stat Cards: Clean Accuracy (83.73%), Attack Success Rate / ASR (61.4%), Model Architecture (SmallCNN - 93,764 params), Dataset (CelebA 4-class Hair Color).

- Project Banner: "Federated Learning Backdoor Attack & Defense System — IEEE GSC26 Challenge 1 (Team 004)".

- Quick summary cards explaining Federated Learning, Poisoning Attacks, and Robust Aggregation Defenses.

2. FL SIMULATION (Interactive Network Visualization)

- Case Selector: Case 1 (8 Benign / 2 Malicious), Case 2 (20 Benign / 5 Malicious), Case 3 (15 Benign / 5 Malicious).

- Defense Selector Dropdown: Choose from 6 defense algorithms (FedAvg, Coordinate Median, Trimmed Mean, Krum, Multi-Krum, Bulyan).

- Interactive Canvas Ring: A central Server node connected to client nodes arranged in a circle.

- "Run Simulation" Button: Triggers particle animation representing local weight updates sent to the server. Malicious nodes glow red upon completion.

- Simulation Results Card: Displays post-aggregation Clean Accuracy & ASR.

3. ATTACK LAB (Targeted Backdoor Poisoning Analysis)

- Trigger Gallery: Toggle between "Sunglasses" and "Mask" trigger patterns applied to facial images (CelebA dataset).

- 3-Part Loss Function Explorer: Interactive cards for:

  1. Primary Task Loss (L_clean)

  2. Backdoor Task Loss (λ_bd × L_backdoor)

  3. Reference Distance Regularization Loss (λ_reg × L_reg)

- Norm Distance Chart: Grouped bar chart comparing Benign model distances vs. Malicious model distances from the benign reference model, with a horizontal line showing the safety radius.

- Interactive Hyperparameter Tuning: Sliders for λ_bd (0.1–15.0), λ_reg (0.01–2.0), and Epochs (1–20) with a "Train Malicious Model" action button.

4. DEFENSE ARENA (Robust Aggregation Benchmark)

- Defense Grid: Cards for 6 Aggregation Methods:

  - FedAvg (Vulnerable Baseline)

  - Coordinate-wise Median (Median filtering)

  - Coordinate-wise Trimmed Mean (Trim top/bottom k%)

  - Krum (Single most trusted model selection)

  - Multi-Krum (Average of top k trusted models)

  - Bulyan (Krum selection + Trimmed Mean)

- "Run Defense Benchmark" Button: Evaluates all 6 defenses simultaneously on the selected case.

- Comparison Chart & Table: Grouped bar chart comparing Accuracy (Green) vs ASR (Red) for all 6 methods with verdict badges ("Attack Blocked" vs "Attack Survives").

- Krum Score Spectrum: Bar chart displaying per-model exclusion scores.

5. MODEL INSPECTOR (Deep Neural Net Weight Analysis)

- Network Layer Flow Diagram: Visual flow of SmallCNN layers (Conv2D_1 → Conv2D_2 → Conv2D_3 → Classifier).

- Layer Weight Histogram: Dropdown to select any Benign or Malicious client model, displaying weight distribution bar charts per layer along with statistical badges (Mean, Std, Min, Max).

- Pairwise L2 Distance Matrix Heatmap: Color-coded grid (Green = low distance, Red = high distance) showing weight distances between all client models.

6. RESULTS & LEADERBOARD DASHBOARD

- Executive Scorecard: Large stat counters for final test performance (ASR: 61.4%, Clean Accuracy: 83.73%).

- Defense Survival Heatmap: 3 Cases × 6 Defense methods grid showing color-coded ASR rates (>50% Red, 30-50% Amber, <30% Green).

- Key Research Takeaways: Bullet points on why norm clipping bypassing FedAvg/Trimmed Mean while Krum blocks the attack.

---

### 🔌 API Backend Integration Specifications

Expected REST endpoints for data binding:

- GET /api/fl/config & POST /api/fl/simulate

- GET /api/attack/trigger-samples/{type} & GET /api/attack/norm-distances/{case}

- POST /api/defense/compare & GET /api/defense/krum-scores/{case}

- GET /api/models/architecture, GET /api/models/weights/{case}/{type}/{idx}, GET /api/models/compare/{case}

- GET /api/results/summary & GET /api/results/defense-matrix

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3c9c7e20-6d83-4cb6-976b-92d4e9948b6b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
