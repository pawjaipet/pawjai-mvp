# PAWJAI — Account Migration Handoff

**Prepared:** 2026-06-15 · **Last updated:** 2026-06-18 (Codex re-verification — transcript/session count, connection inventory, MCP auth notes, env-var names, dirty worktree status) · **Purpose:** hand this repo off to a fresh machine and a different Anthropic/Claude account, cleanly disconnecting the old account from every external service.

---

## Project overview

**PAWJAI** is a Thai dog-adoption platform — a **Next.js 16** (App Router, server actions, Turbopack) + **TypeScript** + **Tailwind** app, backed by **Supabase** (Postgres, Auth via `@supabase/ssr`, storage). Media is served from **Backblaze B2** behind a **Cloudflare** CDN (`media.pawjai.co.th`); transactional email goes through **Resend**. It's deployed in **production** on **Vercel** at **pawjai.co.th**. The GitHub repo is `pawjaipet/pawjai-mvp`.

**Actively being extended right now:**
- **Donations** — "Send Treats" QR + bank-transfer screen, donation intents, shelter payment details. **Shipped to `main`** (commits `92f6d1c` Treat button + modal, `4b1ce77` QR screen).
- **Appointments / messaging** — chat attachments, return-inquiry backend, quick-action chips, reschedule flow.
- **Admin tooling** — editable About-page profile (`pawjai_profile` table now live in remote DB), booking QR check-in, dog photo management. ⚠️ Admin editor page has a `"use server"` export bug — a Codex prompt exists to fix it (see [about-page session](sessions/2026-05-27_about-page.md)).
- **Adopter preference filtering** — dog matching wizard.

> ### ⚠️ Open threads to pick up on the new machine
> 1. **Swipe-card Treat modal renders inline instead of as an overlay (OPEN BUG).** A `transform` ancestor on the swipe card breaks the modal's `position: fixed`. Fix in progress: portal `TreatModal` to `document.body` via `createPortal`. Not yet committed. See [donate session](sessions/2026-06-08_pawjai-uxui.md).
> 2. **Donation migrations are NOT applied to the remote Supabase DB.** `donation_intents` table + `shelters.promptpay_id/bank_name/bank_account_number/bank_account_name` columns exist only as local migration files. Until Codex applies them, `createDonationIntent` fails silently and the donate screen shows its empty state.
> 3. **Admin-auth + security hardening sweep is uncommitted in the main checkout.** New routes `/admin/login`, `/admin/accounts`, `/admin/audit`; new utils `utils/admin-audit.ts`, `utils/admin-authorization.ts`, `utils/rate-limit.ts`; deleted top-level `middleware.ts` in favor of `proxy.ts`; new test `tests/admin-authorization.test.mjs`; **three new SQL migrations not applied to remote Supabase**: `20260615120000_admin_auth_audit_and_booking_guards.sql`, `20260615123000_rate_limit_buckets.sql`, `20260615124500_supabase_advisor_security_fixes.sql` (plus `20260526230000_about_page_content.sql`). Plus modifications to most `app/admin/**` files and several `app/*/actions.ts`. See `git status` and the [worktree session](sessions/2026-05-17_worktree-figma-mcp-uxui-polish.md) "Admin auth + security hardening sweep" subsection. **Decide whether to finish/commit before touching `/admin` on the new machine.**
> 4. **Swipe-feed logo resize task** still open from the resumed `7837dd7e` snapshot — user wants the PawJai logo bigger/proportional on the swipe feed to match Figma. Current size `h-[60px] w-[140px]` in `components/SwipeFeed.tsx`.

There is also a **separate personal project, "PROUD,"** whose Claude Code sessions ran inside this same directory. Those sessions are listed below but flagged `NON-PAWJAI` — they belong to a different repo / GitHub / Vercel and should not be conflated with PAWJAI when revoking access.

---

## Session summary

Reconstructed directly from the `.jsonl` transcripts. **Two** Claude-project directories exist for this repo because one long-running session was run inside a git worktree:
- `~/.claude/projects/-Users-sudlabha-Desktop-paw/` — 18 `.jsonl` transcripts from the main checkout on this machine.
- `~/.claude/projects/-Users-sudlabha-Desktop-paw--claude-worktrees-vigilant-bhaskara-eb96de/` — 1 transcript from the `.claude/worktrees/vigilant-bhaskara-eb96de` git worktree.

There was **no** `sessions-index.json` in either directory when rechecked; metadata below was derived from the `.jsonl` transcripts themselves. Current inventory: 18 main-checkout `.jsonl` transcripts + 1 worktree `.jsonl` transcript, represented as 19 session summary files in `handoff/sessions/` (the initial build doc also references older resumed snapshot IDs that are not present as separate local `.jsonl` files). Re-verified 2026-06-18 against the live transcripts, `.vercel/repo.json`, `.claude/settings.local.json`, `supabase/config.toml`, and env-var names.

