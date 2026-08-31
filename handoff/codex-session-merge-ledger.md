# Codex Session Merge Ledger

Last updated: 2026-08-29 +07; actions applied 2026-07-20 and 2026-08-29

Purpose: reduce the visible Codex task clutter for the PAWJAI project without losing context. This ledger records which sidebar sessions should be treated as merged, what each source session contributed, and what should remain findable before any task is renamed or archived.

Important note: Codex can read, rename, message, pin, and archive tasks, but it cannot physically splice two task transcripts into one continuous transcript. The safe merge process is:

1. Read the source task summaries and recent turns.
2. Record the merged context here.
3. Choose one surviving bucket task or create/use a master cleanup task.
4. Only after review, rename/archive the redundant sidebar tasks.

Sidebar cleanup applied for the first requested batch:

- Renamed survivor `AGENT stress test` to `Production, SEO, and launch safety`.
- Renamed survivor `Connect to Supabase` to `Supabase access and MCP setup`.
- Renamed survivor `Build booking system` to `Booking, messaging, and dog intake ops`.
- Posted merge-summary notes into each survivor task.
- Archived redundant source tasks listed in the group tables below.

Additional sidebar cleanup applied for the second requested batch:

- Renamed survivor `UXUI frontend user` to `UXUI User Frontend design`.
- Posted merge-summary notes into `UXUI User Frontend design` and `Booking, messaging, and dog intake ops`.
- Archived redundant source tasks: `Apply adopter profiles migration`, `Fix appointment chat`, `Add Python bin to PATH`.

Additional sidebar cleanup applied for the third requested batch:

- Renamed survivor `Booking, messaging, and dog intake ops` to `BACKEND related`.
- Renamed survivor `Production, SEO, and launch safety` to `Production, audit, and and launch safety`.
- Posted a merge-summary note into `BACKEND related`.
- Archived redundant source task: `FILTER PAGE UXUI & BACKEND logic`.
- No application code, environment variables, production services, or external connections were changed during this cleanup.

Additional sidebar cleanup applied for the fourth requested batch:

- Renamed survivor `Migrate to new domain` to `Domain, DNS, and media infrastructure`.
- Posted a merge-summary note into `Domain, DNS, and media infrastructure`.
- Archived redundant source task: `Cloudflare CDN for Backblaze`.
- No application code, environment variables, production services, DNS records, Vercel settings, Supabase settings, Cloudflare settings, or Backblaze data were changed during this cleanup.

## Final Old-to-New Merge Map

| New Survivor Task | Merged From |
|---|---|
| `Production, audit, and and launch safety` | `AGENT stress test`, `Audit security gaps`, `Implement reel strategy` |
| `Supabase access and MCP setup` | `Connect to Supabase`, `Check Supabase MCP access` |
| `BACKEND related` | `Build booking system`, `Fix appointment chat backend`, `Dog import workflow`, `Fix appointment chat`, `Add Python bin to PATH`, `FILTER PAGE UXUI & BACKEND logic` |
| `UXUI User Frontend design` | `UXUI frontend user`, `Apply adopter profiles migration` |
| `Domain, DNS, and media infrastructure` | `Migrate to new domain`, `Cloudflare CDN for Backblaze` |

## Current Visible Survivor Buckets

