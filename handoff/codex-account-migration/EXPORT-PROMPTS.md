# Ready-to-Paste Fresh Session Prompts

Use one prompt per new Codex task when an old task reaches a context or usage limit.

## Backend operations

Read `AGENTS.md`, `handoff/codex-account-migration/START-HERE.md`, `handoff/codex-account-migration/CURRENT-PROJECT-CONTEXT.md`, and `handoff/prompts/backend-operations-current-state-2026-10-28.md`. Continue the `BACKEND related` lane for booking, messaging, dog intake, media, and filters. Inspect current code and `git status` first. Separate verified/deployed work from uncommitted work. Do not reapply migrations without checking Supabase.

## Admin and shelter

Read `AGENTS.md`, the migration pack, and `handoff/prompts/admin-shelter-architecture-current-state-2026-10-28.md`. Continue admin/shelter architecture from the current repository. Preserve tenant isolation, global-admin scope, and existing dirty changes. Verify before editing.

## UX/UI frontend

Read `AGENTS.md`, the migration pack, and `handoff/prompts/uxui-frontend-current-state-2026-10-28.md`. Continue adopter-facing UX/UI only, preserving the public dog profile versus Adopted Pet Passport boundary. Inspect current routes and tests before making changes.

## Production audit

Read `AGENTS.md`, the migration pack, and `handoff/prompts/production-launch-audit-current-state-2026-10-28.md`. Audit current production readiness, security, SEO, and launch risks. Treat local migrations and old task claims as unverified until checked.

## Auth and email

Read `AGENTS.md`, the migration pack, and `handoff/prompts/auth-email-current-state-2026-10-28.md`. Continue auth, OAuth, Resend, and business-email routing work. Do not expose or request secrets in chat.

## Analytics

Read `AGENTS.md`, the migration pack, and `handoff/prompts/analytics-measurement-current-state-2026-10-28.md`. Continue GA4/product measurement with consent, privacy exclusions, and operational analytics boundaries intact.
