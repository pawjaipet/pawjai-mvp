# Shelter isolation repair - 2026-09-18

Three active partner shelters were audited with separate authenticated sessions.

## Repairs

- Block direct client changes to profile roles and portal identity. A role escalation was reproduced in a rolled-back transaction before repair.
- Verify the existing dog's shelter in the edit action, not only the submitted shelter ID. Scope the update to that original ownership.
- Scope workspace database queries before limits, including payment details, bookings, donations, availability and care records. Do not serialize global advertising/analytics data to shelter clients.
- Restrict write-capable portal membership to owner/staff.
- Enforce booking/donation dog-to-shelter links and message-to-booking links in database triggers. Prevent direct client tenant reassignment.
- Repair recursive adopter/booking RLS. Hide draft dogs and their photo/trait rows from unrelated clients.
- Give new uploads unique object paths to prevent simultaneous same-name uploads from overwriting one another.
- Patch vulnerable dependencies through npm audit fix (Next 16.3.5; audit now zero vulnerabilities).

Migration `20260918043110_shelter_tenant_isolation.sql` was tested with rollback, applied transactionally to the linked production database, and recorded with migration repair. It changes policies, functions, triggers and indexes, not application row shapes.

This changes shared server-side admin/shelter implementation, while preserving global admin's intentionally cross-shelter workspace.

## Evidence

- `scripts/check-shelter-isolation.sql`: 84 database checks across three shelters; all fixtures rolled back.
- `scripts/check-shelter-http-isolation.mjs`: 37 local HTTP checks, three concurrent shelter sessions, no content writes. Temporary test sessions signed out individually. Includes workspace serialization, foreign slug/editor/slip denial and admin denial. Recognizes Next streaming redirects.
- Synthetic workspace test: 750 dogs across three shelters; each gets its own limited page, not a globally limited page. Empty membership fails closed; global admin remains unscoped.
- Forged dog-edit action test: foreign and nonexistent dog IDs cannot be written.
- `npm run verify` passed (216 tests at run time; an additional admin-loader regression test passed separately). Existing 15 lint warnings, no errors; audit zero vulnerabilities.
- `npm run build` passed with patched dependencies.

Prior shelter upload/save/multi-breed work is included in the same release. A 30 MB MOV compression smoke test was previously run successfully; no test dog was persisted.

## Remaining limits

- This is bounded concurrent isolation testing, not a saturation/large-scale capacity benchmark. Existing workspace page limits remain (200 dogs/bookings); pagination is future work.
- Production has no `dog_care_*` tables as of this audit. The unapplied care-passport migration and safe activation need a separate focused repair; do not claim passport persistence has been validated.
- Supabase security advisor reports leaked-password protection disabled. No staff password or login identity was changed.
- Draft record access is restricted, but previously public media URLs are not made private by this migration.