| Survivor task name | Owns / should be used for | Merged source tasks already archived |
|---|---|---|
| `Map session responsibilities` | This cleanup/map task and the merge ledger. | None. |
| `Domain, DNS, and media infrastructure` | Domain purchase/recovery, Cloudflare DNS, Vercel domain setup, Backblaze B2 media delivery, Cloudflare CDN, media URL normalization, old-domain redirects/brand protection, and infrastructure verification. | `Cloudflare CDN for Backblaze`. |
| `Production, audit, and and launch safety` | Production checks, launch readiness, security hardening, audit work, SEO/domain-indexing strategy. | `Audit security gaps`, `Implement reel strategy`. |
| `Supabase access and MCP setup` | Supabase CLI/env/MCP connection history and migration-access setup. | `Check Supabase MCP access`. |
| `BACKEND related` | Booking system, appointment messaging, return inquiries, dog import/media tooling, B2/photo ops, adopter preference filtering, and backend dog-feed matching. | `Fix appointment chat backend`, `Dog import workflow`, `Fix appointment chat`, `Add Python bin to PATH`, `FILTER PAGE UXUI & BACKEND logic`. |
| `UXUI User Frontend design` | User-facing UX/UI, documents flow, upload UX, frontend design continuity, Figma-adjacent frontend work. | `Apply adopter profiles migration`. |
| `Review launch readiness` | Broader launch-readiness critique and pre-scale gaps. | None yet. |
| `Plan admin reorg` | Admin/shelter portal structure and role-specific operations. | None yet. |
| `MESSAGES` | Current/newer messaging feature thread. | None yet; cross-links to booking group. |
| `ADS page` | Admin advertising onboarding page, ad image upload/storage, and related admin ad UI. | None; keep unmerged. |
| `RESEND automation email` | Resend setup/testing and automated email delivery work. | None; keep unmerged. |
| `OAUTH n Emails` | Auth account creation, email/password login, saved preferences/wishlist, appointment-email context. | None; keep unmerged. |
| `Donation Backend Schema` | Donation schema, shelter payment fields, donation intent backend/admin setup. | None; keep unmerged. |
| `[Image]` | Image-only reference task; needs review before assigning or merging. | None; keep unmerged. |

## Keep Unmerged For Now

These are intentionally left as their own sidebar tasks after the current cleanup:

| Sidebar task | Why it stays separate |
|---|---|
| `ADS page` | Distinct admin ads feature. |
| `UXUI User Frontend design` | Active survivor for user-facing frontend design; renamed from `UXUI frontend user`, not merged into admin/auth/email buckets. |
| `RESEND automation email` | Email delivery setup can later merge with auth/email work, but stays separate for now. |
| `OAUTH n Emails` | Auth and account email flow remain separate until we intentionally consolidate email/auth. |
| `Donation Backend Schema` | Donation backend and shelter payment schema remain separate until donation migrations/payment flow are handled deliberately. |
| `[Image]` | Not enough context yet; leave untouched until reviewed. |

## Merge Group 1: Production / Audit / Launch Safety

This group combines the user's requested merges:

- `AGENT stress test` + `Audit security gaps`
- `Implement reel strategy` + `AGENT stress test`

Because `AGENT stress test` is part of both requested relationships, the clean merge target is one wider bucket:

Current surviving bucket name: `Production, audit, and and launch safety`

| Source sidebar session | Thread id | Preserve from this session | Completion / current status | Do not lose |
|---|---|---|---|---|
| `AGENT stress test` | `019f1cd5-32dd-7bf3-b21d-cc038ac43aca` | Production systems check, fresh-browser checks, expired `pawjai.co.th` diagnosis, domain/DNS outage reasoning, new-domain recovery prompt. | Mostly superseded by `Migrate to new domain`, but it contains the production incident reasoning. | Old domain expired 2026-07-10, WHOIS `HOLD`, expired Z.com nameservers, Vercel app itself was alive, outage was DNS/registrar not app/Supabase. |
| `Audit security gaps` | `019ebb64-b6e0-7280-b26e-3be803c9da7d` | Security/admin hardening pass, audit log, admin account setup docs, rate limiting, duplicate cleanup, `middleware.ts` to `proxy.ts`, Supabase advisor notes, change-log workbook. | Code-side/admin-security upgrade pass was marked done; some manual/security follow-ups remain. | Enable leaked password protection in Supabase dashboard, create real global/shelter admin accounts, reconcile migration history, RLS performance tuning, duplicate index cleanup, PostCSS advisory note. |
| `Implement reel strategy` | `019f31ab-de45-7602-9d1a-e99a4a310aee` | Domain/SEO structure from reel: public SEO routes, generated `robots.txt`, `sitemap.xml`, canonical metadata, noindex layouts for private/admin/auth/duplicate routes, domain indexing plan. | Implemented locally; verified with focused SEO tests, typecheck, build, and local robots/sitemap checks. | Public SEO surface is now `https://www.pawjaipet.com`; do not move auth to `app.pawjaipet.com` yet; future split is documented, not executed. |

