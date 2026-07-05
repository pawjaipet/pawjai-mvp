# Recommended Agent Skills For PAWJAI

Keep this list small. Skills are dependencies for agent behavior, so install or rely on only the ones that match PAWJAI's real workflows.

## Keep Active

- Supabase: use for Auth, RLS, migrations, Storage, Edge Functions, and database security review.
- Figma: use for implementing PAWJAI screens from the canonical Figma Make file.
- Browser verification: use after frontend changes to inspect real pages, screenshots, forms, and broken layouts.
- Systematic debugging: use for failing tests, unexpected runtime behavior, auth/session problems, or broken Supabase calls.
- Test-driven development: use for risky logic changes in booking, verification, matching, donations, and security.
- Verification before completion: use before claiming work is done.
- Vercel/Next.js: use for App Router, deployment, env vars, routing middleware, and production behavior.

## Add As Project Playbooks

These are project-specific and should live in `docs/playbooks/`, not as global skills:

- PAWJAI security audit
- PAWJAI new feature workflow
- PAWJAI Supabase change workflow
- PAWJAI Figma screen workflow
- PAWJAI admin flow workflow
- PAWJAI context cleanup workflow
- PAWJAI release check

## Avoid For Now

- Generic "10x engineer" skill packs with unclear source or behavior.
- Skills that auto-edit code without verification.
- Skills that require handing secrets or private repo contents to a third-party service.
- Large knowledge-graph tools until the repo is cleaned and a lightweight `docs/agent-map.md` proves useful.

## Token Budget Rules

- Read `docs/agent-map.md` before broad repo exploration.
- Use `rg` and focused file reads before opening large files.
- Summarize findings in docs when a decision will matter again.
- Use subagents only for independent tasks with clear outputs.
- Do not paste large Figma or Supabase outputs into chat unless needed.
- Prefer one verification command: `npm run verify`.
