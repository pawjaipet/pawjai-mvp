# Remaining Work and Cautions

## Explicitly open or requiring verification

- Donation migrations and payment columns must be checked against the linked remote Supabase database before deployment claims.
- The care-passport schema was not present in the September isolation audit; do not claim passport persistence is complete.
- Supabase leaked-password protection warning remained open in the dated security evidence.
- Public media URLs were not made private by the shelter isolation work.
- Large-video encoding still needs device-level QA across real mobile browsers.
- Matching preference application changes were uncommitted and undeployed in the 2026-10-21 handoff; inspect current git state before acting.
- The Treat donation modal was previously reported as needing a `document.body` portal because a transformed ancestor breaks fixed positioning.
- The Next.js 16 admin About-page server-action export issue remains listed in `AGENTS.md`; verify whether current code has resolved it before editing.

## Verified dated evidence

- Shelter isolation migration `20260918043110` was tested and applied transactionally with database and HTTP isolation checks.
- Shelter save reliability migrations `20260924062041` and `20260925055328` were applied; 224 tests passed at that handoff.
- GA4 deployment commit `70a0571` was verified with 229 tests, typecheck, build, and production checks.
- Matching preference migration `20261021062027` was applied and round-trip tested; application changes were not committed/deployed in that handoff.
- Guest discovery and HQ export work was documented on 2026-10-24; role enforcement and bounded export limits were tested.

## Working rule

Before changing any of these areas, read the relevant dated session file, inspect `git status --short`, and verify the live/database state instead of relying on a historical task message.
