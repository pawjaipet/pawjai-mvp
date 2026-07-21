# 👋 START HERE — Codex handoff, PAWJAI front-end/UX

This folder preserves the context of all the AI-assisted work on PAWJAI so a **Codex** session can pick up the **front-end / UX-UI** work smoothly. Going forward PAWJAI lives under **Codex, not Claude** — which is a natural fit, since the **backend was already built in Codex**. The old Claude account is being retired (PROUD stays separate — don't mix them).

## First: the important reassurance
**Switching AI agents (Claude → Codex) does not touch your live app or any service.** GitHub, Vercel, Supabase, Backblaze, Cloudflare, and Resend are wired to *your own logins in those dashboards* — not to any agent or AI account. You can retire the old Claude account and `pawjaipet.com` keeps running, untouched. An AI agent is just a tool reading this repo.

## What to do to get Codex going (≈5 minutes)

1. **Install + sign in to Codex** on the machine you'll use (Codex CLI, signed in with your OpenAI/ChatGPT account). Open this repo in it.
2. **Codex auto-loads [`AGENTS.md`](../AGENTS.md)** at the repo root — that's its built-in context file (the Codex equivalent of Claude's memory). ⚠️ *It's currently stale (describes the old Figma-Make layout, not the current Next.js app) — see "Refresh AGENTS.md" below.*
3. **Read the project context** in this folder:
   - [HANDOFF.md](HANDOFF.md) — project overview, full session history, current state, open threads.
   - [sessions/](sessions/) — one short summary per past session.
   - [context/memory/](context/memory/) — reference facts about PAWJAI (stack, repo, deploy flow, Supabase project, storage buckets). *These were Claude's "memory" notes; for Codex they're just reference docs — no need to import them anywhere.*
4. **Recreate `.env.local`** (git-ignored, so it isn't in the clone). Variable **names** are in [HANDOFF.md](HANDOFF.md) → Connections; pull the values from each service dashboard. Then `npm install` and `npm run dev`.

## This is mainly a front-end / UX-UI handoff
The work you'll continue is **front-end and UX-UI** — the swipe feed, dog detail, profile, appointments, verification screens, donate UI, about page. The backend (Supabase schema, edge functions, donation data layer) is Codex's existing domain and is largely done.

**Figma is no longer central.** It was the original design source but is barely used now — treat the live app + these docs as the source of truth. (If you ever need the design file, the key is `cfYww0U2M4xAkvHv3Gbvss`, but you don't need a Figma connector to do the UX work.)

### Ready-to-paste Codex kickoff prompt
> You're picking up the PAWJAI project (Thai dog-adoption app, Next.js + TypeScript + Tailwind + shadcn/ui on Supabase, live at pawjaipet.com). I want you as my front-end / UX-UI partner. Before we start: read `AGENTS.md`, `handoff/HANDOFF.md`, and skim `handoff/sessions/`. Note the open threads in HANDOFF.md (the swipe-card Treat modal portal bug and the unapplied donation migrations). Then summarize back to me where the front-end stands and what you'd tackle first. We'll work screen-by-screen on UX/UI; the backend is already in good shape.

## Where the work stands (open threads to continue)
From [HANDOFF.md](HANDOFF.md):
1. **Swipe-card "Treat" modal renders inline instead of as an overlay** — a `transform` ancestor breaks `position: fixed`; fix is to portal the modal to `document.body`. Not yet committed.
2. **Donation migrations not yet applied to the remote Supabase DB** — `donation_intents` table + `shelters` payment columns exist only as local migration files. ▶ Ready-to-paste prompt: [prompts/apply-donation-migrations.md](prompts/apply-donation-migrations.md).
3. **Admin About-page editor bug** — `app/admin/pawjaiprofile/actions.ts` exports a plain object from a `"use server"` file (Next.js 16 forbids it). ▶ Ready-to-paste prompt: [prompts/admin-about-page-editor.md](prompts/admin-about-page-editor.md).

> **[prompts/](prompts/)** holds the full Codex prompts extracted verbatim from the (now-deleted) sessions, so the open threads above have ready-to-run instructions, not just descriptions.

## Refresh AGENTS.md (recommended)
`AGENTS.md` is the file Codex reads automatically, but it still documents Claude MCP tool names (`mcp__Figma__*`, `mcp__96b59bab…__*`) and the pre-Next.js file layout. For a clean Codex handoff it should be rewritten to: drop the Claude-MCP tool tables, de-emphasize Figma, and describe the current Next.js App Router structure + the real workflow (edit → commit → push to `main` → Vercel auto-deploys). *(Claude can do this for you before you leave, or ask Codex to do it as its first task.)*

## One housekeeping note (git)
This machine's `git` now pushes as GitHub `6658065556PS` (admin on the repo) via the `gh` credential helper. On the new setup, just authenticate `git`/`gh` as an account with access to `pawjaipet/pawjai-mvp` and you're set.
