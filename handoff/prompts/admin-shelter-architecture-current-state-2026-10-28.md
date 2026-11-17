# PAWJAI Admin and Shelter Architecture Handoff — 2026-10-28

## Session merge

This handoff consolidates the context from:

- `Plan admin reorg` — task `019f2349-a0c1-7691-ad08-8f00abc9f113`
- `shelter portal` — task `019f8480-01fa-7ce0-bb45-99591a3bde85`

Use the survivor task for HQ admin, shelter portals, employee access, mobile workflows, dog listing creation/editing, bookings, accounts, and role-scoped operations.

## Current product model

- PawJai HQ/global admin sees the full umbrella across shelters, dogs, bookings, ads, About content, accounts, and audit.
- Shelter staff use `/shelter` and `/shelter/[slug]`, scoped to their shelter membership and shelter ID.
- Shared booking routes are `/booking/[id]`, `/booking/[id]/visitor-profile`, and `/booking/check-in`.
- Public dog profiles are the intentional public crossover; shelter/admin controls must not leak into them.
- Legacy `/admin/*` remains a fallback until `/admindraft` and shelter routes pass pilot QA.

## Verified recent work to preserve

- `handoff/sessions/2026-09-18-shelter-isolation.md`: tenant isolation, RLS, role/write boundaries, dog ownership checks, scoped workspace queries, triggers, upload paths, 216 tests at that time, and the remaining care-passport limits.
- `handoff/sessions/2026-09-25-shelter-save-reliability.md`: transactional matching/media saves, stale-save rejection, video preparation limits, required fields, rollback tests, and remaining device QA.
- Recent account/admin work separates adopter accounts from shelter accounts and keeps shelter access restricted to `/shelter`.

## Important remaining risks

- Care-passport tables were not present in production at the last audit; do not claim care-record persistence is complete.
- Leaked-password protection remained an existing Supabase warning.
- Large-video encoding still needs real device/browser QA.
- Keep unrelated dirty worktree changes intact; inspect `git status` before edits.

## Fresh-session kickoff prompt

Read `AGENTS.md`, `handoff/HANDOFF.md`, this file, `handoff/sessions/2026-09-18-shelter-isolation.md`, and `handoff/sessions/2026-09-25-shelter-save-reliability.md`. Then inspect current `/admindraft`, `/admin`, `/shelter`, `/booking`, accounts, and role-scoping code. Preserve existing worktree changes. Report current state before changing code. Do not mix donation, finance, brand, or analytics work into this lane.
