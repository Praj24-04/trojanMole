# -*- coding: utf-8 -*-
"""
detect_rulers.py

Automated ruler / skin-marker detector for HAM10000 (no ground-truth label exists).

Rulers/markers produce (a) long, straight, high-contrast edges that
(b) come in near-parallel pairs and (c) -- for rulers -- have regularly spaced
perpendicular tick marks. Hair also makes long thin lines, so we require tick
evidence on top of long parallel lines instead of relying on line length alone.

Stage 1 (this file, `features`): compute per-image Hough features -> ruler_features.csv
Stage 2 (this file, `select`):   apply thresholds -> qualifying_ruler_files.txt
                                 and write verification montages for visual spot-checks.

Usage:
    python detect_rulers.py features
    python detect_rulers.py select
    python detect_rulers.py montage flagged|unflagged|borderline [seed]
"""

import math
import sys
from multiprocessing.pool import ThreadPool

import cv2
import numpy as np
import pandas as pd

import ham_data

W = 300  # working width (images are 600x450)
FEATURES_CSV = ham_data.ROOT / "ruler_features.csv"
MONTAGE_DIR = ham_data.ROOT / "ruler_checks"

# Thresholds (tuned against visual spot-checks, see `select`)
MIN_PARALLEL_LONG = 2
MIN_TICKS = 5

# Primary flag: >= TICK_CHAIN_MIN regularly spaced, parallel short tick marks.
# The Hough long-line cue alone was dominated by HAIR in visual checks
# (35/36 of its top candidates were hairy skin, real rulers scored 0), so the
# flag is driven by tick periodicity, which hair does not produce.
TICK_CHAIN_MIN = 8
TICK_CHAIN_BORDER = 5


