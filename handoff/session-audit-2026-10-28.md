# PAWJAI Session Audit — 2026-10-28

Purpose: inventory the Codex tasks currently associated with `/Users/sudlabha/Desktop/paw`, compare them with the repository handoff files, identify merge candidates, and mark where a fresh export-MD handoff should be created before continuing in a new task.

This is an audit only. No task was renamed, archived, merged, or sent a follow-up message during this audit.

## Executive Summary

The project has a healthy newer handoff layer, but the sidebar still contains overlapping generations of work. The most important pattern is that several older umbrella tasks are no longer the best place to continue: newer focused tasks now hold the current implementation state.

Recommended order:

1. Export fresh handoffs for the long-running active/large-context tasks before using them again.
2. Merge only clear duplicates after the export note is posted into the survivor.
3. Archive completed reference tasks once their final state is represented in `handoff/sessions/` or a prompt file.
4. Keep production, finance, brand, analytics, and product research separate from implementation buckets.

## Current PAWJAI Codex Task Inventory

The following are the PAWJAI project tasks visible in the Codex sidebar at the time of this audit. Status is based on the task listing; “notLoaded” means the task is not currently loaded in the sidebar runtime, not that its work is lost.

| Task | Status | Current responsibility / evidence | Recommended action | Fresh export-MD? |
|---|---|---|---|---|
| `Map session responsibilities` | active | Session housekeeping, merge ledger, tracker coordination | Keep as the index/coordinator; do not merge into product work | Yes, after this audit if the map continues growing |
| `shelter portal` | active | Dedicated shelter portal continuation | Keep as the active shelter product lane; compare against `Plan admin reorg` before merging | Yes, high priority |
| `UXUI new` | notLoaded | Newer UX/UI continuation: tutorial/paw gesture, trust pages, frontend work, commits/push | Treat as the current UX/UI survivor; merge or supersede old UX/UI context only after exporting it | Yes, medium |
| `UXUI User Frontend design` | idle | Older user-facing frontend, profile, verification, wishlist, documents context | Preserve historical decisions, then archive or merge into `UXUI new` | Yes, high priority |
| `Connect to PAWJAI frontend` | notLoaded | Older frontend-context confirmation task | Archive after confirming its useful context is represented in UX/UI handoff files | No, unless it contains unique decisions |
| `BACKEND related` | notLoaded | Booking, reschedule, accept/deny, admin detail sync, dog/media/filter backend, messaging backend | Keep as backend/operations umbrella; do not merge broadly while newer shelter/message work is active | Yes, high priority |
| `MESSAGES` | notLoaded | Earlier messaging pipeline and QA work; much of it is already shipped | Merge into `BACKEND related` after exporting the final message pipeline state | Yes, before archive |
| `Plan admin reorg` | idle | Admin umbrella, shelter onboarding, employee roles, mobile admin, global HQ workspace | Keep as admin architecture survivor; compare with `shelter portal` | Yes, high priority |
| `Production, audit, and and launch safety` | notLoaded | Production recovery, launch checks, domain/auth/Resend health-check context | Rename later to remove duplicated “and”; keep separate from implementation lanes | Yes, high priority |
| `Domain, DNS, and media infrastructure` | not shown in current active list; previously merged survivor | Domain, Cloudflare DNS/CDN, Vercel, Backblaze media, old-domain recovery | Treat as the infrastructure survivor; verify whether it is archived/hidden and restore only if needed | Yes, if reopened for active work |
| `Supabase access and MCP setup` | notLoaded | Supabase access, dog import, The Voice Foundation photo URLs/import sheet | Keep as the database/access lane; do not merge with all backend work | Yes, high priority |
| `Fix PAWJAI auth analytics` | notLoaded | Signup, email verification, profile setup analytics | Merge conceptually with analytics/auth only after verifying current changes are committed/deployed | Yes, medium |
| `Choose website activity tracking` | notLoaded | GA4, event tracking, focus-group save-count preview, marketing measurement | Keep as analytics/experimentation; merge with auth analytics only for reporting, not implementation | Yes, high priority |
| `OAUTH n Emails` | notLoaded | Account creation, login, preferences/wishlist, booking email context | Candidate for `Auth and email automation` with Resend/business email | Yes, medium |
| `RESEND automation email` | notLoaded | Transactional email implementation | Candidate for `Auth and email automation`; inspect secrets in its old summary before reuse | Yes, medium |
| `Set up Pawjai business email` | notLoaded | Business email setup using Resend/Cloudflare/Workspace concepts | Candidate for `Auth and email automation`, but keep human inbox routing distinct inside the handoff | Yes, medium |
| `Donation Backend Schema` | idle | Donation schema, shelter payment details, donation intent backend | Keep separate until remote migration state is confirmed; do not bury in generic backend | Yes, high priority |
| `Review launch readiness` | idle | Founder-facing “what is missing before launch/scale?” review | Candidate for `Production, audit, and and launch safety` after exporting its launch gaps | Yes, high priority |
| `ADS page` | notLoaded | Admin ads filters, search, status, dog listing relation | Keep separate until ad workflow is fully verified; then merge into admin architecture | Yes, medium |
| `Create PAWJAI marketing CI` | notLoaded | Corporate identity, marketing asset standards, brand system | Keep separate from product implementation; source of truth is now `handoff/brand/ci/` | Yes, medium |
| `Build PAW expansion budget` | notLoaded | Expansion budget, projections, references, subscriptions, evidence, Google Form requirements | Keep separate from engineering; use `handoff/context/FINANCIAL-MODEL-2026-09-03.md` as source of truth | Yes, high priority if continuing |
| `Analyze pet insurance competitors` | notLoaded | Market research for insurance products | Keep separate as business research; do not merge into donation or backend work | No, unless research is still active |
| `Image` task | notLoaded | Visual feedback/reference session | Keep separate or merge into current UX/UI only after identifying its remaining purpose | No, unless it has unique design decisions |

