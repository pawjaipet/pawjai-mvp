# PAWJAI Migration-Day Runbook

## Before opening the new account

- [ ] Keep the current personal account active and accessible.
- [ ] Keep the current `/Users/sudlabha/Desktop/paw` checkout untouched.
- [ ] Make a company-controlled backup of the repository and `handoff/`.
- [ ] Do not include `.env.local`, recovery codes, or the `pawjai related secrets/` folder in a normal repository upload.
- [ ] Confirm Resend and any previously exposed credentials are rotated or scheduled for rotation.

## In the new company account

- [ ] Add/open the company-owned repository.
- [ ] Grant Codex only the folder and service access required for the first task.
- [ ] Paste `FINAL-MIGRATION-PROMPT-2026-11-17.md`.
- [ ] Let the new account read and report before it edits anything.
- [ ] Compare its report against `SESSION-INDEX.md` and `CODEX-HISTORY-SNAPSHOT-2026-11-10.md`.
- [ ] Approve the proposed focused session map.
- [ ] Create the coordinator session first, then the implementation lanes.
- [ ] Verify at least one low-risk task end to end.

## Service verification order

1. GitHub repository read/push access
2. Vercel project and deployment access
3. Supabase project/dashboard/CLI access
4. Cloudflare DNS/CDN access
5. Backblaze media access
6. Resend domain and test-email access
7. Domain registrar access
8. Google OAuth/analytics and Figma access

Use `ADD-NEW -> VERIFY -> REMOVE-OLD` for every service. Never remove the old identity first.

## Cancellation gate

Do not cancel the personal Codex/ChatGPT subscription until the company account has passed the repository, session, and service verification steps. Cancellation should stop renewal only after the new account is genuinely usable. Keep the old account as a recovery path through the end of its paid period.

## After successful cutover

- [ ] Record the new company account/workspace name and verification date in a secure company system, not in a public repository file.
- [ ] Update this migration pack with any changed task names or service ownership.
- [ ] Confirm the old account is no longer the sole owner of any project, repository, domain, storage bucket, deployment, email sender, or connector.
- [ ] Only then cancel the old subscription and archive the personal recovery materials securely.