def tick_chain(img):
    """Longest run of equally spaced, parallel, short dark ticks (full-res BGR)."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    bh = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT,
                          cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9)))
    # exclude only LARGE dark regions (dermoscope vignette), not thin black ink
    dark = (gray < 25).astype(np.uint8)
    vign = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((15, 15), np.uint8))
    valid = 1 - cv2.dilate(vign, np.ones((11, 11), np.uint8))
    bw = ((bh > 25) & (valid > 0)).astype(np.uint8)
    # strip straight ruler baselines so ticks become separate components
    base = np.zeros_like(bw)
    for k in (cv2.getStructuringElement(cv2.MORPH_RECT, (41, 1)),
              cv2.getStructuringElement(cv2.MORPH_RECT, (1, 41))):
        base |= cv2.morphologyEx(bw, cv2.MORPH_OPEN, k)
    bw = bw & (1 - base)

    n, lab, stats, cent = cv2.connectedComponentsWithStats(bw, 8)
    cands = []
    for i in range(1, n):
        area = stats[i, cv2.CC_STAT_AREA]
        if area < 4 or area > 120:
            continue
        x0, y0, w, h = stats[i, 0], stats[i, 1], stats[i, 2], stats[i, 3]
        ys, xs = np.nonzero(lab[y0:y0 + h, x0:x0 + w] == i)
        pts = np.stack([xs, ys], 1).astype(np.float32)
        pts -= pts.mean(0)
        ev, evec = np.linalg.eigh(pts.T @ pts / len(pts))
        major = math.sqrt(max(ev[1], 1e-6)) * 4
        minor = math.sqrt(max(ev[0], 1e-6)) * 4
        if major < 5 or major > 40 or major / max(minor, 1) < 2.5:
            continue
        ang = math.degrees(math.atan2(evec[1, 1], evec[0, 1])) % 180
        cands.append((cent[i][0], cent[i][1], ang, major))

    best = 0
    C = np.array(cands) if cands else np.zeros((0, 4))
    for i in range(len(C)):
        x, y, a, L = C[i]
        nx, ny = math.cos(math.radians(a + 90)), math.sin(math.radians(a + 90))
        dx, dy = C[:, 0] - x, C[:, 1] - y
        d = np.abs(((C[:, 2] - a) + 90) % 180 - 90)
        along = dx * nx + dy * ny            # along the ruler axis
        across = np.abs(-dx * ny + dy * nx)  # offset along the tick direction
        m = (d < 12) & (np.abs(along) < 250) & (across < 0.6 * L + 4)
        pos = np.sort(along[m])
        if len(pos) < 5:
            continue
        steps = np.diff(pos)
        gaps = steps[steps > 2]
        if len(gaps) < 4:
            continue
        g = np.median(gaps)
        if g < 4 or g > 45:
            continue
        run = cur = 1
        for gg in steps:
            if gg <= 2:
                continue
            if 0.6 * g <= gg <= 1.6 * g:
                cur += 1
                run = max(run, cur)
            else:
                cur = 1
        best = max(best, run)
    return best


def _angle(x1, y1, x2, y2):
    return math.degrees(math.atan2(y2 - y1, x2 - x1)) % 180.0


def _angdiff(a, b):
    d = abs(a - b) % 180.0
    return min(d, 180.0 - d)


def image_features(path):
    img = cv2.imread(path)
    if img is None:
        return dict(n_long=0, n_parallel=0, n_ticks=0, longest=0.0, ink=0.0)
    h0, w0 = img.shape[:2]
    img = cv2.resize(img, (W, int(h0 * W / w0)), interpolation=cv2.INTER_AREA)
    h = img.shape[0]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    edges = cv2.Canny(gray, 50, 150)

    # Ignore the black dermoscope vignette corners (its arc is not a ruler).
    valid = (gray > 12).astype(np.uint8)
    valid = cv2.erode(valid, np.ones((7, 7), np.uint8))
    edges = edges * valid

    long_min = int(0.35 * W)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=50,
                            minLineLength=long_min, maxLineGap=4)
    if lines is None:
        return dict(n_long=0, n_parallel=0, n_ticks=0, longest=0.0, ink=0.0)
    lines = np.asarray(lines).reshape(-1, 4)
    lengths = np.hypot(lines[:, 2] - lines[:, 0], lines[:, 3] - lines[:, 1])
    angles = np.array([_angle(*l) for l in lines])

    # Dominant orientation = angle of the longest segment
    k = int(np.argmax(lengths))
    dom_angle = angles[k]
    dom_line = lines[k]
    parallel = [i for i in range(len(lines)) if _angdiff(angles[i], dom_angle) < 6]

    # Count distinct parallel lines separated by >= 5 px perpendicular to dominant direction
    nx, ny = -math.sin(math.radians(dom_angle)), math.cos(math.radians(dom_angle))
    offsets = sorted(
        ((lines[i][0] + lines[i][2]) / 2 * nx + (lines[i][1] + lines[i][3]) / 2 * ny) for i in parallel
    )
    distinct = 0
    last = None
    for o in offsets:
        if last is None or o - last >= 5:
            distinct += 1
            last = o

    # Tick marks: short segments perpendicular to the dominant line, located near it
    short = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=10,
                            minLineLength=6, maxLineGap=1)
    ticks = 0
    if short is not None:
        for x1, y1, x2, y2 in np.asarray(short).reshape(-1, 4):
            L = math.hypot(x2 - x1, y2 - y1)
            if L > 0.2 * W:
                continue
            if abs(_angdiff(_angle(x1, y1, x2, y2), dom_angle) - 90) > 12:
                continue
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            # distance from midpoint to the dominant (infinite) line
            dx, dy = dom_line[2] - dom_line[0], dom_line[3] - dom_line[1]
            dist = abs(dy * (mx - dom_line[0]) - dx * (my - dom_line[1])) / (math.hypot(dx, dy) + 1e-9)
            if dist < 25:
                ticks += 1

    # "Ink" cue for surgical markers: strongly saturated blue/purple/green pixels
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hue, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    ink_mask = (((hue > 85) & (hue < 160)) & (sat > 90) & (val > 40))
    ink = float(ink_mask.mean())

    return dict(n_long=len(lines), n_parallel=distinct, n_ticks=ticks,
                longest=float(lengths.max()) / W, ink=ink)


def _work(args):
    image_id, path = args
    f = image_features(path)
    img = cv2.imread(path)
    f["tick_chain"] = tick_chain(img) if img is not None else 0
    f["image_id"] = image_id
    return f


def compute_features():
    meta = ham_data.load_metadata()
    print(f"{len(meta)} images with metadata + path", flush=True)
    # ThreadPool (not process Pool): multiprocessing + OpenCV deadlocks on Windows;
    # cv2 releases the GIL so threads still parallelise.
    cv2.setNumThreads(1)
    jobs = list(zip(meta["image_id"], meta["path"]))
    rows = []
    with ThreadPool(8) as pool:
        for i, r in enumerate(pool.imap_unordered(_work, jobs, chunksize=32), 1):
            rows.append(r)
            if i % 1000 == 0:
                print(f"  {i}/{len(jobs)}", flush=True)
    df = pd.DataFrame(rows).merge(meta[["image_id", "dx", "path"]], on="image_id")
    df.to_csv(FEATURES_CSV, index=False)
    print(f"saved {FEATURES_CSV}")
    print(df[["n_long", "n_parallel", "n_ticks", "longest", "ink", "tick_chain"]].describe())


def flag(df):
    return df["tick_chain"] >= TICK_CHAIN_MIN


def select():
    df = pd.read_csv(FEATURES_CSV)
    f = flag(df)
    print(f"flagged {int(f.sum())} / {len(df)} ({100 * f.mean():.1f}%)")
    print("flagged by class:\n", df[f]["dx"].value_counts())
    df[f]["path"].to_csv(ham_data.RULER_LIST_FILE, index=False, header=False)
    print(f"wrote {ham_data.RULER_LIST_FILE}")


def montage(kind, seed=0, n=36, cols=6):
    df = pd.read_csv(FEATURES_CSV)
    f = flag(df)
    if kind == "flagged":
        sub = df[f]
    elif kind == "unflagged":
        sub = df[~f]
    else:  # borderline: just below the threshold
        sub = df[~f & (df["tick_chain"] >= TICK_CHAIN_BORDER)]
    sub = sub.sample(min(n, len(sub)), random_state=seed)
    tiles = []
    for _, r in sub.iterrows():
        im = cv2.imread(r["path"])
        im = cv2.resize(im, (240, 180))
        cv2.putText(im, f"{r['image_id'][-5:]} chain{int(r['tick_chain'])} {r['dx']}",
                    (3, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 255, 255), 1)
        tiles.append(im)
    while len(tiles) % cols:
        tiles.append(np.zeros_like(tiles[0]))
    rows = [np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles), cols)]
    MONTAGE_DIR.mkdir(exist_ok=True)
    out = MONTAGE_DIR / f"{kind}_{seed}.png"
    cv2.imwrite(str(out), np.vstack(rows))
    print(out)
    print(sub["path"].head(5).tolist())


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "features"
    if cmd == "features":
        compute_features()
    elif cmd == "select":
        select()
    elif cmd == "montage":
        montage(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 0)
