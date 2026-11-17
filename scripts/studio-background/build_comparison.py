"""Build the local review/comparison page for the whole catalogue.

    python3 scripts/build_comparison.py

Writes white-background-study/index.html (local only, never committed) plus
thumbnails in review/thumbs/. The earlier three-sample AI study page is kept
as index-v0-ai-samples.html.
"""
from __future__ import annotations

import html
import json
import os
import shutil
from collections import Counter

from PIL import Image

ROOT = os.environ.get("PAWJAI_STUDIO_ROOT", os.path.expanduser("~/PAWJAI-HQ/studio/white-background-study"))
THUMB_H = 760


def thumb(src_rel: str, out_rel: str) -> str:
    out = f"{ROOT}/{out_rel}"
    if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(f"{ROOT}/{src_rel}"):
        os.makedirs(os.path.dirname(out), exist_ok=True)
        im = Image.open(f"{ROOT}/{src_rel}").convert("RGB")
        im.thumbnail((THUMB_H, THUMB_H), Image.LANCZOS)
        im.save(out, quality=84)
    return out_rel


STATUS_LABEL = {
    "passed": "Passed review",
    "failed": "Failed review",
    "skipped": "Skipped",
    "existing_studio_retained": "Existing studio — retained",
    "missing_source": "Missing source",
    "generated_pending_review": "Generated, awaiting review",
    "not_processed": "Not processed",
}


def main():
    cat = json.load(open(f"{ROOT}/catalogue-manifest.json"))
    dogs = cat["dogs"]
    if os.path.exists(f"{ROOT}/index.html") and not os.path.exists(f"{ROOT}/index-v0-ai-samples.html"):
        shutil.copy2(f"{ROOT}/index.html", f"{ROOT}/index-v0-ai-samples.html")
    sources = {r["dog_id"]: r for r in json.load(open(f"{ROOT}/inventory-2026-11-17/sources.json"))}
    counts = Counter(d["processing_status"] for d in dogs)
    in_test = [d for d in dogs if d.get("experiment") and d["experiment"].get("cohort")]
    cohorts = Counter(d["experiment"]["cohort"] for d in in_test)
    cards = []
    for d in dogs:
        src = sources[d["dog_id"]]
        orig_rel = src["source_path"]
        o_thumb = thumb(orig_rel, f"review/thumbs/{d['dog_id']}-original.jpg")
        e_thumb = None
        if d.get("output_master"):
            e_thumb = thumb(d["output_master"], f"review/thumbs/{d['dog_id']}-studio.jpg")
        exp = d.get("experiment") or {}
        badge = STATUS_LABEL.get(d["processing_status"], d["processing_status"])
        if exp.get("cohort"):
            badge += f" · in test, cohort {exp['cohort']}"
        elif exp.get("excluded"):
            badge += f" · {exp['excluded']}"
        notes = " ".join(x for x in [d.get("classification_note", ""), d.get("qa_notes", "")] if x)
        flags = ", ".join(d.get("flags") or [])
        edited_html = (
            f'<figure><figcaption>Studio background (edited)</figcaption>'
            f'<a href="{html.escape(d["output_master"])}" target="_blank" rel="noopener"><img loading="lazy" src="{html.escape(e_thumb)}" alt="{html.escape(d["name"])}, studio background edit"></a>'
            f'<a class="full" href="{html.escape(d["output_master"])}" target="_blank" rel="noopener">Full-size master (PNG)</a>'
            + (f' · <a class="full" href="{html.escape(d["output_derivative"])}" target="_blank" rel="noopener">Optimized WebP ({round(d.get("derivative_bytes", 0) / 1024)} KB)</a>' if d.get("output_derivative") else "")
            + "</figure>"
        ) if e_thumb else f'<figure class="none"><figcaption>No edit</figcaption><p>{html.escape(badge)}</p></figure>'
        cards.append(f"""
<section class="dog" data-status="{html.escape(d['processing_status'])}" data-cohort="{html.escape(exp.get('cohort', ''))}">
  <header><h2>{html.escape(d['name'])}</h2><span class="badge s-{html.escape(d['processing_status'])}">{html.escape(badge)}</span></header>
  <p class="meta">{html.escape(d['listing_status'])} · {html.escape(d['shelter'] or '')} · cover: {html.escape(d['cover_media_type'])}{' (video cover preserved; still shown)' if d['cover_media_type'] == 'video' else ''} · <code>{html.escape(d['dog_id'])}</code></p>
  <div class="pair">
    <figure><figcaption>Original (unchanged)</figcaption>
      <a href="{html.escape(orig_rel)}" target="_blank" rel="noopener"><img loading="lazy" src="{html.escape(o_thumb)}" alt="{html.escape(d['name'])}, original photo"></a>
      <a class="full" href="{html.escape(orig_rel)}" target="_blank" rel="noopener">Full-size original</a> · <a class="full" href="{html.escape(d['source_url'] or '')}" target="_blank" rel="noopener">Live CDN source</a>
    </figure>
    {edited_html}
  </div>
  <p class="note">{html.escape(notes) or '—'}</p>
  {f'<p class="flags">Automated flags: {html.escape(flags)}</p>' if flags else ''}
  <p class="hash">source sha1 {html.escape((d.get('source_sha1') or '')[:12])} · {html.escape(d.get('pipeline_version') or '')}</p>
</section>""")

    summary = (f"{len(dogs)} dogs in the database ({sum(1 for d in dogs if d['listing_status'] == 'available')} available, "
               f"{sum(1 for d in dogs if d['listing_status'] != 'available')} adopted). "
               f"Passed {counts.get('passed', 0)}, failed {counts.get('failed', 0)}, skipped {counts.get('skipped', 0)}, "
               f"existing studio retained {counts.get('existing_studio_retained', 0)}. "
               f"In the A/B test: {len(in_test)} dogs (" + ", ".join(f"cohort {k}: {v}" for k, v in sorted(cohorts.items())) + ").")
    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>PawJai studio backgrounds — full catalogue review</title>
