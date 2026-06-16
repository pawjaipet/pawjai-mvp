# PAWJAI — Migration Runbook ("Prompt B")

**Goal:** move ownership/access of everything PAWJAI from the **OLD** Anthropic/Claude account (and the GitHub/Vercel/etc. identities tied to it) to a **NEW** account that will have Claude Max — **without losing the production app at pawjai.co.th.**

**Golden rule (you confirmed this):** for every service, do **ADD-NEW → VERIFY → REMOVE-OLD**. Never delete or remove the old identity from a service until the new one is proven to have full owner access. **Delete the old Anthropic account dead last**, only after Steps 1–9 are all green.

> ### What an AI agent cannot do for you
> Every step below is **dashboard + email** work that requires *you* to be logged in as the owner. No Claude/CLI agent can transfer GitHub org ownership, accept a Vercel invite, or click a Supabase "transfer project" confirmation on your behalf — those are gated by login + email confirmation by design. Use this as your checklist; do the clicks yourself.

---

## Step 0 — Pre-flight inventory (read first)

Everything to migrate, pulled from [HANDOFF.md](HANDOFF.md):

| # | Service | What's tied to it | Identifier |
|---|---------|-------------------|------------|
| 1 | **GitHub** | source repo | org `pawjaipet`, repo `pawjai-mvp` |
| 2 | **Vercel** | production hosting → `pawjai.co.th` | project `pawjai-mvp` `prj_hqDpCgHngxahehXoognmVuXw1OBk`, team `team_97uk7kuLt4prWHNQbfZV8y73` |
| 3 | **Supabase** | Postgres + Auth + Storage | project ref `bdnyvcvkyepipdcygkvn` |
| 4 | **Backblaze B2** | media object storage | bucket id in `.env.local` (`B2_BUCKET_ID`) |
| 5 | **Cloudflare** | CDN + DNS | zone `pawjai.co.th`, host `media.pawjai.co.th` |
| 6 | **Resend** | transactional email | verified sending domain |
| 7 | **Figma** | design source `PAWJAI-Currently` | OAuth connector on Claude account |
| 8 | **Domain registrar** | `pawjai.co.th` | wherever the .co.th was registered (verify) |
| 9 | **Claude / Anthropic** | this account + MCP connectors (Figma, Supabase) | the account you're deleting |

**Before anything:** confirm you can log in to **each** of the 9 above *right now* with the OLD identity. If you can't get into one, find the credential first — you can't transfer what you can't access.

---

## Step 1 — Stand up the NEW machine + NEW Claude account (Restore)

1. On the new machine: install Git, Node (match the version this repo uses), the GitHub CLI (`gh`), the Vercel CLI, the Supabase CLI, and Claude Code.
2. **Create / sign in to the new Anthropic account** (the one getting Claude Max) and run `claude` to authenticate it on the new machine.
3. Clone the repo (after Step 2 git access is sorted): `git clone https://github.com/pawjaipet/pawjai-mvp.git`
4. Recreate **`.env.local`** from each service's dashboard, using the variable **names** in [HANDOFF.md](HANDOFF.md) → Connections. (The old `.env.local` is git-ignored and stays on the old machine — copy it across securely, or better, regenerate keys per Step 12.)
5. `npm install`, then `npm run dev` and confirm the app boots locally against the (still old-owned) Supabase project before you change any ownership.
6. Re-add the **MCP connectors** on the new Claude account: Figma and Supabase (project `96b59bab-…`-style connector). These live on the *account*, not the repo — they must be re-authorized fresh on the new account.

✅ **Gate:** app runs locally on the new machine, new Claude account is the one driving it.

---

## Step 2 — GitHub

> ⚠️ The push from the old machine is currently **failing 403** because git here is authenticated as **`PROUD-AI`**, which has no access to `pawjaipet`. There is an unpushed local commit (`9323ef1`, the handoff) waiting.

1. **Add new account as owner:** github.com → `pawjaipet` org → **People** (or repo → **Settings → Collaborators and teams**) → invite the new GitHub account as **Owner**/Admin.
2. From the **new** account, **accept the email invite**.
3. On the new machine: `gh auth login` (or set a PAT) as the new account; verify `git push` works.
4. **Push the waiting commit:** `git push origin main` (sends `9323ef1`).
5. ✅ **Verify:** new account can push to and admin the repo.
6. **Only then remove old:** org → People → remove the old account; Settings → revoke its PATs, SSH keys, and **Authorized OAuth Apps** (Vercel/Supabase/Figma authorizations granted under the old identity).
- 🚫 Do NOT delete the repo, the org, branches, or PRs.

---

## Step 3 — Vercel

1. **Add new account to the team:** vercel.com → team `team_97uk7kuLt4prWHNQbfZV8y73` → **Settings → Members** → invite the new account as **Owner**.
2. New account accepts the invite.
3. **Reconnect Git integration** so deploys come from the *new* GitHub account (Project → Settings → Git).
4. Confirm **Environment Variables** are intact on the project (production). If any were rotated in Step 12, update them here and redeploy.
5. ✅ **Verify:** trigger a deploy from the new account; confirm `pawjai.co.th` serves it.
6. **Only then remove old:** Members → remove old account; revoke old personal access tokens; `vercel logout` on the old machine.
- 🚫 Do NOT delete the `pawjai-mvp` project, the `pawjai.co.th` domain binding, or production env vars.

---

## Step 4 — Supabase

1. **Org membership:** supabase.com → the org owning project `bdnyvcvkyepipdcygkvn` → **Team / Members** → invite the new account as **Owner/Admin**.
   - *If the project must move to a brand-new org owned by the new account,* use **Project Settings → General → Transfer project** instead — note this can require both orgs and may have plan implications; prefer simple membership transfer if possible.
