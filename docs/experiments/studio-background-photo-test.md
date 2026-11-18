# Studio-background dog photos (`studio-bg-v3`, live for everyone)

**Status (18 Nov 2026).** Every listed dog whose cover photo needed it shows a reviewed studio edit of that same photo to every visitor, labelled **"Edited background" / "แก้ไขพื้นหลังภาพ"**. This covers shelter runs, cages, concrete, tiles, dirt, clutter, event banners and messy yards. Dogs whose cover is already a real studio photo, whose natural background is already clean and attractive, or that cannot be cut out cleanly keep their original photo. The database is unchanged: photo rows and original files are untouched, and the app swaps the feed image when the page is rendered.

**History.**
- v1 (`studio-bg-v1`) shipped as a 50/50 A/B test on 17 Nov at 18:29 UTC. It recorded only QA exposures (visitor `748d32d7-45ed-48bf-b6f9-58e43bd92f2f`).
- v2 (`studio-bg-v2`) followed the same evening as a rollout to 17 dogs. The owner switched it off on 18 Nov ("too greenscreen") and asked for v3.

## Which dogs

**Edited (18):** Ariela, Back, Bella, Bow, CJ, Dotti, Dove, Nana, Nicola, Omega, Smokey, Tua-dam, ดำ (dum), ทองขาว (thong khao), บ่อปรือ (bobhu), หลง (Lhong), หางดำ (black tail), แมน (maan).

Cut-outs hand-fixed first (another dog or a gap removed): Omega.

**Kept original:**

