# Final Folder Audit

Audited: 2026-11-13

## Confirmed inside `/Users/sudlabha/Desktop/paw`

- Full working repository and current source tree.
- `AGENTS.md` and the project handoff files.
- `handoff/codex-account-migration/` with the portable migration pack.
- Historical session summaries, merge ledger, dated continuation prompts, brand context, financial model, and Supabase proof.
- Project snapshots, analytics workbooks, UX exports, and corporate identity assets.
- A legacy `handoff/MIGRATION-RUNBOOK.md` covering service ownership transfer; it contains older Claude/Anthropic wording and must be treated as a reference, not the current Codex plan.

## Present but not safe to migrate wholesale

- `.env.local`: local secrets and environment values.
- `pawjai related secrets/`: recovery codes, login material, and screenshots. Keep encrypted and transfer only through an approved password/secret-management process.
- `.vercel/`, `.codex-auth-profile-smoke.png`, `.claude/`, and similar local tool state: do not assume another account can reuse it.
- `tmp/`, `.next/`, `node_modules/`, caches, and build artifacts: reproducible or machine-specific; not required for context migration.
- `pawjai snapshots/`: useful historical backups, but verify contents and avoid uploading any snapshot that contains secrets or stale credentials.

## Outside this folder

The Codex task transcripts, sidebar state, account billing, OpenAI workspace permissions, third-party service ownership, and connected credentials are controlled by their respective services. The history snapshot records what was visible on this machine, but it is not a replacement for those cloud records.

## Cancellation gate

Do not cancel the personal subscription until the PAWJAI company account has successfully opened the repository, read the migration pack, created a test session, and verified the required GitHub/Vercel/Supabase/Cloudflare/Backblaze/Resend access. OpenAI says cancellation stops future renewal while paid features remain available through the current billing period; canceling the subscription does not itself transfer account data or service ownership.
