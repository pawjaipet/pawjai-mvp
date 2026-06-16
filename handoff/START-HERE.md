# 👋 START HERE — new Claude account, PAWJAI project

This folder preserves the context of all the Claude Code work done on PAWJAI so a **new Claude account** (and/or new machine) can pick up smoothly. The work is UX/UI improvement of the dog-adoption app at **pawjai.co.th**.

## First: the important reassurance
**Switching Claude accounts does not touch your live app or any service.** GitHub, Vercel, Supabase, Backblaze, Cloudflare, and Resend are wired to *your own logins in those dashboards* — not to the Claude account. You can retire the old Claude account and `pawjai.co.th` keeps running, untouched. The only things tied to the old Claude account are the three below.

## What to do on the new account (≈5 minutes)

1. **Read the project context** (in this folder):
   - [HANDOFF.md](HANDOFF.md) — project overview, full session list, current state, open threads.
   - [sessions/](sessions/) — one short summary per past session.
   - [context/memory/](context/memory/) — the curated facts Claude had learned about PAWJAI (stack, repo, deploy flow, Figma file, Supabase project, storage buckets).

2. **Re-seed Claude's memory** (so the new account "remembers" the project): copy the three files in `handoff/context/memory/` into the new machine's memory dir for this project —
   `~/.claude/projects/<hash-of-repo-path>/memory/` — and add their one-line pointers to that folder's `MEMORY.md` index. *(Leave out the old PROUD memory entries — those belong to a separate personal project.)*

3. **Re-add the two MCP connectors** on the new Claude account (they don't travel with the account):
   - **Figma MCP** — for the design source (`PAWJAI-Currently`, file key `cfYww0U2M4xAkvHv3Gbvss`).
   - **Supabase MCP** — for the project `bdnyvcvkyepipdcygkvn`.
   Authorize each once on the new account; that's it.

4. **Recreate `.env.local`** (it's git-ignored, so it doesn't come with the clone). Use the variable **names** in [HANDOFF.md](HANDOFF.md) → Connections, pulling the values from each service dashboard. Then `npm install` and `npm run dev`.

## Where the work stands (open threads to continue)
From [HANDOFF.md](HANDOFF.md):
1. **Swipe-card "Treat" modal renders inline instead of as an overlay** — a `transform` ancestor breaks `position: fixed`; fix is to portal the modal to `document.body`. Not yet committed.
2. **Donation migrations not yet applied to the remote Supabase DB** — `donation_intents` table + `shelters` payment columns exist only as local migration files.

## One housekeeping note
There are two unpushed handoff commits on `main` (`9323ef1`, `af5a781`). The old machine's git is logged in as GitHub user `PROUD-AI`, which can't push to `pawjaipet`. From an account with repo access: `gh auth login` → `git push origin main`.

## What you can ignore
`MIGRATION-RUNBOOK.md` in this folder is a heavier "transfer ownership of every service" checklist — only relevant if you're moving the *services* to different dashboard logins, which the Claude-account switch does **not** require. Safe to skip (or delete) for a simple account handoff.
