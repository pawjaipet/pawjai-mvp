"""Export reviewed derivatives and manifests.

    .venv/bin/python scripts/export_experiment.py --worktree ~/PAWJAI-HQ/worktrees/studio-ab

Reads qa-decisions.json (human review: passed/failed, cohort, notes) and
  1. writes optimized WebP derivatives for every PASSED dog to
     exports/experiments/studio-background-v1/<dog-id>/<source-sha1-12>.webp
     (cwebp, metadata stripped; originals are never touched). upload_b2.mjs then
     uploads them additively to the B2 bucket under the same object names,
  2. generates <worktree>/utils/studio-experiment-manifest.ts (typed allowlist),
  3. writes the full 58-dog review manifest catalogue-manifest.json (local only).
Idempotent: unchanged inputs produce identical files; nothing is duplicated.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import studio_lib as S  # noqa: E402

ROOT = os.environ.get("PAWJAI_STUDIO_ROOT", os.path.expanduser("~/PAWJAI-HQ/studio/white-background-study"))
INV = f"{ROOT}/inventory-2026-11-17"
V1 = S.PIPELINE_VERSION.startswith("studio-bg-v1")
EXPERIMENT_VERSION = "studio-bg-v1" if V1 else "studio-bg-v2"
# Owner-named prefix (17 Nov task). v2.0 derivatives live under the same prefix with a "-v2"
# file suffix, so no existing object is ever overwritten.
B2_PREFIX = "experiments/studio-background-v1"
FILE_SUFFIX = "" if V1 else "-v2"
QA_FILE = "qa-decisions.json" if V1 else "qa-decisions-v2.json"
METHOD = ("Apple Vision subject lift + guided-filter edge refinement + procedural off-white sweep + contact shadows; "
          "opaque dog pixels copied byte-for-byte") if V1 else (
          "Reviewed v1.3 mask (Apple Vision subject lift + guided-filter edges) + procedural matte off-white tarp "
          "(irregular tone, faint folds/creases shaded by the light measured on the dog) + contact, under-body and "
          "restrained cast shadows; opaque dog pixels copied byte-for-byte")
PUBLIC_BASE = "https://media.pawjaipet.com/file/pawjai"  # same CDN as the original listing photos
MAX_WIDTH = 1350  # most originals are 1350 px wide; keep detail parity with control
WEBP_QUALITY = 90  # q82 visibly softened fur strands at 100%


def load(path, default=None):
    return json.load(open(path)) if os.path.exists(path) else default


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--worktree", required=True)
    ap.add_argument("--initial-cohorts", default="c1")
    ap.add_argument("--enabled", action="store_true", help="ship with the experiment on (default: off until the event migration is applied)")
    ap.add_argument("--mode", choices=["experiment", "rollout"], default="experiment",
                    help="rollout: every visitor sees the reviewed derivative (no randomisation, nothing measured)")
    args = ap.parse_args()
    wt = os.path.expanduser(args.worktree)
    sources = load(f"{INV}/sources.json")
    cls = load(f"{INV}/classification.json", {})
    qa = load(f"{INV}/{QA_FILE}", {})
    os.makedirs(f"{ROOT}/exports", exist_ok=True)

    entries, retained, catalogue = [], [], []
    for rec in sources:
        dog = rec["dog_id"]
        c = cls.get(dog, {})
        d = f"{ROOT}/outputs/{S.PIPELINE_VERSION}/{dog}/{rec.get('source_sha1', '')[:12]}"
        meta = load(f"{d}/meta.json", {})
        decision = qa.get(dog, {})
        row = {
            "dog_id": dog, "name": rec["name"], "listing_status": rec["adoption_status"], "shelter": rec["shelter_name"],
            "cover_media_type": rec["cover_type"], "cover_item_id": rec["cover_item_id"], "cover_url": rec["cover_url"],
            "source_url": rec.get("still_url"), "source_is_cover": rec.get("still_is_cover"),
            "source_sha1": rec.get("source_sha1"), "source_sha256": rec.get("source_sha256"),
            "source_size": None, "classification": c.get("classification"), "classification_note": c.get("note", ""),
            "method": None, "pipeline_version": None, "processing_status": None, "output_master": None,
            "output_derivative": None, "derivative_url": None, "experiment": None,
            "qa_decision": decision.get("decision"), "qa_notes": decision.get("notes", ""), "flags": meta.get("flags", []),
        }
        if rec.get("status") != "source_ok":
            row["processing_status"] = "missing_source"
        elif c.get("classification") == "existing_studio":
            row["processing_status"] = "existing_studio_retained"
            if rec["cover_type"] == "photo":
                retained.append({"dogId": dog, "reason": "existing studio photo retained"})
        elif c.get("skip"):
            row["processing_status"] = "skipped"
        elif decision.get("decision") == "not_selected":
            row["processing_status"] = "kept_original"
        elif not meta:
            row["processing_status"] = "not_processed"
        else:
            row.update(method=METHOD,
                       pipeline_version=S.PIPELINE_VERSION, source_size=meta.get("size"),
                       output_master=os.path.relpath(f"{d}/composite.png", ROOT))
            dec = decision.get("decision")
            if dec == "passed":
                row["processing_status"] = "passed"
                eligible = rec["adoption_status"] == "available" and rec["cover_type"] == "photo" and rec.get("still_is_cover")
                comp = Image.open(f"{d}/composite.png").convert("RGB")
                if comp.width > MAX_WIDTH:
                    comp = comp.resize((MAX_WIDTH, round(comp.height * MAX_WIDTH / comp.width)), Image.LANCZOS)
                rel = f"{B2_PREFIX}/{dog}/{rec['source_sha1'][:12]}{FILE_SUFFIX}.webp"
                local = f"{ROOT}/exports/{rel}"
                os.makedirs(os.path.dirname(local), exist_ok=True)
                tmp_png = f"{local}.tmp.png"
                comp.save(tmp_png)
                subprocess.run(["cwebp", "-quiet", "-q", str(WEBP_QUALITY), "-m", "6", "-sharp_yuv", "-metadata", "none",
                                tmp_png, "-o", local], check=True)
                os.remove(tmp_png)
                row["output_derivative"] = os.path.relpath(local, ROOT)
                row["derivative_bytes"] = os.path.getsize(local)
                row["derivative_size"] = [comp.width, comp.height]
                row["derivative_sha1"] = hashlib.sha1(open(local, "rb").read()).hexdigest()
                row["derivative_url"] = f"{PUBLIC_BASE}/{rel}"
                if eligible:
                    cohort = decision.get("cohort", "c2")
                    row["experiment"] = {"version": EXPERIMENT_VERSION, "cohort": cohort}
                    entries.append({
                        "dogId": dog, "cohort": cohort, "coverItemId": rec["cover_item_id"], "sourceUrl": rec["cover_url"],
                        "sourceSha1": rec["source_sha1"], "derivativeUrl": f"{PUBLIC_BASE}/{rel}",
                        "derivativeSha1": row["derivative_sha1"], "derivativeBytes": row["derivative_bytes"],
                        "width": comp.width, "height": comp.height,
                    })
                else:
                    row["experiment"] = {"excluded": "review catalogue only (" + ("adopted" if rec["adoption_status"] != "available" else "video cover preserved") + ")"}
            elif dec == "failed":
                row["processing_status"] = "failed"
            else:
                row["processing_status"] = "generated_pending_review"
        catalogue.append(row)

    entries.sort(key=lambda e: e["dogId"])
    retained.sort(key=lambda e: e["dogId"])
    cohorts = [c.strip() for c in args.initial_cohorts.split(",") if c.strip()]
    ts = ["// GENERATED by ~/PAWJAI-HQ/studio/scripts/export_experiment.py. Do not edit by hand.",
          "// Reviewed studio-background derivatives (pipeline " + S.PIPELINE_VERSION + "), hosted on the media CDN under",
          "// " + B2_PREFIX + "/ (additive B2 objects; originals untouched). Each entry is bound to the",
          "// exact cover it was made from; if the live cover changes, the entry stops applying.",
          'import type { StudioExperimentConfig, StudioManifestEntry } from "@/utils/studio-experiment-model";', "",
          "// Kill switch: `enabled` (or Vercel env PAWJAI_STUDIO_EXPERIMENT=off|c1|c1,c2).",
          ("// Rollout: every visitor sees the reviewed derivative for enabled cohorts; nothing is randomised or measured."
           if args.mode == "rollout" else
           "// Experiment: enabled cohorts are randomised 50/50 per visitor and dog (needs migration 20261117160000)."),
          "export const STUDIO_EXPERIMENT_DEFAULTS: StudioExperimentConfig = {",
          f'  version: "{EXPERIMENT_VERSION}",', f"  enabled: {'true' if args.enabled else 'false'},",
          f"  enabledCohorts: {json.dumps(cohorts)},"] + ([f'  mode: "rollout",'] if args.mode == "rollout" else []) + ["};", "",
          "export const STUDIO_EXPERIMENT_ENTRIES: StudioManifestEntry[] = ["]
    for e in entries:
        ts.append("  " + json.dumps(e, ensure_ascii=False) + ",")
    ts += ["];", "", "// Genuine studio photographs: kept unchanged and never used as treatments.",
           "export const STUDIO_EXPERIMENT_RETAINED_ORIGINALS: { dogId: string; reason: string }[] = ["]
    for r in retained:
        ts.append("  " + json.dumps(r) + ",")
    ts += ["];", ""]
    open(f"{wt}/utils/studio-experiment-manifest.ts", "w").write("\n".join(ts))
    json.dump({"generated_by": "export_experiment.py", "pipeline": S.PIPELINE_VERSION, "experiment": EXPERIMENT_VERSION,
               "inventory_captured_at_utc": "2026-11-17T15:25Z", "dogs": catalogue},
              open(f"{ROOT}/catalogue-manifest.json", "w"), ensure_ascii=False, indent=1)
    from collections import Counter
    print("catalogue", len(catalogue), Counter(r["processing_status"] for r in catalogue))
    print("experiment entries", len(entries), Counter(e["cohort"] for e in entries))
    print("retained studio covers", len(retained))


if __name__ == "__main__":
    main()
