"""Self-contained original-vs-v3 comparison page (all images embedded as data URIs), for
viewing as a local file. Reads qa-decisions-v3.json and the v3 outputs. Local only."""
import base64, html, io, json, os
from PIL import Image

ROOT = os.path.expanduser("~/PAWJAI-HQ/studio/white-background-study")
PIPE = os.environ.get("PAWJAI_STUDIO_PIPELINE", "studio-bg-v3.2")
INV = f"{ROOT}/inventory-2026-11-17"
OUT = f"{ROOT}/review/v3-comparison.html"
W = 480


def data_uri(im, q=80):
    im = im.convert("RGB"); im.thumbnail((W, int(W * 16 / 9)))
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


sources = {r["dog_id"]: r for r in json.load(open(f"{INV}/sources.json"))}
dec = json.load(open(f"{INV}/qa-decisions-v3.json"))
best = json.load(open(f"{ROOT}/review/v3/best-version.json")) if os.path.exists(f"{ROOT}/review/v3/best-version.json") else {}
edited, kept = [], []
for dog, d in dec.items():
    r = sources[dog]
    sha = r["source_sha1"][:12]
    orig = Image.open(f"{ROOT}/{r['source_path']}")
    if d["decision"] == "passed":
        comp = Image.open(f"{ROOT}/outputs/{best.get(dog, PIPE)}/{dog}/{sha}/composite.png")
        edited.append((r["name"], d, data_uri(orig), data_uri(comp)))
    else:
        kept.append((r["name"], d, data_uri(orig)))
edited.sort(key=lambda x: x[0].lower()); kept.sort(key=lambda x: x[0].lower())
cards = []
for name, d, o, v in edited:
    note = html.escape(d.get("background", ""))
    fix = " · cut-out hand-fixed" if d.get("mask_fixed") else ""
    cards.append(f"""<section class="dog"><h2>{html.escape(name)}</h2><p class="meta">Background was: {note}{fix}</p>
<div class="pair"><figure><img src="{o}" alt="{html.escape(name)} original"><figcaption>Original</figcaption></figure>
<figure><img src="{v}" alt="{html.escape(name)} studio v3"><figcaption>Studio v3 (live)</figcaption></figure></div></section>""")
kept_cards = []
for name, d, o in kept:
    kept_cards.append(f"""<section class="dog kept"><h2>{html.escape(name)}</h2><p class="meta">Kept original: {html.escape(d.get('reason', ''))}</p>
<div class="pair one"><figure><img src="{o}" alt="{html.escape(name)} original"><figcaption>Original (unchanged)</figcaption></figure></div></section>""")
page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Studio v3 comparison</title><style>
:root{{--bg:#faf7f2;--ink:#3c2d28;--muted:#8a7b70;--card:#fff;--line:#eadfd3}}
body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.45 -apple-system,system-ui,sans-serif}}
main{{max-width:1100px;margin:0 auto;padding:16px}} h1{{font-size:24px;margin:6px 0}} .intro{{color:var(--muted)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(500px,1fr));gap:14px}}
.dog{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px}}
.dog h2{{font-size:18px;margin:0}} .meta{{color:var(--muted);font-size:13px;margin:2px 0 8px}}
.pair{{display:grid;grid-template-columns:1fr 1fr;gap:8px}} .pair.one{{grid-template-columns:1fr 1fr}}
figure{{margin:0}} img{{width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:10px;display:block;background:#eee}}
figcaption{{font-size:12px;color:var(--muted);margin-top:3px}} h3{{margin:26px 0 8px}}
@media (max-width:560px){{.grid{{grid-template-columns:1fr}}}}
</style></head><body><main>
<h1>Studio v3: {len(edited)} dogs edited, {len(kept)} kept original</h1>
<p class="intro">Original on the left, studio v3 on the right (as shown to every visitor in the feed; images cropped like a feed card).
The dog is never redrawn: only the background is replaced and the whole photo's light and colour are matched to the studio.</p>
<div class="grid">{''.join(cards)}</div>
<h3>Kept original</h3><div class="grid">{''.join(kept_cards)}</div>
</main></body></html>"""
open(OUT, "w", encoding="utf-8").write(page)
print(OUT, round(os.path.getsize(OUT) / 1e6, 2), "MB", len(edited), "edited", len(kept), "kept")
