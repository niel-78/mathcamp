"""
Genererar 30 uppgifter (nivå 1, heltal k) + 30 uppgifter (nivå 2, rationella k)
om räta linjer y = kx + m, med bild av linjen i koordinatsystem samt en
Excel-fil (single_choice) redo att importeras via blockets importfunktion.

Kör:
    /Users/niel/.local/bin/python3.13 examples/generate_ratlinjer.py

Output:
    backend/uploads/ratlinjer/niva1_XX.png, niva2_XX.png  (bilderna)
    examples/ratlinje_ekvation_niva1_2.xlsx                (importfilen)

OBS: bilderna hamnar i backend/uploads/, men backend-containern byggs med
COPY . . (ingen volume-mount) - kör `docker compose build backend &&
docker compose up -d backend` efter att bilderna kopierats dit, annars
saknas filerna i den körande containern när frågorna importeras.
"""

import math
import random
from fractions import Fraction
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from openpyxl import Workbook

random.seed(42)

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "backend" / "uploads" / "ratlinjer"
IMG_DIR.mkdir(parents=True, exist_ok=True)
XLSX_PATH = ROOT / "examples" / "ratlinje_ekvation_niva1_2.xlsx"

AXIS_LIM = 10  # visningsfönster -10..10 i både x- och y-led (kvadratiskt raster)


def format_k_term(k):
    """k: int eller Fraction. Returnerar LaTeX-term för kx (utan '+m')."""
    if k == 0:
        return ""
    if isinstance(k, Fraction) and k.denominator != 1:
        sign = "-" if k < 0 else ""
        p, q = abs(k.numerator), abs(k.denominator)
        return f"{sign}\\frac{{{p}}}{{{q}}}x"
    k = int(k)
    if k == 1:
        return "x"
    if k == -1:
        return "-x"
    return f"{k}x"


def format_equation(k, m):
    term = format_k_term(k)
    if term == "":
        body = f"{m}"
    elif m == 0:
        body = term
    elif m > 0:
        body = f"{term}+{m}"
    else:
        body = f"{term}{m}"
    return f"${'y='}{body}$"


def make_distractors(k, m, level):
    """Returnerar en lista med kandidat-(k, m)-par som INTE är korrekta,
    baserat på vanliga elevmisstag."""
    candidates = []

    candidates.append((-k, m))          # fel tecken på k
    candidates.append((k, -m if m != 0 else m + 3))  # fel tecken på m

    delta_m = random.choice([-3, -2, -1, 1, 2, 3])
    candidates.append((k, m + delta_m))

    if level == 1:
        candidates.append((m, k))  # blandat ihop k och m (bara heltal k, säkert format)
        delta_k = random.choice([-2, -1, 1, 2])
        candidates.append((k + delta_k, m))
    else:
        # vanligt fel: kastar om täljare/nämnare i bråket
        if isinstance(k, Fraction) and k.numerator != 0:
            flipped = Fraction(k.denominator, k.numerator)
            if k < 0:
                flipped = -abs(flipped)
            else:
                flipped = abs(flipped)
            candidates.append((flipped, m))

    # dedupe, exkludera korrekt svar
    seen = set()
    unique = []
    for cand_k, cand_m in candidates:
        key = (Fraction(cand_k) if not isinstance(cand_k, Fraction) else cand_k, cand_m)
        if key == (Fraction(k) if not isinstance(k, Fraction) else k, m):
            continue
        if key in seen:
            continue
        seen.add(key)
        unique.append(key)

    return unique


