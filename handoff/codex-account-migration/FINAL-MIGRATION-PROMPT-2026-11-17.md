# Final PAWJAI Migration Prompt

Paste this as the first message in the new company-owned Codex account after the PAWJAI repository is available.

```text
You are taking over the PAWJAI company project. Do not start coding yet.

Repository: /Users/sudlabha/Desktop/paw
Product: PAWJAI, a Thai dog adoption and matching platform
Production URL: https://www.pawjaipet.com

Read these files completely and in this order:
1. AGENTS.md
2. handoff/codex-account-migration/START-HERE.md
3. handoff/codex-account-migration/CURRENT-PROJECT-CONTEXT.md
4. handoff/codex-account-migration/SESSION-INDEX.md
5. handoff/codex-account-migration/CODEX-HISTORY-SNAPSHOT-2026-11-10.md
6. handoff/codex-account-migration/REMAINING-WORK.md
7. handoff/codex-account-migration/SERVICE-AND-CONNECTIONS.md
8. handoff/codex-account-migration/MERGE-LEDGER-SNAPSHOT.md
9. handoff/codex-account-migration/MIGRATION-MANIFEST.md
10. handoff/codex-account-migration/SECURITY-CUTOVER-NOTES.md
11. handoff/codex-account-migration/FINAL-FOLDER-AUDIT-2026-11-13.md
12. handoff/HANDOFF.md
13. handoff/codex-account-migration/RECENT-SESSION-UPDATE-2026-11-17.md

Then inspect the relevant dated files in handoff/sessions/ and handoff/prompts/. Do not assume an old Codex transcript, task title, local credential, or deployment claim is still authoritative. Use the current code, current git state, newest dated handoff, and verified service state as the source of truth.

Before editing anything, report:
- what you understand PAWJAI to be;
- the current stack and production boundaries;
- the active survivor sessions and what each owns;
- the archived sessions and where their context was preserved;
- the remaining open risks and unverified claims;
- which services are connected in this account and which are not;
- whether the repository contains uncommitted or untracked work;
- whether any required context is missing.

Pay special attention to the recent session update: preserve the untracked `app/doglistings/review-preview/` prototype and verify the reported `390eecd` production baseline before making changes.

Do not read or print secrets from .env.local, pawjai related secrets/, .claude/, .vercel/, caches, or local auth profiles. Do not reset, clean, delete, or overwrite the working tree. Do not run destructive database commands. Do not claim a service is connected until it is verified in the new company account.

After the report, propose the clean company session structure using the survivor lanes in SESSION-INDEX.md. Do not create, rename, merge, or archive tasks until the owner approves the proposed map. Once approved, create focused sessions and seed them with the matching prompts in EXPORT-PROMPTS.md.

The first implementation task must be low-risk and read-only or documentation-only. Record its result in handoff before touching production code.
```

## Expected first response from the new account

The new account should produce an understanding report and a proposed session map. It should not immediately make code changes, rotate credentials, archive tasks, apply migrations, or publish a deployment.
