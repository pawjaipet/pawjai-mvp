# Check And Fix Admin Dog Media CDN

You are working in the PAWJAI repo at `/Users/sudlabha/Desktop/paw`.

PAWJAI is live at `https://www.pawjaipet.com`. Dog media should be served from the Cloudflare CDN in front of Backblaze B2:

```text
https://media.pawjaipet.com/file/pawjai
```

The earlier issue: dog profiles created or edited from the admin page could still save Supabase Storage public URLs. Before scaling shelter onboarding, every public dog photo/video URL saved by admin dog creation/editing must resolve through the CDN media layer, not direct Supabase Storage.

## Goals

1. Verify admin-created dog profiles save CDN URLs for uploaded photos, source-URL photos mirrored to B2, and uploaded videos/posters.
2. Verify existing public dog profile rendering normalizes legacy Backblaze/Supabase/B2 URLs to the CDN wherever possible.
3. Add or fix tests so regressions are caught by `npm run verify`.
4. Leave private adopter/document/appointment storage alone unless directly relevant.

## Files To Inspect First

```text
app/admin/dogs/new/actions.ts
app/admin/dogs/[id]/edit/actions.ts
utils/backblaze.ts
utils/dog-media.ts
components/SwipeDogCard.tsx
components/dogs/DogPhotoGallery.tsx
tests/dog-media.test.mjs
tests/server-actions.test.mjs
```

## Checks

Run code searches:

```bash
rg -n "supabase\\.co/storage|getPublicUrl|dog-photos|public_url|uploadBufferToBackblaze|normalizeDogMediaUrl" app components utils tests
```

Confirm:

- Admin new dog uploads call `uploadBufferToBackblaze` and save `uploaded.publicUrl`.
- Admin edit uploads call `uploadBufferToBackblaze` and save `uploaded.publicUrl`.
- Failed B2 mirroring does not silently save a Supabase public URL for dog media unless there is an intentional, documented fallback.
- Render paths use `normalizeDogMediaUrl`.
- Tests assert admin new/edit action source does not persist Supabase Storage public URLs for dog media.

## Optional Live DB Check

Use the linked Supabase project only after confirming credentials are available:

```bash
npm exec supabase -- db query --linked "select public_url from public.dog_photos where public_url like '%supabase.co/storage%' order by created_at desc limit 25"
npm exec supabase -- db query --linked "select trait_value from public.dog_traits where trait_type in ('cover_video_url','cover_video_poster_url') and trait_value like '%supabase.co/storage%' order by dog_id limit 25"
```

If rows are found and they are public dog media, convert only URLs that have a clear B2/CDN equivalent. Do not rewrite private document, profile, appointment, or shelter asset URLs as part of this task.

## Verification

Run:

```bash
npm run verify
```

For a production spot check, create or edit one dog from the admin UI with a small test image, then open the public dog profile and inspect image/video requests. They should load from `media.pawjaipet.com`, not Supabase Storage.

## Final Report

Return:

1. Whether code saves CDN URLs for new admin dog media.
2. Whether code saves CDN URLs for edited admin dog media.
3. Whether existing DB rows still contain Supabase public dog-media URLs.
4. Exact tests/commands run and results.
5. Any remaining intentional exceptions.