Merged responsibility:

- Production recovery thinking and DNS incident context.
- Launch/security readiness and admin hardening context.
- SEO/domain-indexing prep and future public/app split plan.

Suggested cleanup action after review:

- Domain/media infrastructure work has now moved to `Domain, DNS, and media infrastructure`.
- Survivor task is now renamed to `Production, audit, and and launch safety`.
- Archived after summary preservation: `Audit security gaps`, `Implement reel strategy`.
- Keep this production/audit bucket separate from the domain/media infrastructure bucket because it owns readiness, security, SEO, and launch judgment rather than DNS/CDN mechanics.

## Merge Group 2: Supabase Access Setup

Requested merge:

- `Connect to Supabase` + `Check Supabase MCP access`

Suggested surviving bucket name: `Supabase access and MCP setup`

| Source sidebar session | Thread id | Preserve from this session | Completion / current status | Do not lose |
|---|---|---|---|---|
| `Connect to Supabase` | `019dac55-859f-78a3-9746-a404dd7d6611` | Initial Supabase CLI and Next.js SSR setup, `@supabase/ssr` helper wiring, env template, CLI scripts, later env-key mismatch fix, dog-import side context from early setup. | Supabase CLI/frontend setup was pushed; env resolver later accepted both anon and publishable key names. | Project ref `bdnyvcvkyepipdcygkvn`; `NEXT_PUBLIC_SUPABASE_ANON_KEY` vs `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` mismatch was fixed by centralized env resolution. |
| `Check Supabase MCP access` | `019dbcb4-b39d-7701-a2c1-14ec82cb4b97` | Supabase MCP connector setup, OAuth login flow, session-refresh limitation, adopter profile migration apply prompt. | MCP connector/login fixed, but some migration apply steps needed a fresh Codex session because tool namespace was not injected into the already-running session. | If MCP tools are missing in a task, start a fresh Codex session after OAuth; migration mentioned: `20260509191322_add_adopter_profiles_and_cover_photos.sql`. |

Merged responsibility:

- How this repo connects to Supabase through CLI, app env, and MCP.
- What to do when MCP auth is fine but the current task lacks the tool namespace.
- Historical env mismatch and its fix.

Suggested cleanup action after review:

- Survivor task is now renamed to `Supabase access and MCP setup`.
- Archived after summary preservation: `Check Supabase MCP access`.

## Merge Group 3: Backend Related

Requested merge:

- `Fix appointment chat backend` + `Build booking system` + `Dog import workflow`
- Later added: `FILTER PAGE UXUI & BACKEND logic`

Current surviving bucket name: `BACKEND related`

