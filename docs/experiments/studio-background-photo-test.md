# Studio-background dog photos (`studio-bg-v2`, live for everyone)

**Status (18 Nov 2026).** 17 dogs whose cover photo has a bad background (shelter runs, cages, concrete, tiled pens, dirt runs, clutter) show a reviewed studio-background edit of that same photo to every visitor, labelled **"Edited background" / "แก้ไขพื้นหลังภาพ"**. Every other dog keeps its original photo, so the feed mixes both. The database is unchanged: photo rows and original files are untouched, and the app swaps the feed image when the page is rendered.

**History.** v1 (`studio-bg-v1`) shipped as a 50/50 A/B test (cohort c1, 26 dogs) on 17 Nov at 18:29 UTC. The owner replaced it the same evening with this curated rollout (current traffic could not give a readable test result; see the test-length estimate in `ops/STUDIO-AB-LOG.md`). The v1 test recorded only QA exposures (visitor `748d32d7-45ed-48bf-b6f9-58e43bd92f2f`).

## Switches

- **Kill switch:** Vercel env `PAWJAI_STUDIO_EXPERIMENT=off`, then redeploy: everyone sees the original photos. Or set `enabled: false` in `utils/studio-experiment-manifest.ts`, revert the commit, or use Vercel Instant Rollback.
- **Mode:** `mode: "rollout"` in the manifest defaults. `resolveStudioPhotoAssignment` then returns the studio image for every visitor (no visitor id needed, nothing randomised, `measured: false`). Regenerating the manifest with `--mode experiment` brings back the 50/50 test (exposure events are allowed since migration `20261117160000` was applied on 17 Nov).
- **QA preview (not measured):** `https://www.pawjaipet.com/?studio_preview=control` shows the originals for comparison; `?studio_preview=studio` shows every reviewed edit.
- `scripts/studio-background/export_experiment.py` writes `enabled: false` unless run with `--enabled`, and experiment mode unless run with `--mode rollout`.

## What visitors see

- Same dog, listing id, feed order, matching, ads, limits, wishlist and booking flow. Only the **feed-card cover image** differs. The dog's profile page keeps the original photos for everyone.
- An entry applies only while the dog's live cover is still the exact media item and URL the edit was made from (`coverItemId` + `sourceUrl`); a replaced photo drops its stale edit automatically.
- If the edited image fails to load, the original is shown.

## Which dogs

Studio edit for cover photos with bad backgrounds: แมน, Smokey, Bow, Nadine, Nana, Nicola, Back, Ariela, Bella, Chai-Yo, Daniel, Dove, Spike, Dotti, Nam oi, Tua-dam, Tua-lheung.

Kept original: yard or greenery photos (9), event-backdrop photos from The Voice Foundation (8), edits that were not clean in review (another dog or a person merged in, a hand, a table edge; 9 + 2 video stills), unclear subjects (2), video covers, adopted dogs and genuine studio photos (`STUDIO_EXPERIMENT_RETAINED_ORIGINALS`). Per-dog decisions with reasons are in the local study folder (`inventory-2026-11-17/qa-decisions-v2.json`); `utils/studio-experiment-manifest.ts` is the live allowlist.

## How the images are made (local, no generative model)

Local and free on the Mac (`scripts/studio-background/`, working data outside git). Pipeline `studio-bg-v2.0`:

1. Reuses the reviewed v1.3 masks (Apple Vision subject lift and animal/human detection, guided-filter edge refinement).
2. Background: a procedural, matte, slightly off-white tarp that curves from backdrop to floor, calibrated to the founder's two real studio photos, with irregular low-contrast tone, broad hanging folds and a few shallow creases, all shaded by the light direction measured on the dog.
3. Grounding: contact shadows under the paws, a soft under-body shadow and a restrained cast shadow.
4. Every fully opaque dog pixel is copied byte-for-byte from the original (checked per image); only semi-transparent fur edges are colour-cleaned. Same crop, angle and aspect ratio.
5. Reviewed at feed-card size and full size beside the original, then exported as WebP (≤1350 px wide, quality 90).

## Where the images live

Additive B2 objects under the owner-named prefix, served by the same CDN as the originals: `https://media.pawjaipet.com/file/pawjai/experiments/studio-background-v1/<dog-id>/<source-sha1-12>-v2.webp`. The v1 edits (`<source-sha1-12>.webp`) remain beside them. Nothing was overwritten; originals and `dog_photos` rows were never modified or relinked. Each manifest entry records the derivative's SHA-1 and size.

## Measurement

Rollout mode sends no exposure events. The admin report (Admin → Analytics → **Studio photo test (.xlsx)**) reads the current manifest version, so it has no data while the rollout runs. Experiment events are never sent to Google Analytics.

## Rollback

Switch off (above) or revert the commit. Originals were never modified. Optional cleanup after retiring the edits: the owner can delete the `experiments/studio-background-v1/` objects in the B2 console; `delete from public.product_analytics_events where event_name = 'dog_photo_exposure';` removes the v1 QA exposure rows.

## Known limits

The edits replace the setting the dog was photographed in, so a few still show traces of the original light (hard sun, coloured bounce light). White names on light paper have lower contrast, as on the genuine studio photos. Internal browsing is not tagged in analytics.
