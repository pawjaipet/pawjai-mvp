# Studio-background photo test (`studio-bg-v1`)

Question: do dogs shown on a plain studio-style background get more profile opens than the same dogs on their original shelter photo? This is a hypothesis under test, not a known result.

## Status and switches

- **Shipped OFF.** `STUDIO_EXPERIMENT_DEFAULTS.enabled` is `false` until migration `supabase/migrations/20261117160000_photo_experiment_exposure_event.sql` is applied (owner approval). With the switch off, everyone sees the original photos and nothing is measured; the QA preview still works.
- **Turn on cohort c1 (26 dogs)** after the migration: either Vercel env `PAWJAI_STUDIO_EXPERIMENT=c1` + redeploy, or a one-line commit setting `enabled: true` in `utils/studio-experiment-manifest.ts`.
- **Expand:** `PAWJAI_STUDIO_EXPERIMENT=c1,c2` (adds 8 dogs with flagged caveats).
- **Kill switch:** `PAWJAI_STUDIO_EXPERIMENT=off` + redeploy (or Vercel Instant Rollback). Originals everywhere, no exposures.

## What visitors see

- Same dog, same listing id, same feed order, matching, ads, limits, wishlist and booking flow. Only the **feed-card cover image** differs.
- **Control:** the original cover photo, unchanged.
- **Studio:** a reviewed derivative of that same photo with the background replaced, labelled **"Edited background" / "แก้ไขพื้นหลังภาพ"**. The dog's profile page always shows the original photos, so the original is one tap away.
- Each visitor is assigned 50/50 **per dog**, deterministically from the existing first-party analytics visitor cookie (`pawjai_analytics_visitor`, 180 days) and the experiment version. Refreshes and the reshuffled feed never flip a visitor between versions of the same dog. A new version re-randomises.
- `proxy.ts` issues that same cookie on `/` and `/dogs` when it is missing, so a first-time visitor's very first feed render is already stable.
- No cookie (blocked) or no reviewed derivative → original photo, not part of the test.

## Which dogs are in it

`utils/studio-experiment-manifest.ts` (generated) is the allowlist and the derivative mapping, kept separate from the original media records (`dog_photos` and media manifests are never touched). An entry applies only while the dog's live cover is still the exact media item and URL the derivative was made from (`coverItemId` + `sourceUrl`); a replaced photo stops its stale derivative automatically.

Never treated: genuine studio originals (`STUDIO_EXPERIMENT_RETAINED_ORIGINALS`), video covers, adopted dogs, failed or unreviewed edits. Cohorts: `c1` = clean reviewed cohort, `c2` = passed with flagged caveats (e.g. leash end trimmed, handler removed, white coat on light paper).

## Where the images live

Derivatives are additive objects in the B2 bucket under the versioned prefix `experiments/studio-background-v1/<dog-id>/<source-sha1-12>.webp`, served by the same CDN as the originals (`https://media.pawjaipet.com/file/pawjai/…`). Each manifest entry records the derivative's SHA-1 and size. Originals were never overwritten, moved or relinked. A future pipeline uses a new prefix rather than replacing objects.

## How the images are made (no generative model)

Local and free on the Mac (`scripts/studio-background/`, working data outside git):

1. Inventory from the database (public listing + media rows, read-only), cover resolved with the app's own `buildDogMediaItems`, originals fetched from the public CDN and verified by B2 content SHA-1.
2. Apple Vision subject lift + animal/human detection picks the listing dog and flags other dogs, hands and people.
3. Composite: every fully opaque dog pixel is copied byte-for-byte from the original (checked automatically per image); only semi-transparent fur edges are colour-cleaned; the background is a procedural off-white paper sweep calibrated to the founder's two real studio photos, with soft contact shadows.
4. Every output reviewed beside its original at full size, in the 370×590 feed crop and with the mask overlaid. Failures are recorded with reasons, never published.
5. Passing derivatives exported as WebP (≤1350 px wide, quality 90) and uploaded with `upload_b2.mjs`, which uses the app's `uploadBufferToBackblaze`, lists the prefix first, refuses to overwrite and verifies every object by SHA-1.

## Measurement (first-party only)

- Event `dog_photo_exposure`, sent only for a **qualified exposure**: active feed card, cover slide showing, chosen image loaded, page visible, ≥60% of the photo in the viewport, nothing on top of it (tutorial, dialogs, banners) for one continuous second. Preloaded neighbour cards, hidden tabs, failed images and QA previews never qualify.
- Metadata: experiment version, variant, what was actually rendered (`studio` / `original` / `original_fallback`), cohort, source fingerprint, feed position, feed visit id, image load time. No form contents, messages, email addresses, documents or tokens.
- One exposure per dog per tab session (client dedupe); the report keeps the first exposure per visitor and dog.
- If the studio image fails to load, the original is shown and the exposure is recorded as `original_fallback`, which the report excludes instead of counting it as a studio exposure.
- Experiment events are **never sent to Google Analytics** (name-based block in `utils/product-analytics-client.ts`). GA4 stays consent-gated as before.
- The events route inserts experiment events separately, so if the database rejects them nothing else in the batch is lost.

## Report

Admin → Analytics → **Studio photo test (.xlsx)** (`/api/admin/analytics/studio-experiment`, HQ admins only). Unit: visitor × dog pair from its first qualified exposure. Primary metric: dog-detail opens within 24 h per exposure pair. Also shares (completed share sheet/link copy), booking starts and server-confirmed booking successes (24 h), and confirmed saves still present for signed-in pairs. Sheets: Summary (arms, Wilson intervals, visitor-clustered difference interval, exclusions, evidence status), Per dog, Daily, Definitions.

The report states **"Insufficient data"** until each arm has ≥300 exposure pairs and ≥40 detail opens in total. At 17 Nov 2026 traffic (~1,200 feed impressions a month) expect months, not days; a clear difference in profile opens is an engagement signal, not evidence about adoptions.

## QA preview (not measured)

- `https://www.pawjaipet.com/?studio_preview=studio` — every reviewed dog (any cohort) shows its studio version, even while the experiment is off.
- `https://www.pawjaipet.com/?studio_preview=control` — same dogs, original photos.
- A banner marks the page as a QA preview; no exposure events are sent. Like the focus-group preview, this is a public URL parameter, not access control.

## Rollback

Revert the commit (or switch off). Originals were never modified. Optional database cleanup after retiring the test: `delete from public.product_analytics_events where event_name = 'dog_photo_exposure';` then restore the previous check constraint. The B2 objects under `experiments/studio-background-v1/` can be removed by the owner in the B2 console if no longer needed.

## Known limits

Visitor cookies reset across browsers/devices; internal and QA browsing is not tagged (the QA preview is excluded at source); saves are a current snapshot; white names on light paper have lower contrast (as on the existing genuine studio photos).