| Source sidebar session | Thread id | Preserve from this session | Completion / current status | Do not lose |
|---|---|---|---|---|
| `Build booking system` | `019e4dee-6a91-7912-8b45-4fabf0a5369b` | Core shelter visit booking system, QR/admin booking management direction, appointment messages table, shelter workspace tabs, user messages, admin visit buckets/outcomes. | Major booking/messaging workspace work was built and pushed across commits. | `appointment_messages` migration/table, shelter workspace tabs, post-visit outcome actions, adopted-dog cancellation behavior, migration application caveats. |
| `Fix appointment chat backend` | `019ea962-9dbb-7573-b02e-ebc4478025b6` | Backend attachment wiring for appointment chat, return inquiry persistence, return inquiry email helpers, attachment column fetch/rendering. | Committed and pushed as `0341b9e Add appointment chat attachment and return inquiry backend`. | Reused existing `dog-photos` bucket for appointment attachments; added `return_inquiries` migration; manual test checklist for attachment and duplicate return inquiry behavior. |
| `Dog import workflow` | `019dbca4-a921-7861-bc9a-79815b0d947f` | Dog onboarding/import operations from spreadsheet, The Voice Foundation default correction, OneDrive photo limitations, admin dog upload compression fix. | Import pipeline was built; live import depended on service role key. Later admin dog file upload compression was fixed and pushed. | 55-dog import dataset/script/runbook, 6 OneDrive photo links, The Voice Foundation shelter mapping, `SUPABASE_SERVICE_ROLE_KEY` requirement, large phone photos compressed before admin upload. |
| `Fix appointment chat` | `019e6640-8a8b-73e0-a71f-59b0a209adfd` | Production appointment chat repair after `public.appointment_messages` was missing from the PostgREST schema cache. Includes repo-side fallback/typing support and live DB repair. | Archived after summary was posted into the survivor task. Table, RLS, adopter policies, Data API select, temp insert/delete, admin/shelter sender role, and migration history were verified. | Existing migration `20260525154220_appointment_messages.sql` was applied to the linked Supabase project, followed by `NOTIFY pgrst, 'reload schema';`. |
| `Add Python bin to PATH` | `019dbc93-98d4-7951-8808-3603626261ea` | Local Python CLI PATH setup that later became dog media tooling: B2 CLI availability, dog photo linking, display-name corrections, and dog photo sort-index migration context. | Archived after summary was posted into the survivor task. | Python scripts installed to `/Users/sudlabha/Library/Python/3.12/bin`; app reads dog images from `dog_photos.public_url`; 8 `dog_photos` rows were inserted; indexes live in `20260423231945_add_dog_photo_sort_indexes.sql`. |
| `FILTER PAGE UXUI & BACKEND logic` | `019e664f-9f6f-74c0-8690-deca59ada24a` | Adopter preference filtering backend and UX flow: structured preference columns, server-side dog-feed filtering, one-page `/filter`, saved preference rehydration, and admin dog trait metadata for matching. | Archived after summary was posted into the survivor task. Work was previously committed and pushed through `ad87ae0`, `ebfc7c6`, and `49b6ca9`. | `adopter_preferences` columns, `utils/adopter-preference-model.ts`, `utils/dog-preference-filter.ts`, `app/actions/preferences.ts`, `app/page.tsx`, `/filter` saved-state behavior, GitHub active account correction to `6658065556PS`. |

Merged responsibility:

- Booking as the operational center of adoption visits.
- Appointment messaging backend and return inquiry signals.
- Dog intake/import and media upload reliability for shelter onboarding.
- Adopter preference persistence and backend dog-feed filtering.

Suggested cleanup action after review:

- Survivor task is now renamed to `BACKEND related`.
- Since newer `MESSAGES` and `Plan admin reorg` sessions also touch messaging/admin, cross-link this bucket to them rather than pretending it owns every later messaging UI change.
- Archived after summary preservation: `Fix appointment chat backend`, `Dog import workflow`, `Fix appointment chat`, `Add Python bin to PATH`, `FILTER PAGE UXUI & BACKEND logic`.

## Merge Group 4: UXUI User Frontend Design

Requested merge:

- `Apply adopter profiles migration` + `UXUI frontend user`

Suggested surviving bucket name: `UXUI User Frontend design`

