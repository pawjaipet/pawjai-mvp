"""Per-dog QA sheets for the v3 renders (local only).

Each sheet: original | v3 full frame | v3 at feed-card size (370x590 cover crop) on top,
and three 100% crops of the v3 image below (head, paws/ground contact, the busiest edge).
Written to review/v3/<dog-id>.jpg plus review/v3/index.json (dog id -> name, path).
"""
import glob, json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

ROOT = os.path.expanduser("~/PAWJAI-HQ/studio/white-background-study")
PIPE = os.environ.get("PAWJAI_STUDIO_PIPELINE", "studio-bg-v3.2")
OUT = f"{ROOT}/review/v3"
os.makedirs(OUT, exist_ok=True)
font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Unicode.ttf", 22)
index = {}
for mp in sorted(glob.glob(f"{ROOT}/outputs/{PIPE}/*/*/meta.json")):
    meta = json.load(open(mp)); d = os.path.dirname(mp)
    dog, sha = meta["dog_id"], meta["source_sha1"][:12]
    comp = Image.open(f"{d}/composite.png").convert("RGB")
    W, H = comp.size
    orig = Image.open(f"{ROOT}/sources/{dog}/{sha}.jpg").convert("RGB").resize((W, H), Image.LANCZOS)
    alpha = np.asarray(Image.open(f"{d}/mask.png").convert("L"), dtype=np.float32) / 255.0
    PH = 900
    def fit(im):
        im = im.copy(); im.thumbnail((int(PH * W / H) + 1, PH)); return im
    o, v = fit(orig), fit(comp)
    sc = max(370 / W, 590 / H)
    f = comp.resize((round(W * sc), round(H * sc)), Image.LANCZOS)
    l, t = (f.width - 370) // 2, (f.height - 590) // 2
    feed = f.crop((l, t, l + 370, t + 590))
    s = meta["params"]["subject"]
    cx = (s["left"] + s["right"]) // 2
    C = 560
    def crop_at(x, y):
        x0 = int(np.clip(x - C // 2, 0, max(0, W - C))); y0 = int(np.clip(y - C // 2, 0, max(0, H - C)))
        return comp.crop((x0, y0, x0 + min(C, W), y0 + min(C, H)))
    head = crop_at(cx, s["top"] + C // 2 - 40)
    paws = crop_at(cx, s["bottom"] - C // 2 + 80)
    edge = (alpha > 0.05) & (alpha < 0.95)
    dens = ndi.uniform_filter(edge.astype(np.float32), C // 2)
    dens[: s["top"] + C // 3] *= 0.3  # prefer somewhere other than the head
    yy, xx = np.unravel_index(int(np.argmax(dens)), dens.shape)
    busy = crop_at(xx, yy)
    top_w = o.width + v.width + feed.width + 40
    bot_w = 3 * C + 40
    sheet = Image.new("RGB", (max(top_w, bot_w), PH + C + 90), "white")
    dr = ImageDraw.Draw(sheet)
    x = 10
    for im, lab in ((o, "ORIGINAL"), (v, "v3 FULL FRAME"), (feed, "v3 AT FEED-CARD SIZE")):
        sheet.paste(im, (x, 40)); dr.text((x, 8), lab, fill=(0, 0, 0), font=font); x += im.width + 10
    x = 10
    for im, lab in ((head, "100%: head"), (paws, "100%: paws / ground contact"), (busy, "100%: busiest fur edge")):
        sheet.paste(im, (x, PH + 80)); dr.text((x, PH + 48), lab, fill=(0, 0, 0), font=font); x += C + 10
    path = f"{OUT}/{dog}.jpg"
    sheet.save(path, quality=86)
    index[dog] = {"name": meta["name"], "sheet": path, "adjustments": meta["params"]["dog_adjustments"],
                  "geometry": meta["params"]["geometry"], "qa": meta["qa"], "flags": meta.get("flags", []),
                  "mask_from": meta.get("mask_from")}
json.dump(index, open(f"{OUT}/index.json", "w"), ensure_ascii=False, indent=1)
print(len(index), "sheets")
