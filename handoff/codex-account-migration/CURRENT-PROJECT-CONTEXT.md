# Current PAWJAI Project Context

## Product

PAWJAI is a Thai dog adoption and matching platform. It is live in production at `https://www.pawjaipet.com`. Day-to-day work is primarily adopter-facing frontend and UX/UI; the backend is considered stable, so backend changes require explicit verification.

## Stack and deployment

| Area | Current system |
|---|---|
| Framework | Next.js 16 App Router, Server Actions, Turbopack |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS 3.4, shadcn/ui, Radix, lucide-react |
| Database/auth/storage | Supabase Postgres, Auth, Storage; project ref `bdnyvcvkyepipdcygkvn` |
| Media | Backblaze B2 behind Cloudflare at `media.pawjaipet.com` |
| Email | Resend via `lib/resend.ts` |
| Hosting | Vercel; push to `main` is the normal deployment path |
| Donations | PromptPay QR via `promptpay-qr` and `qrcode` |

## Main product surfaces

Public/adopter routes include swipe discovery, dog profiles, filtering, profiles, appointments, scheduling, documents, about, donations, auth, onboarding, settings, and subscriptions. Admin routes include dogs, bookings, ads, listings, accounts, audit, PAWJAI profile, and login.

## Non-negotiable product boundaries

- Keep the public dog profile separate from the post-adoption Adopted Pet Passport.
- Do not build a vet portal or assume vets log in.
- Preserve shelter tenant isolation and global-admin cross-shelter access.
- Never commit secrets; `.env.local` is git-ignored.
- Verify remote Supabase state before claiming a migration is deployed.

## Verification workflow

Use `npm run typecheck` for a fast check and `npm run verify` before a production commit when feasible. Use `npm run build` when build behavior matters. Preserve unrelated dirty worktree changes.

## Source-of-truth files

- `AGENTS.md`: current repository instructions.
- `handoff/HANDOFF.md`: broad history, connections, and architecture.
- `handoff/START-HERE.md`: older general handoff.
- `handoff/sessions/`: dated implementation evidence.
- `handoff/prompts/`: fresh-task continuation prompts.
- `handoff/brand/ci/README.md`: marketing identity baseline.
- `handoff/context/FINANCIAL-MODEL-2026-09-03.md`: projections only, not current actuals.