| Source sidebar session | Thread id | Preserve from this session | Completion / current status | Do not lose |
|---|---|---|---|---|
| `UXUI frontend user` | `019ed9b8-49f1-7651-aa6e-4135ab3234cb` | User-facing frontend/UXUI design continuity, Figma-adjacent frontend work, and handoff-oriented user experience context. | Survivor task was renamed to `UXUI User Frontend design`. | This remains the clean place for user-side design decisions and frontend polish. |
| `Apply adopter profiles migration` | `019e0fdf-dccb-7fa3-8c6f-145d4ba27861` | Adopter profile migration prompt plus later documents flow, HEIC/HEIF upload UX, and production document-flow testing. | Archived after summary was posted into the survivor task. HEIC support was built, tested, committed, pushed, and promoted to production from commit `48e2e1d Support compressed HEIC document uploads`. | Migration path: `20260509191322_add_adopter_profiles_and_cover_photos.sql`; production `/documents` retest after `ERROR 1675175583@E352` succeeded; related open UX context: Treat donation modal renders inline on homepage and likely needs a `document.body` portal. |

Merged responsibility:

- User-facing UX/UI and frontend continuity.
- Documents/upload experience and HEIC/HEIF support.
- Adopter-profile context where it affects the frontend user journey.

Suggested cleanup action after review:

- Survivor task is now renamed to `UXUI User Frontend design`.
- Archived after summary preservation: `Apply adopter profiles migration`.

## Merge Group 5: Domain, DNS, and Media Infrastructure

Requested merge:

- `Migrate to new domain` + `Cloudflare CDN for Backblaze`

Current surviving bucket name: `Domain, DNS, and media infrastructure`

| Source sidebar session | Thread id | Preserve from this session | Completion / current status | Do not lose |
|---|---|---|---|---|
| `Migrate to new domain` | `019f7e60-e15b-7452-8860-f5e5725cec3f` | Production domain recovery after old `pawjai.co.th` expiry, new domain purchase flow, Cloudflare DNS, Vercel domain binding, Supabase Auth URL changes, Google OAuth/domain guidance, env/code URL update list, production verification path. | Survivor task renamed to `Domain, DNS, and media infrastructure` on 2026-08-29. | Old `pawjai.co.th` expired on 2026-07-10 and was a registrar/DNS outage, not an app/Supabase outage. Current canonical public URL is `https://www.pawjaipet.com`. Old domain can be recovered later for redirects/brand protection only. |
| `Cloudflare CDN for Backblaze` | `019e6647-de53-7423-b152-2446cd7acbf9` | Backblaze B2 bucket/CDN setup, media host checks, admin dog media CDN hardening, DB/media URL cleanup, ad image URL normalization, live bucket/file checks. | Archived on 2026-08-29 after summary preservation. Latest final state said CDN dog-media path was hardened and `npm run verify` passed. | Backblaze bucket `pawjai`; public media base `https://media.pawjaipet.com/file/pawjai`; expected B2 folders `ads/`, `pawjaidogs/`, `rescue-dog-thailand/`; app key worked but had broader permissions than ideal. |

Merged responsibility:

- Domain, DNS, Vercel production hostname, Cloudflare zone ownership, Backblaze media origin, Cloudflare CDN, media URL normalization, old-domain recovery/redirects, and infrastructure verification.
- Keep Supabase data/migrations, donation schema, admin/shelter UX, and auth/email automation in their own buckets unless the user explicitly merges them later.

Cleanup action applied:

- Survivor task is now renamed to `Domain, DNS, and media infrastructure`.
- Archived after summary preservation: `Cloudflare CDN for Backblaze`.

## Open Follow-Up After This Cleanup

- Decide whether `Domain, DNS, and media infrastructure` stays separate from `Production, audit, and and launch safety`. Recommended: yes, because the first owns infrastructure/domain/media mechanics while the second owns readiness, audit, and go/no-go judgment.
- Decide whether `MESSAGES` should later merge into Group 3, or remain a separate current feature thread. Recommended: merge later after this first batch.
- Decide whether `Plan admin reorg` should remain its own master thread. Recommended: yes, it is still the clearest umbrella for admin/shelter portal architecture.
- Decide whether `RESEND automation email` and `OAUTH n Emails` should merge into one auth/email bucket next.
- Decide whether `Donation Backend Schema` should merge with the Treat donation modal UX context or remain separate until the remote donation migrations are applied.
