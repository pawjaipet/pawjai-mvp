# PAWJAI User UX/UI Handoff — 2026-10-28

## Session merge

This handoff consolidates:

- `UXUI new` — `01a0d8df-47ef-72b2-8d2d-fef8cc123f14`
- `UXUI User Frontend design` — `019ed9b8-49f1-7651-aa6e-4135ab3234cb`
- `Connect to PAWJAI frontend` — `01a08e8e-6909-7700-ad0d-6d1985c52404`

## Responsibility

Adopter-facing frontend, visual hierarchy, tutorial/paw gesture, profile, verification, wishlist, documents, discovery, trust pages, and responsive UX.

## Current source of truth

- The live app and current code are the design source of truth; Figma is legacy reference only.
- `handoff/brand/ci/README.md` is the source of truth for marketing graphics and corporate identity.
- Keep public dog profiles separate from the post-adoption Adopted Pet Passport/care-record surface.
- Do not move care records into the public dog profile.

## Known recent product context

- Guest filters, discovery, shelter badges/logos, tutorial persistence, feed loading states, and public trust pages have newer work represented in the October handoffs and current dirty worktree.
- Treat/donation UX must be reconciled with the latest code rather than relying on the older open-thread wording in AGENTS.

## Fresh-session kickoff prompt

Read `AGENTS.md`, `handoff/HANDOFF.md`, this file, `handoff/brand/ci/README.md`, and the latest guest-discovery and matching handoffs. Inspect the live components and responsive behavior before editing. Preserve unrelated dirty changes and verify public/adopter routes without touching backend schemas unless explicitly requested.