2. New account accepts.
3. ✅ **Verify:** new account can open the project, see the database, run SQL, and view Auth users.
4. **Re-issue access tokens** under the new account (Account → Access Tokens) for the Supabase CLI + MCP; update local tooling.
5. **Only then remove old:** remove old account from the org; revoke its access tokens.
- 🚫 Do NOT pause/delete the project, drop tables, or wipe storage buckets.
- 📌 Carry over the two **open donation threads** from [HANDOFF.md](HANDOFF.md): the unapplied `donation_intents` migration + `shelters` payment columns still need to be applied to this remote DB.

---

## Step 5 — Backblaze B2

1. New account: create a Backblaze account (or get added if B2 supports team access on your plan).
2. **Transfer or re-grant bucket access.** B2 keys are account-scoped; the clean path is: from the account that owns the bucket, **create new Application Keys** for the bucket and hand them to the new setup.
3. Update `B2_KEY_ID` / `B2_APPLICATION_KEY` in `.env.local` **and** in Vercel env; redeploy; confirm media still loads via `media.pawjai.co.th`.
4. ✅ **Verify:** images/video load on the live site.
5. **Only then** delete the **old** application key.
- 🚫 Do NOT delete the bucket (`B2_BUCKET_ID`) or its objects. *If the bucket itself lives under the old Backblaze account and can't be shared, you must copy objects to a new bucket before retiring the old account — plan this carefully, it's the highest data-loss risk after Cloudflare/DNS.*

---

## Step 6 — Cloudflare

1. New account: dash.cloudflare.com → account → **Members** → invite new account as **Super Administrator**.
2. New account accepts.
3. ✅ **Verify:** new account can see the `pawjai.co.th` zone, DNS records, SSL settings, and the `media.pawjai.co.th` cache rule.
4. **Rotate API tokens** (My Profile → API Tokens) — **especially the token pasted into session `6c0d8df0`, which must be treated as exposed.**
5. **Only then remove old** member.
- 🚫 Do NOT delete the zone, DNS records, SSL mode, or cache rules — doing so takes the domain and CDN down.

---

## Step 7 — Resend

1. Add new account to the Resend team/workspace; new account accepts.
2. ✅ **Verify:** the **verified sending domain** is still verified and visible to the new account.
3. **Rotate `RESEND_API_KEY`** under the new account; update `.env.local` + Vercel env; send a test booking email.
4. **Only then remove** old member.
- 🚫 Do NOT remove the verified domain (re-verification means email outage).

---

## Step 8 — Figma + MCP connectors

1. Ensure the `PAWJAI-Currently` Figma file is owned by / shared with the new account (Figma file → Share).
2. On the **new** Claude account, re-authorize the **Figma MCP** and **Supabase MCP** connectors (done in Step 1.6).
3. **Only then** revoke the old account's Figma authorization (figma.com → Settings → Connected apps / authorized integrations) — this also happens implicitly when you delete the old Claude account.
- 🚫 Do NOT delete the Figma file.

---

## Step 9 — Domain registrar (pawjai.co.th)

1. Find where `pawjai.co.th` is **registered** (the registrar, separate from Cloudflare DNS). `.co.th` domains often have registrar-specific transfer rules and may require documentation.
2. Confirm the new identity can manage the domain (or that it stays under an account you control independently of the old Anthropic account).
- 🚫 Do NOT let the domain lapse or get locked to the old identity.

---

## Step 10 — Final verification gate (ALL must be ✅ before Step 11)

- [ ] New account can push to GitHub `pawjaipet/pawjai-mvp`; commit `9323ef1` pushed.
- [ ] New account can deploy on Vercel; `pawjai.co.th` serves a fresh deploy.
- [ ] New account is owner/admin on Supabase project `bdnyvcvkyepipdcygkvn`.
- [ ] Media loads via `media.pawjai.co.th` with new Backblaze keys.
- [ ] New account is admin on Cloudflare zone `pawjai.co.th`.
- [ ] Resend domain verified; test email sends.
- [ ] Figma file accessible; MCP connectors live on new Claude account.
- [ ] Domain registrar access confirmed.
- [ ] All old keys/tokens rotated (Step 12).

---

## Step 11 — Delete the OLD Anthropic account (last)

Only after **every** box in Step 10 is checked:
1. `claude logout` on the old machine.
2. Confirm the new Claude Max account drives the project end-to-end (run a real task).
3. Then delete the old Anthropic account.
- Deleting the Anthropic account automatically severs its MCP connector auth (Figma, Supabase) — which is fine because they're re-established on the new account.

---

## Step 12 — Secrets to rotate (treat old ones as burned)

Because the old account/machine is being retired, rotate rather than just copy:

- ⚠️ **Cloudflare API token** — exposed in a past transcript; rotate now regardless.
- `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD` — regenerate under new ownership.
- `B2_KEY_ID` / `B2_APPLICATION_KEY` — new application keys.
- `RESEND_API_KEY` — new key.
- `VERCEL_OIDC_TOKEN` — re-issued automatically when the project re-links under the new account.
- Anon/publishable Supabase keys are public-safe but will change if the project is transferred to a new org.

After rotating, update **both** `.env.local` (new machine) **and** the **Vercel production env vars**, then redeploy and smoke-test.

---

## Current blocking item right now

The handoff commit `9323ef1` cannot be pushed from this machine — git is authenticated as `PROUD-AI` (no access to `pawjaipet`). Resolve via **Step 2.3** (`gh auth login` as an account with access) and then `git push origin main`.
