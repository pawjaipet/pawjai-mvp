# PAWJAI New-Account Bootstrap Prompt

Paste this into the first Codex task after the PAWJAI company account has repository access:

> Read `AGENTS.md` and every file in `handoff/codex-account-migration/`, starting with `START-HERE.md`. Do not change code yet. Confirm that you understand the product, stack, current risks, service boundaries, session survivors, archived source sessions, and remaining work. Then create a proposed company session map using the survivor lanes in `SESSION-INDEX.md`. Keep specialized sessions separate. For each proposed session, provide its title, responsibility, source handoff file, first safe action, and whether it needs a fresh export before continuing. Do not create or archive Codex tasks until I approve the map.

After approval, create or rename the focused sessions from the approved map and seed each one with the matching prompt in `EXPORT-PROMPTS.md`. Preserve the repository and current git state. Do not expose secrets or claim a service is connected until access is verified.

## Recommended initial sessions

1. `PAWJAI Migration Coordinator`
2. `Admin and shelter portal architecture`
3. `BACKEND related`
4. `Auth and email automation`
5. `Analytics and measurement`
6. `Production, audit, and launch readiness`
7. `UX/UI User Frontend`
8. `Domain, DNS, and media infrastructure`
9. `Supabase access and MCP setup`
10. `Donation Backend Schema`

Keep brand, ads, finance, insurance research, visual references, and export/reference work as separate specialized sessions.
