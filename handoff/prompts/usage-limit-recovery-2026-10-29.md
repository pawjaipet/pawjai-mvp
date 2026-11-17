# PAWJAI Usage-Limit Recovery Handoff — 2026-10-29

## Why this exists

Several PAWJAI Codex tasks show `You've hit your usage limit` / `systemError`. This is an account/task execution limit, not evidence that the repository, task transcripts, or saved handoffs were deleted.

Do not attempt to bypass the limit. When usage is available again, continue from the saved files below rather than depending on the old task's context window.

## Consolidated survivor tasks

| Survivor | Export to read first | Current purpose |
|---|---|---|
| `Admin and shelter portal architecture` | `handoff/prompts/admin-shelter-architecture-current-state-2026-10-28.md` | HQ admin, shelter portal, roles, dog listings, bookings, mobile workflows |
| `BACKEND related` | `handoff/prompts/backend-operations-current-state-2026-10-28.md` | Booking, messaging, attachments, dog intake, matching/filter backend |
| `Auth and email automation` | `handoff/prompts/auth-email-current-state-2026-10-28.md` | Auth, OAuth, Resend, Cloudflare forwarding, future Workspace |
| `Production, audit, and launch readiness` | `handoff/prompts/production-launch-audit-current-state-2026-10-28.md` | Security, health, SEO, public trust, launch readiness |
| `Analytics and measurement` | `handoff/prompts/analytics-measurement-current-state-2026-10-28.md` | GA4, product analytics, auth funnel, consent, focus-group data |
| `UX/UI User Frontend` | `handoff/prompts/uxui-frontend-current-state-2026-10-28.md` | Adopter-facing UX/UI, trust pages, discovery, profile, documents |

## Other PAWJAI tasks intentionally kept separate

- `Map session responsibilities`
- `Domain, DNS, and media infrastructure`
- `Supabase access and MCP setup`
- `Donation Backend Schema`
- `ADS page`
- `Create PAWJAI marketing CI`
- `Build PAW expansion budget`
- `Analyze pet insurance competitors`
- `[Image]` / visual reference task
- `snapshots exports`

These were not discarded or merged into unrelated lanes. Their existing task histories and repository files remain the source context.

## What was already completed before the limit

- Six dated export-MD files were created.
- Preservation notes were posted to the survivor tasks where the tool accepted them.
- Survivor names were applied.
- Redundant duplicate tasks were archived: `Plan admin reorg`, `MESSAGES`, `RESEND automation email`, `Set up Pawjai business email`, `Review launch readiness`, `Fix PAWJAI auth analytics`, `UXUI User Frontend design`, and `Connect to PAWJAI frontend`.
- The merge ledger was updated at `handoff/codex-session-merge-ledger.md`.

## Safe continuation prompt

Read `AGENTS.md`, `handoff/HANDOFF.md`, `handoff/codex-session-merge-ledger.md`, this file, and the relevant lane export above. Check `git status` before changing anything. Treat the newest dated handoff, current code, verified production evidence, and current git state as authoritative. Preserve unrelated dirty worktree changes. Do not repeat completed work, reapply migrations without checking the remote state, or claim deployment without verification.

## Important boundary

This recovery file does not change the account usage limit. It makes the work resumable from the repository even if the original Codex task remains unavailable.
