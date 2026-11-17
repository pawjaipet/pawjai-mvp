# PAWJAI Codex Account Migration Pack

Updated: 2026-11-17
Repository: `/Users/sudlabha/Desktop/paw`
Canonical production URL: `https://www.pawjaipet.com`

## Purpose

This folder is the portable project briefing for moving PAWJAI work to another Codex account or a fresh Codex task. It preserves the current session map, merged responsibilities, implementation context, service boundaries, known open work, and ready-to-paste restart prompts.

The new account can understand and continue the project after it is given this repository and these instructions. It will not automatically recreate every old Codex task, transcript, permission, connected credential, or billing relationship unless the relevant OpenAI workspace migration flow explicitly transfers it.

## Read in this order

1. `CURRENT-PROJECT-CONTEXT.md`
2. `SESSION-INDEX.md`
3. `REMAINING-WORK.md`
4. `SERVICE-AND-CONNECTIONS.md`
5. `MERGE-LEDGER-SNAPSHOT.md`
6. `EXPORT-PROMPTS.md`
7. `ACCOUNT-MIGRATION-CHECKLIST.md`
8. `CODEX-HISTORY-SNAPSHOT-2026-11-10.md`
9. `SECURITY-CUTOVER-NOTES.md`
10. `FINAL-FOLDER-AUDIT-2026-11-13.md`
11. `MIGRATION-MANIFEST.md`
12. `FINAL-MIGRATION-PROMPT-2026-11-17.md`
13. `MIGRATION-DAY-RUNBOOK-2026-11-17.md`
14. `RECENT-SESSION-UPDATE-2026-11-17.md`
15. `INTERACTIVE-CONNECTION-SETUP.md`
16. The linked files in `handoff/sessions/` and `handoff/prompts/`

Also read the repository root `AGENTS.md` and `handoff/HANDOFF.md` before changing code.

## First commands in a new account

```bash
cd /Users/sudlabha/Desktop/paw
git status --short
sed -n '1,260p' AGENTS.md
sed -n '1,220p' handoff/codex-account-migration/CURRENT-PROJECT-CONTEXT.md
```

Treat current code, current git state, the newest dated handoff, and verified production evidence as authoritative. Do not assume an old Codex transcript is still available or that a local migration has reached production.

## Important boundary

This pack contains summaries and provenance, not a raw export of every Codex transcript. Original tasks remain in the Codex project/sidebar/archive when the account can access them. The repository pack is the durable recovery source if a task reaches a context or usage limit.

No secrets, `.env.local` values, service-role keys, access tokens, or private credentials belong in this folder.

For the actual company-account cutover sequence, use `ACCOUNT-MIGRATION-CHECKLIST.md`. The repository pack preserves context; it does not transfer OpenAI billing, account ownership, or third-party service ownership by itself.