def plot_line(k, m, filename):
    fig, ax = plt.subplots(figsize=(5, 5), dpi=150)

    xs = np.linspace(-AXIS_LIM, AXIS_LIM, 800)
    ys = float(k) * xs + float(m)
    ys_masked = np.where((ys >= -AXIS_LIM) & (ys <= AXIS_LIM), ys, np.nan)

    ax.plot(xs, ys_masked, color="#1d4ed8", linewidth=2.5, solid_capstyle="round")

    ax.set_xlim(-AXIS_LIM, AXIS_LIM)
    ax.set_ylim(-AXIS_LIM, AXIS_LIM)
    ax.set_aspect("equal", adjustable="box")

    ticks = list(range(-AXIS_LIM, AXIS_LIM + 1))
    ax.set_xticks(ticks)
    ax.set_yticks(ticks)
    ax.set_xticklabels([str(t) if t % 2 == 0 else "" for t in ticks], fontsize=8)
    ax.set_yticklabels([str(t) if t % 2 == 0 else "" for t in ticks], fontsize=8)

    ax.grid(True, which="both", color="#d1d5db", linewidth=0.6)
    ax.axhline(0, color="black", linewidth=1.4)
    ax.axvline(0, color="black", linewidth=1.4)

    ax.set_xlabel("x")
    ax.set_ylabel("y")

    fig.tight_layout()
    fig.savefig(filename)
    plt.close(fig)


def build_level1_pairs(count):
    all_pairs = [
        (k, m)
        for k in range(-3, 5)
        for m in range(-8, 9)
    ]
    random.shuffle(all_pairs)
    return all_pairs[:count]


def build_level2_pairs(count):
    fracs = []
    for q in (2, 3, 4, 5):
        for p in range(-4 * q, 4 * q + 1):
            f = Fraction(p, q)
            if f.denominator == 1:
                continue  # bara icke-heltal k
            fracs.append(f)
    fracs = list(set(fracs))

    all_pairs = [
        (k, m)
        for k in fracs
        for m in range(-8, 9)
    ]
    random.shuffle(all_pairs)
    return all_pairs[:count]


def build_rows(pairs, level):
    rows = []
    for i, (k, m) in enumerate(pairs, start=1):
        correct_eq = format_equation(k, m)

        distractor_pairs = make_distractors(k, m, level)
        random.shuffle(distractor_pairs)
        distractor_pairs = distractor_pairs[:3]
        distractor_eqs = [format_equation(dk, dm) for dk, dm in distractor_pairs]

        options = [correct_eq] + distractor_eqs
        while len(options) < 4:
            # extremfall (ovanligt): fyll på med enkel variant om dedupe gav för få
            filler = format_equation(k, m + len(options) + 1)
            if filler not in options:
                options.append(filler)

        order = list(range(4))
        random.shuffle(order)
        shuffled_options = [options[j] for j in order]
        correct_index = shuffled_options.index(correct_eq) + 1

        filename = f"niva{level}_{i:02d}.png"
        plot_line(k, m, IMG_DIR / filename)

        rows.append({
            "Fråga": "Vilken ekvation beskriver den räta linjen i bilden?",
            "Frågetyp": "single_choice",
            "Nivå": level,
            "Korrekta alternativ": correct_index,
            "Alternativ 1": shuffled_options[0],
            "Alternativ 2": shuffled_options[1],
            "Alternativ 3": shuffled_options[2],
            "Alternativ 4": shuffled_options[3],
            "Bild (URL)": f"/uploads/ratlinjer/{filename}",
        })

    return rows


def main():
    level1_pairs = build_level1_pairs(30)
    level2_pairs = build_level2_pairs(30)

    rows = build_rows(level1_pairs, 1) + build_rows(level2_pairs, 2)

    wb = Workbook()
    ws = wb.active
    ws.title = "Frågor"

    headers = [
        "Fråga", "Frågetyp", "Nivå", "Korrekta alternativ",
        "Alternativ 1", "Alternativ 2", "Alternativ 3", "Alternativ 4",
        "Bild (URL)",
    ]
    ws.append(headers)
    for row in rows:
        ws.append([row[h] for h in headers])

    wb.save(XLSX_PATH)
    print(f"Skrev {len(rows)} frågor till {XLSX_PATH}")
    print(f"Bilder sparade i {IMG_DIR}")


if __name__ == "__main__":
    main()
