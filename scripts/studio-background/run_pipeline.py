"""Resumable batch runner for the studio-background derivatives.

    .venv/bin/python scripts/run_pipeline.py process [--only <dog-id|name>] [--force]
    .venv/bin/python scripts/run_pipeline.py review  [--only ...]

Outputs (outside git): white-background-study/outputs/<PIPELINE_VERSION>/<dog-id>/<sha1-12>/
  composite.png  lossless master (same size and crop as the original)
  mask.png       final alpha (8-bit) used for the composite
  meta.json      parameters, Vision detections, flags, QA metrics
A rerun skips any dog whose meta.json matches the current source sha1 and
pipeline version, so nothing is regenerated or duplicated unnecessarily.
Originals in sources/ are never written to.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import studio_lib as S  # noqa: E402

ROOT = os.environ.get("PAWJAI_STUDIO_ROOT", os.path.expanduser("~/PAWJAI-HQ/studio/white-background-study"))
SOURCES = f"{ROOT}/inventory-2026-11-17/sources.json"
CLASSIFICATION = f"{ROOT}/inventory-2026-11-17/classification.json"
OUT = f"{ROOT}/outputs/{S.PIPELINE_VERSION}"


def load_json(path, default=None):
    if not os.path.exists(path):
        return default
    with open(path) as f:
        return json.load(f)


def out_dir(rec):
    return f"{OUT}/{rec['dog_id']}/{rec['source_sha1'][:12]}"


def wants(rec, only):
    if not only:
        return True
    return any(o == rec["dog_id"] or o.lower() in rec["name"].lower() for o in only)


def process(rec, force=False):
    d = out_dir(rec)
    meta_path = f"{d}/meta.json"
    meta = load_json(meta_path)
    if meta and not force and meta.get("pipeline") == S.PIPELINE_VERSION and meta.get("source_sha1") == rec["source_sha1"]:
        return meta, "reused"
    os.makedirs(d, exist_ok=True)
    src_path = f"{ROOT}/{rec['source_path']}"
    im = Image.open(src_path)
    im.load()
    im = im.convert("RGB")
    work_path = src_path
    scale = 1.0
    if max(im.size) > S.MAX_WORK_SIDE:
        # Oversized camera originals: work on a Lanczos-downscaled copy (no other
        # change). The feed never displays more than ~1100 px wide.
        scale = S.MAX_WORK_SIDE / max(im.size)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        work_path = f"{d}/work-source.png"
        im.save(work_path)
    src = np.asarray(im)
    H, W, _ = src.shape
    t0 = time.time()
    reuse = os.environ.get("PAWJAI_STUDIO_REUSE_MASK")  # e.g. studio-bg-v1.3: keep the reviewed mask
    fixed = f"{ROOT}/masks-fixed/{rec['dog_id']}/{rec['source_sha1'][:12]}.png"  # hand-fixed cut-outs win
    if reuse or os.path.exists(fixed):
        prev = f"{ROOT}/outputs/{reuse or 'studio-bg-v1.3'}/{rec['dog_id']}/{rec['source_sha1'][:12]}"
        prev_meta = load_json(f"{prev}/meta.json") or {}
        mask_path = fixed if os.path.exists(fixed) else f"{prev}/mask.png"
        if os.path.exists(mask_path) and (os.path.exists(fixed) or prev_meta.get("status") == "generated"):
            alpha = np.asarray(Image.open(mask_path).convert("L"), dtype=np.float32) / 255.0
            if alpha.shape == (H, W):
                meta = {k: prev_meta[k] for k in ("dog_id", "name", "source_sha1", "source_sha256", "source_url",
                                                   "size", "work_scale", "vision") if k in prev_meta}
                meta.update({"dog_id": rec["dog_id"], "name": rec["name"], "source_sha1": rec["source_sha1"],
                             "pipeline": S.PIPELINE_VERSION,
                             "mask_from": "hand-fixed (masks-fixed/)" if mask_path == fixed else reuse,
                             "flags": [f for f in prev_meta.get("flags", []) if f not in ("INTERIOR_NOT_IDENTICAL",
                                       "other_dog_merged", "MERGED_OTHER_DOG")]})
                out, params = S.composite(src, alpha, dog_id=rec["dog_id"], source_sha1=rec["source_sha1"])
                qa = S.qa_metrics(src, out, alpha)
                Image.fromarray(out).save(f"{d}/composite.png", optimize=False, compress_level=6)
                Image.fromarray(np.round(alpha * 255).astype(np.uint8)).save(f"{d}/mask.png")
                if S.PIPELINE_VERSION.startswith("studio-bg-v3"):
                    # Independent check: recompute the recorded global adjustment from the original and
                    # compare every interior dog pixel (away from the edge band) with the composite.
                    src_lin = S.srgb_to_linear(src.astype(np.float32) / 255.0)
                    expect = np.clip(np.round(S.linear_to_srgb(S.apply_dog_adjustments(
                        src_lin, params["dog_adjustments"], params["subject"])) * 255.0), 0, 255).astype(np.uint8)
                    margin = int(params["edge_band_px"] + 3 * max(2.0, 0.006 * min(H, W))) + 2
                    inner = S.ndi.binary_erosion(alpha >= 0.996, iterations=margin)
                    qa["interior_checked_pixels"] = int(inner.sum())
                    qa["interior_matches_recorded_adjustment"] = bool(np.array_equal(out[inner], expect[inner]))
                    qa.pop("opaque_pixels_identical", None)
                    if not qa["interior_matches_recorded_adjustment"]:
                        meta["flags"].append("INTERIOR_NOT_RECORDED_ADJUSTMENT")
                elif not qa["opaque_pixels_identical"]:
                    meta["flags"].append("INTERIOR_NOT_IDENTICAL")
                meta.update({"params": params, "qa": qa, "seconds": round(time.time() - t0, 2), "status": "generated"})
                json.dump(meta, open(meta_path, "w"), indent=1, ensure_ascii=False)
                return meta, "generated"
    seg = S.segment(work_path, W, H)
    sel = S.select_dog_v2(seg, W, H)
    meta = {
        "dog_id": rec["dog_id"], "name": rec["name"], "pipeline": S.PIPELINE_VERSION,
        "source_sha1": rec["source_sha1"], "source_sha256": rec["source_sha256"], "source_url": rec["still_url"],
        "size": [W, H], "work_scale": round(scale, 4), "vision": {
            "instances": len(seg["instances"]), "selected": [i["index"] for i in sel["selected"]],
            "animals": seg["animals"], "humans": seg["humans"], "primary_box": sel["primary_box"]},
        "flags": list(sel["flags"]),
    }
    if not sel["selected"]:
        meta["status"] = "failed"
        meta["reason"] = "no foreground subject found"
        json.dump(meta, open(meta_path, "w"), indent=1)
        return meta, "failed"
    alpha = np.maximum.reduce([i["mask"] for i in sel["selected"]]).astype(np.float32)
    alpha = S.clean_alpha(alpha)
    alpha = S.refine_alpha(src, alpha)
    out, params = S.composite(src, alpha, dog_id=rec["dog_id"], source_sha1=rec["source_sha1"])
    qa = S.qa_metrics(src, out, alpha)
    Image.fromarray(out).save(f"{d}/composite.png", optimize=False, compress_level=6)
    Image.fromarray(np.round(alpha * 255).astype(np.uint8)).save(f"{d}/mask.png")
    t = params["subject"]["touches"]
    if t["bottom"]:
        meta["flags"].append("subject_cropped_at_bottom")
    if not qa["opaque_pixels_identical"]:
        meta["flags"].append("INTERIOR_NOT_IDENTICAL")
    if qa["rim_contrast_L"] is not None and qa["rim_contrast_L"] < 8:
        meta["flags"].append("low_subject_background_contrast")
    meta.update({"params": params, "qa": qa, "seconds": round(time.time() - t0, 2), "status": "generated"})
    json.dump(meta, open(meta_path, "w"), indent=1, ensure_ascii=False)
    return meta, "generated"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["process", "review"])
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    sources = load_json(SOURCES)
    cls = load_json(CLASSIFICATION, {}) or {}
    if args.cmd == "process":
        for rec in sources:
            if not wants(rec, args.only) or rec.get("status") != "source_ok":
                continue
            c = cls.get(rec["dog_id"], {})
            if c.get("classification") in ("existing_studio", "missing_unusable") or c.get("skip"):
                continue
            meta, how = process(rec, force=args.force)
            print(f"{how:9} {rec['name'][:24]:24} flags={','.join(meta.get('flags', [])) or '-'} "
                  f"qa={meta.get('qa', {})}")
    else:
        import review  # noqa: F401
        review.build(sources, cls, args.only)


if __name__ == "__main__":
    main()