<style>
:root{{--cream:#f5f0e8;--cocoa:#65584f;--rose:#cd8188;--sand:#d6c8ad;--line:#e3d8cc}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--cream);color:var(--cocoa);font:16px/1.55 system-ui,-apple-system,sans-serif}}
main{{max-width:1180px;margin:32px auto;padding:0 16px 48px}}h1{{font-size:clamp(26px,4vw,40px);line-height:1.2;margin:8px 0 12px}}
.tag{{color:#99505b;font-weight:750;letter-spacing:.12em;font-size:12px}}.intro{{max-width:820px}}
.controls{{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0;position:sticky;top:0;background:var(--cream);padding:10px 0;z-index:5}}
button{{font:inherit;font-size:14px;border:1px solid #cbbcae;border-radius:999px;padding:8px 14px;background:#fff;color:var(--cocoa);cursor:pointer}}
button[aria-pressed=true]{{background:var(--cocoa);color:#fff}}:focus-visible{{outline:3px solid #a75f68;outline-offset:3px}}
.dog{{background:#fff;border:1px solid var(--line);border-radius:22px;padding:18px;margin:18px 0}}
.dog header{{display:flex;flex-wrap:wrap;align-items:center;gap:10px}}h2{{margin:0;font-size:22px}}
.badge{{font-size:12px;font-weight:700;border-radius:999px;padding:4px 10px;background:#eee}}
.s-passed{{background:#e4f2e7;color:#1f6b33}}.s-failed{{background:#fbe3e3;color:#9b2c2c}}.s-skipped{{background:#f3ead7;color:#7a5a12}}
.s-existing_studio_retained{{background:#e5eef8;color:#1f4d7a}}
.meta,.note,.flags,.hash{{font-size:13px;margin:6px 0}}.hash,.flags{{color:#8a7b70}}code{{font-size:12px}}
.pair{{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:12px}}figure{{margin:0;min-width:0}}
figcaption{{font-size:13px;font-weight:650;margin-bottom:6px}}
.pair img{{display:block;width:100%;aspect-ratio:3/4;object-fit:contain;background:#f4f2ef;border-radius:12px}}
body.crop .pair img{{aspect-ratio:370/590;object-fit:cover}}
figure.none p{{display:flex;align-items:center;justify-content:center;aspect-ratio:3/4;background:#f4f2ef;border-radius:12px;margin:0;font-size:14px;text-align:center;padding:12px}}
body.crop figure.none p{{aspect-ratio:370/590}}a{{color:#99505b}}.full{{font-size:12px}}
.ref{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}}.ref img{{width:100%;border-radius:12px}}
@media(max-width:640px){{.pair{{gap:8px}}.dog{{padding:12px;border-radius:16px}}h2{{font-size:19px}}}}
</style></head><body><main>
<div class="tag">PAWJAI · LOCAL REVIEW · FULL CATALOGUE · 17 NOV 2026</div>
<h1>Studio backgrounds for every dog</h1>
<p class="intro">{html.escape(summary)}</p>
<p class="intro">Method: the original photo is never regenerated. Apple Vision (on this Mac, free) finds the dog; every fully opaque dog pixel is copied byte-for-byte from the original, only fur edges are colour-cleaned, and the background is replaced by an off-white paper sweep calibrated to your two real studio photos, with soft contact shadows. No photo was sent to any outside processing service; the reviewed derivatives are stored in PawJai’s own B2 bucket under experiments/studio-background-v1/ and served by the same CDN as the originals.</p>
<div class="controls" role="group" aria-label="Filter">
<button data-filter="all" aria-pressed="true">All {len(dogs)}</button>
<button data-filter="passed" aria-pressed="false">Passed {counts.get('passed', 0)}</button>
<button data-filter="test" aria-pressed="false">In test {len(in_test)}</button>
<button data-filter="failed" aria-pressed="false">Failed {counts.get('failed', 0)}</button>
<button data-filter="skipped" aria-pressed="false">Skipped {counts.get('skipped', 0)}</button>
<button data-filter="existing_studio_retained" aria-pressed="false">Existing studio {counts.get('existing_studio_retained', 0)}</button>
<button id="crop" aria-pressed="false">Feed-card crop</button>
</div>
<div id="dogs">{''.join(cards)}</div>
<section class="dog"><header><h2>Earlier AI samples (direction only, not used)</h2></header>
<p class="note">The three generative edits from October set the visual direction. They changed fur and facial detail, so they are not used; the faithful composites above replace them.</p>
<div class="ref"><a href="natural-0.png" target="_blank"><img src="natural-0.png" alt="Earlier AI sample, Daniel"></a><a href="natural-2.png" target="_blank"><img src="natural-2.png" alt="Earlier AI sample, Thalia"></a><a href="natural-4.png" target="_blank"><img src="natural-4.png" alt="Earlier AI sample, Nash"></a></div>
<p class="note"><a href="index-v0-ai-samples.html">Open the original three-sample study page</a> · <a href="reference-white.jpg">reference-white.jpg</a> · <a href="reference-warm.jpg">reference-warm.jpg</a> · <a href="catalogue-manifest.json">catalogue-manifest.json</a></p>
</section>
</main>
<script>
const buttons=[...document.querySelectorAll('[data-filter]')];
buttons.forEach(b=>b.addEventListener('click',()=>{{buttons.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
const f=b.dataset.filter;document.querySelectorAll('.dog[data-status]').forEach(s=>{{
const show=f==='all'||(f==='test'?s.dataset.cohort!=='':s.dataset.status===f);s.hidden=!show;}});}}));
document.getElementById('crop').addEventListener('click',e=>{{const on=document.body.classList.toggle('crop');e.currentTarget.setAttribute('aria-pressed',String(on));}});
</script></body></html>"""
    open(f"{ROOT}/index.html", "w").write(page)
    print("index.html written:", summary)


if __name__ == "__main__":
    main()
