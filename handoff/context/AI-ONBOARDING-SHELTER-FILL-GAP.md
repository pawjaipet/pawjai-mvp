# AI onboarding system with shelter fill gap

Saved for later on 2026-11-17. User is migrating the project; do not continue implementation or deploy without a new request.

## Product direction

- Founder supplies shelter dog data/media in folders to an AI coding assistant. Process/import together; do not build a separate admin ingestion platform.
- Shelter employees review prefilled profiles and fill missing information through a low-friction, lightly gamified flow similar to the adopter filter/swipe experience.
- Support mobile and laptop: compact three-column dog grid; mobile quick questions; laptop photo beside questions; next/previous dog navigation and touch swipe on the photo.
- Save incomplete drafts at any time. Completed essentials plus explicit availability confirmation allow movement into Available.
- Personality and care details remain optional. Do not invent behavior or medical facts to fill gaps. Image-derived breed suggestions are uncertain; gender requires reliable evidence or shelter confirmation.
- Future shared staff review needs separate staff identities and conflict-safe writes, not last-write-wins overwrites.

## Local prototype

Files (currently untracked; include these explicitly when migrating):

- `app/doglistings/review-preview/page.tsx`
- `app/doglistings/review-preview/review-preview.tsx`
- `app/doglistings/review-preview/review.css`
- This handoff document.

Preview route: `http://localhost:3011/doglistings/review-preview`.
Run `npm run dev -- --port 3011` if no dev server is running. Reuse an existing server when appropriate; Next dev may refuse a second instance for this checkout.

The route returns notFound outside development. Uses 12 samples from `data/rescue-dog-thailand-dogs.json` and existing CDN media. Samples are not a representation of current shelter records. No database writes, real publishing, or production shelter changes.

Browser-only draft storage key: `pawjai-review-prototype-v2`. Browser storage is NOT a database and does not migrate automatically with source files. Sample edits can safely be discarded. Session progress resets on reload.

Implemented: Needs information / Available / All dogs, search, missing-field counts, one-question-at-a-time quick check, skip, all-details editor, optional personality/care, save draft, save-and-next, progress ticks, green save confirmation, unsaved-change guard, photo/video cover rendering. Required prototype essentials: name, gender, breed, colour, size, explicit availability confirmation. This is a proposed rule set, not a production validation change.

## Verification completed

Browser tested on 2026-11-15:
- Saved Bow with missing essentials as draft.
- Filled essentials and saved to Available, then reloaded and observed persisted state.
- Used quick questions for Gorya, supplied breed and availability, saved once and advanced to CJ with confirmation.
- Inspected mobile 390x844 and laptop 1366x900 layouts and checked document width for horizontal overflow.
- `npm run typecheck` passed after quick-review changes.

Screenshots were saved to `/tmp/pawjai-review-mobile.png` and `/tmp/pawjai-review-desktop.png`; temporary files are optional evidence, not migration dependencies.

## Resume checklist

1. Review visual direction with founder before production integration; preserve existing live portal until approved.
2. Replace prototype localStorage with shelter-scoped draft persistence and tested authorization. Add concurrent-edit/version protection and audit trail.
3. Align actual required fields, multilingual names, breeds, and matching tags with existing domain models. Ensure draft saves never require optional care/personality fields.
4. Add searchable multi-breed choices and colour swatches if approved; prototype currently uses text inputs for these.
5. Add Thai localization, keyboard/accessibility tests, automated flow tests, real-device swipe tests, and save-failure/storage-unavailable tests.
6. Refine Available editing: current prototype still offers Save draft and Save & next. Avoid accidental unpublishing when integrating.
7. Verify media/video thumbnails and completion feedback across devices; do not equate movement into the demo Available tab with public publishing.

No commit, push, or deployment was performed for this prototype. Repository has unrelated changes from other work: preserve them. The latest request is to save and pause, not ship.