- Aurora: cannot be cut cleanly: her white tail against the grass comes out semi-transparent
- Demi: hard backlit midday sun on the dog cannot be matched to soft studio light without retouching
- Jessica: cannot be cut cleanly: her ear lies over the dog behind her
- Marshmallow: strong green light from the grass on the white coat cannot be removed with global adjustments
- Nam oi: cannot be cut cleanly: her tail lies on patterned tile and tile shows between her legs
- Nash: video cover (the feed plays the video)
- Nid: adopted (not in the feed)
- Poo: cannot be cut cleanly: a table edge hides the lower half of his body, so removing it would leave him cut off
- Rambo: video cover (the feed plays the video)
- Roselyn: background already clean and attractive (tidy lawn, house and hedge)
- Sky: cannot be cut cleanly: his front paws rest on a person; removing the person would misstate the scene
- Taengkwa: background already clean and attractive (soft green foliage)
- Tua-tom: cannot be cut cleanly: another dog's head touches his ear
- Tubtim: adopted (not in the feed)
- Tulip: cannot be cut cleanly: another dog stands in front of her and covers part of her body
- White Egg: cover is a letterboxed screenshot with a pole in front of the dog
- ตัวแดง (Tua Daang): cannot be cut cleanly: wispy head fur and the open mouth sit over the event banner
- ทองดำ (Tong Dum): video cover (the feed plays the video)
- วอน: three dogs in the photo; it is not clear which one is วอน
- เจ้าพระยา (Jao Praya): video cover (the feed plays the video)
- แม่น้ำ (River): cannot be cut cleanly: her tail lies on the floor under her belly, mostly hidden
- Butcher: rejected in independent review (hand-cut edge on the far hind leg and a sliced-off leash end)
- Chai-Yo: rejected in independent review (dark halo around the black coat and weak grounding)
- Daniel: rejected in independent review (the old floor shadow under the chin stays inside the cut-out)
- Gorya: rejected in independent review (blue wall tint left in the tail tips)
- Jollie: rejected in independent review (weak grounding under the body)
- Nadine: rejected in independent review (dark halo around the black coat)
- Spike: rejected in independent review (dark halo around the black coat)
- Thalia: rejected in independent review (the long coat's edge comes out too smooth)
- Tua-lheung: rejected in independent review (weak grounding under the body)
- Tun: rejected in independent review (pale halo along the forelegs)
- ยะลา (yala): rejected in independent review (hard, die-cut outline)
- เฮงเฮง (hong hong): rejected in independent review (hard, die-cut outline and conflicting shadows)
- Genuine studio photos (7): Alan, Green, Swing, มะม่วง (mango), ยุ่น, หูตั้ง, หูพับ.

Per-dog decisions, global adjustments and QA results live in the local study folder (`inventory-2026-11-17/qa-decisions-v3.json`, `outputs/studio-bg-v3.0/*/meta.json`); `utils/studio-experiment-manifest.ts` is the live allowlist.

## Switches

- **Kill switch:** Vercel env `PAWJAI_STUDIO_EXPERIMENT=off`, then redeploy, and everyone sees the original photos. Alternatively set `enabled: false` in `utils/studio-experiment-manifest.ts`, revert the commit, or use Vercel Instant Rollback.
- **Mode:** `mode: "rollout"` in the manifest defaults. `resolveStudioPhotoAssignment` then returns the studio image for every visitor: no visitor id is needed, nothing is randomised, and `measured` is false. Regenerating the manifest with `--mode experiment` brings back the 50/50 test (exposure events are allowed since migration `20261117160000`).
- **QA preview (not measured):** `?studio_preview=control` shows the originals for comparison, and `?studio_preview=studio` shows every reviewed edit.
- **Regenerating the manifest:** `scripts/studio-background/export_experiment.py` writes `enabled: false` unless run with `--enabled`, and experiment mode unless run with `--mode rollout`.

## What visitors see

- **Same flow:** the same dog, listing id, feed order, matching, ads, limits, wishlist and booking flow.
- **Only the cover changes:** the feed-card cover image is the one thing that differs. The dog's profile page keeps the original photos for everyone.
- **Stale edits drop out:** an entry applies only while the dog's live cover is still the exact media item and URL the edit was made from (`coverItemId` + `sourceUrl`). A replaced photo drops its stale edit automatically.
- **Fallback:** if the edited image fails to load, the original is shown.

## How the images are made (local, no generative model)

The images are made locally, free, on the Mac (`scripts/studio-background/`, working data outside git). Pipeline `studio-bg-v3.x` (each dog ships its best independently reviewed render of v3.1, v3.2 or v3.3; `review/v3/best-version.json`):

1. **Cut-out:**
   - The reviewed v1.3 mask: Apple Vision subject lift and animal/human detection, plus guided-filter edges.
   - Where that mask merged another dog or kept a gap, a hand-guided fix (`fix_masks.py`): GrabCut seeded with hand-placed boxes or colour seeds. It only ever removes area, never adds pixels to the dog.
2. **Light on the dog:** global, photographer-style adjustments only, recorded per dog in `meta.json` (`dog_adjustments`):
   - white-balance gains measured on neutral fur or the old background
   - exposure (EV)
   - a tone curve (highlight shoulder, shadow lift)
   - a soft directional falloff consistent with the studio key light

   There is no local retouching: no sharpening, no redrawn fur, no change to eyes, markings, tongue or shape. QA recomputes the recorded adjustment from the original and checks that every interior dog pixel matches it exactly.
3. **Backdrop:** a seamless sweep. The floor curves up into the wall at the original photo's floor/wall line, and is floor almost everywhere for top-down shots. One soft key light makes a pool of light around the dog that falls off with distance, with a darker wall toward the top. It carries a faint paper texture, and the palette is calibrated to the founder's two studio photos; white dogs get a greyer paper.
4. **Camera match:** the backdrop is blurred to the original background's depth of field, with sensor grain matched to the photo.
5. **Edges:** decontamination of the soft fur edge, cleanup of the old background's colour spill in the edge band, and light wrap from the backdrop.
6. **Shadows:** contact shadows under the paws, a soft under-body shadow and a cast shadow, all from one key light.
7. **Review:** every image is checked at full size, at feed-card size and with 100% crops of the head, paws and busiest fur edge, beside the original and the real studio photos. Anything that looks pasted in is rejected.
8. **Export:** WebP, at most 1350 px wide, quality 90.

## Where the images live

The images are additive B2 objects under the owner-named prefix, served by the same CDN as the originals: `https://media.pawjaipet.com/file/pawjai/experiments/studio-background-v1/<dog-id>/<source-sha1-12>-v3.webp`. The v1 and v2 edits remain beside them (`<sha12>.webp`, `<sha12>-v2.webp`). Nothing was overwritten. Originals and `dog_photos` rows were never modified or relinked. Each manifest entry records the derivative's SHA-1 and size.

## Measurement

Rollout mode sends no exposure events. The admin report (Admin → Analytics → **Studio photo test (.xlsx)**) reads the current manifest version, so it has no data while the rollout runs. Experiment events are never sent to Google Analytics.

## Rollback

Switch off (see above) or revert the commit; the originals were never modified. Optional cleanup after retiring the edits:
- The owner can delete the `experiments/studio-background-v1/` objects in the B2 console.
- `delete from public.product_analytics_events where event_name = 'dog_photo_exposure';` removes the v1 QA exposure rows.

## Known limits

- The original light is matched globally, not recreated, so a photo taken in hard sun still shows hard-sun shading on the dog.
- White names on light paper have lower contrast, as on the genuine studio photos.
- Internal browsing is not tagged in analytics.