### PAWJAI sessions

| Date | Session | What | State | File |
|------|---------|------|-------|------|
| 2026-04-20 → 05-17 (initial) · `7837dd7e` resumed through 2026-06-16 | `1b12712c` (+`502eaa6b`,`7837dd7e`) | Initial build: Figma import, swipe feed, auth modal, admin, Supabase scaffold. **`7837dd7e` resumed for an extensive UI polish second life** (swipe feed sizing/ads, profile redesign, appointments redesign, `/schedule/[dogId]` routing, multi-photo upload, verification per-section drafts, admin dog-form error summary). | Done; **open: swipe-feed logo resize** | [link](sessions/2026-04_initial-build-figma-auth.md) |
| 2026-05-17 → 06-16 | `26138611` (worktree) | Figma MCP setup + long-running UX/UI polish (logo crop, header overlaps, real QR, chat attachments, settings/Subscription page, More cleanup, Filter wizard scroll mode, dog-detail back button) **+ admin-auth + security hardening sweep (post-06-08, in-flight, uncommitted)** | Polish: shipped (~25 commits cherry-picked to `main`). Admin-auth sweep: **uncommitted**, 3 migrations not applied | [link](sessions/2026-05-17_worktree-figma-mcp-uxui-polish.md) |
| 2026-05-26 | `6b40d9ab` | Adopter preference filtering + migration repair | Done (PR #1) | [link](sessions/2026-05-26_adopter-preference-filtering.md) |
| 2026-06-15 | `f6544bb9` | Push + merge booking-email notifications (PR #1) to main; finalize handoff docs + push | Done | [link](sessions/2026-06-15_merge-and-handoff-push.md) |
| 2026-05-26 | `6c0d8df0` | Cloudflare CDN in front of Backblaze B2 | Done (verify env var) | [link](sessions/2026-05-26_cloudflare-cdn.md) |
| 2026-05-27 → 06-16 | `19ea920d` | About-page restructure (shelters first, big cards, live Supabase fetch), `pawjai_profile` migration applied to remote DB, logo_url added to shelter type, Codex prompt written for admin editor bug | Done (open: admin editor bug, shelter logo input missing) | [link](sessions/2026-05-27_about-page.md) |
| 2026-06-08 | `70bdcf52` | Messages tab quick-action chips (Figma UX/UI) | Done (no live screenshot) | [link](sessions/2026-06-08_figma-uxui-messages.md) |
| 2026-06-08 | `d4e5b3ee` | Donate QR + bank screen kickoff/discovery | Done (shipped later) | [link](sessions/2026-06-08_donate-qr-prompt.md) |
| 2026-06-08 → 06-15 | `1f669b51` | Donations UX: Treat button + modal (Prompt 1) & Send Treats QR screen (Prompt 2) | Shipped to main; 2 open threads (modal portal bug, unapplied migrations) | [link](sessions/2026-06-08_pawjai-uxui.md) |
| 2026-06-09 | `2aa49bab` | Account-separation advisory (two Claude accounts) | Done | [link](sessions/2026-06-09_account-separation.md) |
| 2026-06-15 → 06-17 | `03201a97` | Handoff documentation (first pass), later resumed for PROUD-vs-PAWJAI transcript separation notes | Done | [link](sessions/2026-06-15_recent-hello.md) |

### Off-topic / trivial sessions (ran in this dir incidentally)

| Date | Session | What | State | File |
|------|---------|------|-------|------|
| 2026-05-20 | `13ea035e` | iPhone mass-SMS question | Abandoned | [link](sessions/2026-05-20_iphone-sms.md) |
| 2026-06-07 | `5251deb7` | Gmail (Berkeley) — sent a test email | Done (unrelated) | [link](sessions/2026-06-07_gmail-berkeley.md) |
| 2026-06-08 | `38ec0b86` | Empty greeting | Done (empty) | [link](sessions/2026-06-08_hello-trivial.md) |

### PROUD sessions — NON-PAWJAI (separate personal project)

| Date | Session | What | File |
|------|---------|------|------|
| 2026-06-09 → 06-14 | `3c8e2037` | PROUD agent/role structure | [link](sessions/proud-2026-06-09_agent-structure.md) |
| 2026-06-09 → 06-10 | `7a1f9031` | PROUD Mac setup + repo/account move | [link](sessions/proud-2026-06-09_setup-account-move.md) |
| 2026-06-10 → 06-14 | `1936d5b1` | PROUD identity building | [link](sessions/proud-2026-06-10_identity-building.md) |
| 2026-06-10 → 06-11 | `c13fd30d` | PROUD web build (`PROUD/site/`) | [link](sessions/proud-2026-06-10_web-build.md) |
| 2026-06-10 | `96cf6256` | PROUD intake manifest | [link](sessions/proud-2026-06-10_intake-manifest.md) |

---

## Connections (external services)

> Variable **names only** below — no secret values appear in this handoff. Real values live in `.env.local` (git-ignored) and in each service's own dashboard.

| Service | Wired to | Config / env-var names |
|---------|----------|------------------------|
| **GitHub** | `pawjaipet/pawjai-mvp` (org `pawjaipet`), branch `main` | git remote `origin` = `https://github.com/pawjaipet/pawjai-mvp.git`. Recheck 2026-06-18: `main...origin/main`, no unpushed commits, but many uncommitted app/admin-auth files in the working tree. |
| **Vercel** | Production deploy → `pawjai.co.th` | Linked via `.vercel/repo.json` (git-ignored): project `pawjai-mvp` id `prj_hqDpCgHngxahehXoognmVuXw1OBk`, team/org id `team_97uk7kuLt4prWHNQbfZV8y73`. `VERCEL_OIDC_TOKEN` present in `.env.local` |
| **Supabase** | Project ref `bdnyvcvkyepipdcygkvn` (URL public in `.env.example`); local `supabase/config.toml` project_id `paw` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`, plus referenced-but-not-currently-local vars `PAWJAI_BOOKING_TOKEN_SECRET`, `PAWJAI_IMPORT_SHELTER_NAME`. `supabase/config.toml` also references `OPENAI_API_KEY` for local Supabase Studio AI only. |
| **Backblaze B2** | Media/object storage (origin behind CDN) | `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_ID`, `PAWJAI_B2_PUBLIC_BASE_URL` |
| **Cloudflare** | CDN/DNS for `media.pawjai.co.th` (proxies Backblaze), domain `pawjai.co.th` | No env vars in repo; managed in Cloudflare dashboard. ⚠️ A Cloudflare API token was pasted into session `6c0d8df0` — treat as exposed, rotate it. |
| **Resend** | Transactional/booking email | `RESEND_API_KEY`, `PAWJAI_EMAIL_FROM` |
| **Figma MCP** | Design source (`PAWJAI-Currently` Figma Make file, key `cfYww0U2M4xAkvHv3Gbvss`) | Claude-account-level MCP connector (no project `.mcp.json`); OAuth tied to the Figma account. `.claude/settings.local.json` only records allowed tool names such as `mcp__plugin_design_figma__*` / `mcp__Figma__*`; it does not contain auth. |
| **Supabase MCP** | Same Supabase project, via Claude | Claude-account-level MCP connector `96b59bab-9681-4ba9-97d1-24bbaec99e22`; uses a Supabase access token. `.claude/settings.local.json` permits tools such as `mcp__96b59bab-...__execute_sql`, but auth lives outside the repo. |
| **Domain registrar** | `pawjai.co.th` registration | Registrar not recorded in repo; verify dashboard ownership separately from Cloudflare DNS before retiring any old account. |
| **Google / Gmail** | Berkeley account (used incidentally in session `5251deb7`) | Browser session on this machine only — no repo config |

**MCP note:** there is **no `.mcp.json`** in the repo. Project `.claude/settings.local.json` contains Claude Code permission allow-list entries for Figma and Supabase MCP tools, but no credentials. The Figma and Supabase MCP servers are configured as **connectors on the Claude account itself** — so they travel with the *account*, not the repo. Switching Claude accounts automatically drops their auth; re-authorize them in the new account before using Figma/Supabase MCP.

---

## DISCONNECT CHECKLIST (do manually, in each dashboard)

Do these **after** the new machine is confirmed working (see Restore). Goal: remove the **old** account's access without destroying the production services.

### 1. GitHub (old personal account)
- **Repo access:** github.com/pawjaipet → Settings → **Collaborators and teams** (or Org → People). Remove the old personal account from the `pawjaipet` org / `pawjai-mvp` repo **only after** the new account has been added as owner/admin.
- **Tokens:** github.com → Settings → Developer settings → **Personal access tokens** (classic + fine-grained) → revoke any token used for this repo. Also **SSH and GPG keys** → remove the old machine's key.
- **OAuth/Authorized apps:** Settings → **Applications → Authorized OAuth Apps** → revoke Vercel, Supabase, and any Claude/Figma integrations authorized under the old account.
- **DO NOT:** delete the repo, the `pawjaipet` org, or any branches/PRs.

### 2. Vercel
- vercel.com → **Account/Team Settings → Members** → ensure the **new** account is a member/owner of the team that owns the `pawjai` project, then **remove the old account**.
- Settings → **Tokens** → revoke any personal access tokens; the old machine's CLI login (`vercel logout` on the old machine).
- Re-check the Git integration is connected via the **new** GitHub account so deploys keep flowing.
- **DO NOT:** delete the `pawjai` project, the `pawjai.co.th` domain, or production env vars. (Also leave the **separate PROUD** Vercel project alone.)

### 3. Supabase
- supabase.com → Organization → **Team / Members** → add the new account, then **remove the old account** from the org.
- Account → **Access Tokens** → revoke tokens tied to the old account / old machine (these back the Supabase CLI + MCP).
- If the Supabase MCP used a dedicated access token, revoke it here.
- **DO NOT:** pause/delete the project `bdnyvcvkyepipdcygkvn`, its database, storage buckets, or auth config.

### 4. Backblaze B2
- backblaze.com → **App Keys** → if the old account/machine should lose access, create fresh keys for the new account and **delete the old `B2_KEY_ID`** key (then update the Vercel env vars).
- **DO NOT:** delete the bucket (`B2_BUCKET_ID`) or its objects.

### 5. Cloudflare
- dash.cloudflare.com → **Manage Account → Members** → add new account, remove old.
- **My Profile → API Tokens** → **rotate/revoke** tokens — *especially* the one pasted into session `6c0d8df0`, which must be treated as exposed.
- **DO NOT:** delete the `pawjai.co.th` zone, DNS records, SSL settings, or the `media.pawjai.co.th` cache rule.

### 6. Resend
- resend.com → **Team / Members** → swap old account for new.
- **API Keys** → rotate `RESEND_API_KEY` if it was issued under the old account; update Vercel env var.
- **DO NOT:** remove the verified sending domain.

### 7. Figma
- The Figma MCP auth is an **OAuth connector on the old Claude account** — it disappears when you log out of that Claude account (step 9). Additionally: figma.com → Settings → **Security / Connected apps / Authorized integrations** → revoke any Claude/MCP authorization granted by the old account.
- On the new account, re-add/re-authorize the Figma MCP before doing design-to-code work. The old design source is the Figma Make file `PAWJAI-Currently` (`cfYww0U2M4xAkvHv3Gbvss`), but current UX/UI work should treat the live app plus these docs as source of truth.
- **DO NOT:** delete the `PAWJAI-Currently` Figma file.

### 8. Google / Gmail (incidental)
- A Gmail (Berkeley) browser session was used on this machine. If retiring the old machine, sign out of Google in that browser and review **myaccount.google.com → Security → Your devices / Third-party access**.

### 9. Claude on this machine
- Run **`claude logout`** in the terminal on this (old) machine. This drops the old Claude account session and, with it, the **Figma MCP** and **Supabase MCP** connector auth (both live on the account, not the repo).
- Optionally remove cached creds under `~/.claude/` on the old machine if decommissioning it.
- **DO NOT:** delete `~/.claude/projects/-Users-sudlabha-Desktop-paw/` if you want the session history preserved — though note it stays on the *old machine* unless copied.

---

## RESTORE CHECKLIST

The new-machine walkthrough is intentionally separate from this disconnect inventory. Use **[MIGRATION-RUNBOOK.md](MIGRATION-RUNBOOK.md)** as "Prompt B" if you are moving PAWJAI to a fresh machine and a different Anthropic/Claude account. It covers install/auth basics, GitHub, Vercel, Supabase env recreation, Figma MCP/Supabase MCP re-authorization, and the final "continue here" briefing.

If continuing in Codex instead, start at **[START-HERE.md](START-HERE.md)** — the Codex-targeted entry point (install/sign in to Codex → it auto-loads `AGENTS.md` → read this handoff → recreate `.env.local`). It's a **front-end / UX-UI** handoff; Figma is useful for reference but no longer central.

Because the live services are not owned by an AI account, simply switching agents does not affect production. Full service ownership transfer is only needed if you are also changing the actual GitHub/Vercel/Supabase/Cloudflare/etc. dashboard logins.

---

## Secrets / safety notes
- No `.env` contents, tokens, or keys are reproduced anywhere in `handoff/`. Only variable **names** are listed.
- `.gitignore` **does** ignore `.env`, `.env.local`, and `.env.*.local`. ⚠️ It does **not** ignore a plain `.env.production` / `.env.development` (only the `*.local` variants) — none exist today, but if you ever create one, add it to `.gitignore` first. `.env.example` is committed and contains only placeholders + the public Supabase URL (safe).
- ⚠️ A **Cloudflare API token** and a **Backblaze key context** appeared inside past session transcripts (`6c0d8df0`). Those transcripts are not part of this handoff, but the token should be rotated regardless (see Disconnect §5).
- Recheck 2026-06-18 found local `.env.example` and `.env.local`; only variable names were inspected. No values were copied into this handoff.