## Recommended Merge Map

| Proposed survivor | Combine | Why | Caution |
|---|---|---|---|
| `BACKEND related` | `MESSAGES` | Appointment messaging is tied to bookings, shelter replies, attachments, return inquiries, private storage, and admin visibility | Export the final `MESSAGES` state first; do not lose shipped commit/test evidence |
| `Admin and shelter portal architecture` | `Plan admin reorg` + `shelter portal` | Both describe shelter staff workflows, HQ umbrella permissions, mobile admin, dog listings, bookings, and scoped employee access | The active `shelter portal` task should be read/exported before selecting the survivor |
| `Auth and email automation` | `OAUTH n Emails` + `RESEND automation email` + `Set up Pawjai business email` | Auth, OAuth branding, transactional mail, Cloudflare forwarding, and future Workspace planning are connected | Keep Resend transactional sending separate from human mailbox routing inside the notes |
| `Production, audit, and launch readiness` | `Production, audit, and and launch safety` + `Review launch readiness` | Both cover launch blockers, security, SEO, production checks, and pre-scale risk | Do not absorb domain infrastructure or finance into this task |
| `Analytics and measurement` | `Choose website activity tracking` + `Fix PAWJAI auth analytics` | Both measure user behavior and auth conversion signals | Keep GA4 configuration, product analytics, and privacy decisions explicit |
| `UX/UI User Frontend design` | `UXUI User Frontend design` + `UXUI new` + possibly `Connect to PAWJAI frontend` | These are multiple generations of the same user-side frontend/design lane | Export old UX/UI decisions first; the newer task appears to be the active continuation |
| `Domain, DNS, and media infrastructure` | Already merged: `Migrate to new domain` + `Cloudflare CDN for Backblaze` | Domain, DNS, Vercel, Backblaze, and Cloudflare are one infrastructure boundary | Verify sidebar/archive state; do not duplicate it in production audit |

## Keep Separate

| Task / area | Reason |
|---|---|
| `Donation Backend Schema` | It has remote migration and payment-data risk; keep visible until verified. |
| `Create PAWJAI marketing CI` | Brand governance and marketing assets need a stable source of truth, not implementation-task churn. |
| `Build PAW expansion budget` | Financial projections are assumptions, not engineering status; keep the financial model distinct. |
| `Analyze pet insurance competitors` | Market research is strategic input, not a code/session umbrella. |
| `ADS page` | A distinct admin product workflow; merge later only after end-to-end verification. |
| `Image` | Unknown/visual reference work should not be merged blindly. |
| `Supabase access and MCP setup` | Access and migration authority are sensitive and should remain a deliberate lane. |

## Sessions That Need Fresh Export-MD Handoffs

These are the tasks most likely to lose context if continued directly, either because they are large historical umbrellas, have newer replacement tasks, or contain production/security decisions.

