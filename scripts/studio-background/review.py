"""Review sheets: original | composite | feed-card crop | removed-area overlay.

Writes white-background-study/review/sheets/sheet-NN.jpg (4 dogs per sheet) so
every output is reviewed beside its original, at the actual feed crop
(370x590 card, object-fit: cover), with the mask made visible.
"""
from __future__ import annotations

import glob
import json
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont

import studio_lib as S

ROOT = os.environ.get("PAWJAI_STUDIO_ROOT", os.path.expanduser("~/PAWJAI-HQ/studio/white-background-study"))
CARD_ASPECT = 370 / 590
PANEL_H = 520


def feed_crop(im: Image.Image) -> Image.Image:
    w, h = im.size
    if w / h > CARD_ASPECT:  # wider than the card: crop the sides
        cw = round(h * CARD_ASPECT)
        x0 = (w - cw) // 2
        return im.crop((x0, 0, x0 + cw, h))
    ch = round(w / CARD_ASPECT)
    y0 = (h - ch) // 2
    return im.crop((0, y0, w, y0 + ch))


def overlay(src: Image.Image, mask: Image.Image) -> Image.Image:
    a = np.asarray(mask.resize(src.size)).astype(np.float32) / 255.0
    s = np.asarray(src.convert("RGB")).astype(np.float32)
    red = np.array([220, 40, 40], np.float32)
    out = s * (0.45 + 0.55 * a[..., None]) + red * (0.55 * (1 - a[..., None]))
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def fit(im: Image.Image, h: int) -> Image.Image:
    return im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)


def build(sources, cls, only=None):
    out_dir = f"{ROOT}/review/sheets"
    os.makedirs(out_dir, exist_ok=True)
    font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 22)
    rows = []
    for idx, rec in enumerate(sources):
        if only and not any(o == rec["dog_id"] or o.lower() in rec["name"].lower() for o in only):
            continue
        d = f"{ROOT}/outputs/{S.PIPELINE_VERSION}/{rec['dog_id']}/{rec.get('source_sha1', '')[:12]}"
        if not os.path.exists(f"{d}/composite.png"):
            continue
        meta = json.load(open(f"{d}/meta.json"))
        work = f"{d}/work-source.png" if os.path.exists(f"{d}/work-source.png") else f"{ROOT}/{rec['source_path']}"
        src = Image.open(work).convert("RGB")
        comp = Image.open(f"{d}/composite.png").convert("RGB")
        mask = Image.open(f"{d}/mask.png")
        panels = [fit(src, PANEL_H), fit(comp, PANEL_H), fit(feed_crop(comp), PANEL_H), fit(overlay(src, mask), PANEL_H)]
        label = f"{idx:02d} {''.join(ch for ch in rec['name'] if ord(ch) < 128).strip() or rec['dog_id'][:8]} [{rec['adoption_status']}, {rec['cover_type']}] flags: {','.join(meta.get('flags', [])) or '-'}"
        rows.append((label, panels))
    per = 4
    for n in range(0, len(rows), per):
        chunk = rows[n:n + per]
        W = max(sum(p.width for p in panels) + 10 * len(panels) for _, panels in chunk)
        H = len(chunk) * (PANEL_H + 34)
        sheet = Image.new("RGB", (W, H), "white")
        dr = ImageDraw.Draw(sheet)
        for r, (label, panels) in enumerate(chunk):
            y = r * (PANEL_H + 34)
            dr.text((4, y + 4), label[:150], fill="black", font=font)
            x = 0
            for p in panels:
                sheet.paste(p, (x, y + 32))
                x += p.width + 10
        sheet.save(f"{out_dir}/sheet-{n // per + 1:02d}.jpg", quality=86)
    print(f"{len(rows)} dogs -> {(len(rows) + per - 1) // per} sheets in {out_dir}")
