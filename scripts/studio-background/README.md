# Studio-background pipeline (local tool, not part of the app bundle)

Produces the reviewed derivatives used by the `studio-bg-v1` photo test
(see `docs/experiments/studio-background-photo-test.md`). Runs on a Mac,
locally and free: no paid or remote image service and no generative model; no
photo is sent to any outside processing service. Only the reviewed derivatives
are uploaded, to PawJai's own B2 bucket. Working data lives outside git
(default `~/PAWJAI-HQ/studio/white-background-study`, override with
`PAWJAI_STUDIO_ROOT`). Originals are fetched from the public CDN only; the
uploader is the only step that needs credentials.

## Requirements

macOS 14+ (Apple Vision subject lift), Python 3.12 with numpy, scipy,
scikit-image, Pillow, and `pyobjc-framework-Vision` (a venv created with
`--system-site-packages` works), `cwebp`, and Node 22+ for the cover resolver
and the uploader.

## Steps (each is resumable and never writes to originals)

1. **Inventory**: read public listing + media rows (dogs, dog_photos, the
   media traits) read-only, save as `inventory-*/db-snapshot.json`.
2. **Resolve covers with the app's own code**:
   `node resolve-covers.mjs <repo> <db-snapshot.json> <resolved-media.json>`
   runs `utils/dog-media.ts` (`buildDogMediaItems`) exactly as the feed does.
3. **Fetch sources**: `python3 fetch_sources.py` downloads each primary still
   (cover photo, or first still for video-first dogs) from the public CDN,
   reusing cached files when B2's `x-bz-content-sha1` matches.
4. **Classify** (human): `inventory-*/classification.json` marks existing
   studio photos (retained), ambiguous/complex cases and skips with reasons.
5. **Process**: `.venv/bin/python run_pipeline.py process [--only …] [--force]`
   — Vision mask → dog instance selection (other dogs/people flagged) →
   guided-filter edge refinement → off-white sweep calibrated to the founder's
   two studio references → contact shadows → composite. Opaque dog pixels are
   copied byte-for-byte; `meta.json` records `opaque_pixels_identical`.
   Outputs: `outputs/<pipeline-version>/<dog-id>/<source-sha1-12>/`.
6. **Review** (human): `run_pipeline.py review` builds sheets (original,
   composite, 370×590 feed crop, removed-area overlay). Record decisions in
   `inventory-*/qa-decisions.json` (`passed` + cohort, or `failed` + reason).
7. **Export**: `export_experiment.py --worktree <repo> [--enabled]` writes WebP
   derivatives to `exports/experiments/studio-background-v1/<dog-id>/<source-sha1-12>.webp`
   and regenerates `utils/studio-experiment-manifest.ts` (CDN URL, SHA-1 and
   size per derivative; shipped off unless `--enabled`), plus the full
   catalogue manifest.
8. **Upload (additive only)**:
   `node --import ./server-only-shim.mjs --env-file=<path to .env.local> upload_b2.mjs <repo> <exports-root> [--dry-run]`.
   Loads credentials only into the process (never printed), uses the app's
   `uploadBufferToBackblaze`, uploads only derivatives the manifest references,
   lists the prefix first and refuses to overwrite any existing object, then
   verifies every object by SHA-1. Never touches originals or `dog_photos`.
9. **Comparison page**: `build_comparison.py` writes a local `index.html`
   covering every dog (passed, failed, skipped, retained, with reasons).

A changed source photo gets a new hash, so its old derivative stops matching
the live cover and stops applying in the app; rerun steps 1–8 for it. A new
pipeline version uploads under a new prefix instead of replacing objects.