| Priority | Task | Why export now | Suggested export filename | New-session prompt focus |
|---|---|---|---|---|
| 1 | `shelter portal` | Active, broad, and overlaps with admin reorg; likely to run into context limits during shelter rollout | `handoff/prompts/shelter-portal-current-state-2026-10-28.md` | Read current shelter isolation/save reliability sessions, inspect current routes, continue only from verified production state |
| 1 | `BACKEND related` | Long-running umbrella with booking, messaging, imports, media, filters, and backend changes | `handoff/prompts/backend-operations-current-state-2026-10-28.md` | Read latest migrations and tests; separate committed/deployed work from dirty worktree changes |
| 1 | `Plan admin reorg` | Large architecture history plus newer account/shelter work | `handoff/prompts/admin-shelter-architecture-current-state-2026-10-28.md` | Reconcile `/admindraft`, `/admin`, `/shelter`, accounts, bookings, and role boundaries |
| 1 | `Production, audit, and and launch safety` | Production/security/launch context spans multiple generations | `handoff/prompts/production-launch-audit-current-state-2026-10-28.md` | Read current AGENTS, reliability, SEO, auth, analytics, and Supabase proof files before changing anything |
| 1 | `Donation Backend Schema` | Remote migration state may be stale and donation failures are high-impact | `handoff/prompts/donation-production-state-2026-10-28.md` | Verify remote migrations first; never assume local SQL equals production |
| 2 | `UXUI User Frontend design` | Older UX/UI context has a newer `UXUI new` continuation | `handoff/prompts/uxui-frontend-legacy-export-2026-10-28.md` | Preserve only decisions/assets still relevant; then continue from `UXUI new` |
| 2 | `MESSAGES` | Mostly shipped but spread across older message/booking work | `handoff/prompts/messaging-final-state-2026-10-28.md` | Export final routes, roles, attachments, tests, commits, and known follow-ups before merging into backend |
| 2 | `Choose website activity tracking` | GA4/focus-group work has deployment and privacy implications | `handoff/prompts/analytics-measurement-current-state-2026-10-28.md` | Keep real analytics, QA/focus-group previews, consent, and privacy boundaries separate |
| 2 | `Fix PAWJAI auth analytics` | Auth analytics overlaps with GA4 and auth flows | `handoff/prompts/auth-analytics-current-state-2026-10-28.md` | Check deployed commit and current event taxonomy before more changes |
| 2 | `Build PAW expansion budget` | Financial model is a separate source-of-truth context and should not age silently | `handoff/prompts/expansion-budget-current-state-2026-10-28.md` | Read `FINANCIAL-MODEL-2026-09-03.md`; treat all numbers as projections |
| 3 | `Create PAWJAI marketing CI` | Brand work has now become a real handoff folder with assets and tokens | `handoff/prompts/marketing-ci-current-state-2026-10-28.md` | Read `handoff/brand/ci/README.md` before creating marketing assets |

## Repository Handoff Coverage

The repo already contains useful recent export files for the newest work:

| Existing handoff | Coverage |
|---|---|
| `2026-09-18-shelter-isolation.md` | Tenant isolation, RLS, role/write boundaries, production verification, remaining care-passport limits |
| `2026-09-25-shelter-save-reliability.md` | Matching tags, media saves, video limits, required fields, rollback tests, remaining device QA |
| `2026-10-03-ga4-website-tracking.md` | GA4 setup, event taxonomy, consent/privacy boundaries, production verification, UX measurement priorities |
| `2026-10-21-matching-preference-sync.md` | Matching schema, preference persistence, restoration, filters, tests, deployment state |
| `2026-10-24-guest-discovery-exports.md` | Guest discovery, donation setup, HQ dog/booking exports, banking verification, test coverage |
| `handoff/supabase-advisor-final-proof-2026-08-30.md` | Security-advisor proof and remaining security warning context |
| `handoff/brand/ci/README.md` | Current corporate identity source of truth |
| `handoff/context/FINANCIAL-MODEL-2026-09-03.md` | Current projection assumptions and scenario boundaries |

The main gap is not that the project has no handoff files; it is that the sidebar has newer tasks whose current final state is not yet represented in one dated export per surviving lane.

## Export-MD Prompt Template

Use this when a task is nearing its context limit:

```text
Create a concise but complete PAWJAI handoff for this task before continuing.

Write it to:
handoff/prompts/<descriptive-name>-2026-10-28.md

Include:
1. Original goal and current responsibility.
2. Every relevant file, route, migration, service, and external connection.
3. What was completed, including commit/deploy/test evidence.
4. What remains open, blocked, or only locally changed.
5. Exact production/database/auth/storage state; distinguish verified facts from assumptions.
6. Dirty or unrelated worktree changes that must not be overwritten.
7. Safe next steps for a fresh Codex task.
8. A ready-to-paste kickoff prompt that tells the next task what to read and what not to change.

Do not include secrets, API keys, passwords, tokens, or private account values.
Do not claim local migrations or local code are deployed unless verified.
```

## Important Evidence Caveat

The root `AGENTS.md` still lists several older open threads (Treat modal, donation migrations, admin About editor) even though later code/session evidence may have changed their status. A fresh session should treat the newest dated handoff files, current code, current git status, and verified production checks as authoritative, then reconcile stale AGENTS entries before making changes.
