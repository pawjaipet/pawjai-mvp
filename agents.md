# PAWJAI — Agent Guide

PAWJAI is a Thai dog **adoption & matching** platform — live in production at **pawjai.co.th**. This file is the context an AI coding agent (Codex) should load first. The day-to-day work here is **front-end / UX-UI**; the backend is built and stable.

> **Deeper context:** see [`handoff/HANDOFF.md`](handoff/HANDOFF.md) for the full project history, the session-by-session log in [`handoff/sessions/`](handoff/sessions/), and current open threads. New here? Start with [`handoff/START-HERE.md`](handoff/START-HERE.md).

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | **Next.js 16** (App Router, Server Actions, Turbopack) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS 3.4 + shadcn/ui (Radix primitives), `lucide-react` icons |
| Backend | **Supabase** — Postgres, Auth (`@supabase/ssr`), Storage |
| Media | **Backblaze B2** behind a **Cloudflare** CDN (`media.pawjai.co.th`) |
| Email | **Resend** (`lib/resend.ts`) |
| Donations | PromptPay QR via `promptpay-qr` + `qrcode` |
| Hosting | **Vercel** — auto-deploys on push to `main` |

---

## Repo layout

```
app/                     Next.js App Router (routes below)
components/              UI components, grouped by domain:
  appointments/ auth/ documents/ dogs/ donations/ profile/ settings/
  (plus shared top-level components: SwipeFeed, SwipeDogCard, BottomNavBar, PageHeader, …)
utils/                   Domain logic & data models (booking, donations, adopter,
                         dog-media, swipe-feed-model, personality-tags, backblaze, …)
  utils/supabase/        Supabase clients: server.ts, client.ts, admin.ts, config.ts
lib/                     resend.ts + lib/supabase/ (client/server/middleware helpers)
supabase/migrations/     SQL migrations
types/                   database.ts (generated DB types)
scripts/                 one-off node scripts (dog import, B2 photo linking, email test)
public/                  static assets (incl. pawjai-logo.png)
docs/                    setup guides & architecture notes
handoff/                 project handoff + session history (read this for context)
```

### Main routes (`app/`)
Public/adopter: `swipe` (home feed), `dogs/[id]`, `dogs/[id]/donate`, `filter`, `profile`,
`appointments` + `appointments/[id]`, `schedule/[dogId]`, `documents` (verification),
`about`, `more`, `settings` + `settings/subscription`, `donations`, `auth/*`, `onboarding/*`.
Admin: `admin/dogs`, `admin/bookings`, `admin/ads`, `admin/listings`, `admin/accounts`,
`admin/audit`, `admin/pawjaiprofile`, `admin/login`.

---

## Workflow (edit → live)

1. Make the change (front-end work is the norm — components in `components/`, routes in `app/`).
2. Verify locally: `npm run dev` (Turbopack). Before committing, run **`npm run verify`** (typecheck + tests + lint + audit) — or at minimum `npm run typecheck`.
3. Commit, then **push to `main`** → Vercel auto-deploys to pawjai.co.th in ~1 min.
4. Reuse existing components and `utils/` models before writing new ones.

**Useful scripts:** `npm run dev`, `npm run build`, `npm run typecheck`, `npm test`, `npm run verify`, `npm run lint`, `npm run supabase:link` (links the CLI to project `bdnyvcvkyepipdcygkvn`), `npm run email:test`.

---

## Backend notes (stable — touch sparingly)

- Supabase project ref: **`bdnyvcvkyepipdcygkvn`** (region us-west-1). Client code lives in `utils/supabase/` (use `server.ts` in Server Components/Actions, `client.ts` in Client Components, `admin.ts` for service-role tasks).
- DB schema changes go through `supabase/migrations/` and the **Supabase CLI** (`npm run supabase:link` then `supabase db push`), or the Supabase dashboard. After a schema change, regenerate `types/database.ts`.
- Storage buckets: public — `dog-photos`, `profile-pictures`, `assets`; private — `identity-documents`, `application-documents`, `adopter-documents`. Large media is served via Backblaze B2 + Cloudflare; see `utils/backblaze.ts`.
- Env vars live in `.env.local` (git-ignored). Names are documented in [`handoff/HANDOFF.md`](handoff/HANDOFF.md) → Connections. **Never commit secrets.**

---

## Open threads (see handoff for detail)

1. **Swipe-card "Treat" donation modal renders inline instead of as an overlay** — a `transform` ancestor breaks `position: fixed`; fix is to portal the modal to `document.body` via `createPortal`. Not yet committed.
2. **Donation migrations not yet applied to the remote DB** — `donation_intents` table + `shelters` payment columns exist only as local migration files.
3. **Admin About-page editor bug** — `app/admin/pawjaiprofile/actions.ts` exports a plain object from a `"use server"` file (Next.js 16 forbids it). Move the constant out or inline it.

---

## Design

Figma was the original design source but is **no longer central** — treat the live app and these docs as the source of truth for UX decisions. (The legacy design file key is `cfYww0U2M4xAkvHv3Gbvss` if ever needed; no Figma connector is required to do the work.)
