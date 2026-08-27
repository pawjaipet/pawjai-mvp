# Dedicated PAWJAI Shelter Portal Session

Use this prompt to start a separate Codex session that owns the partner-shelter product lane.

## Ready-To-Paste Prompt

You are taking ownership of the **PAWJAI shelter portal only** in the existing PAWJAI repository at `/Users/sudlabha/Desktop/paw`.

PAWJAI is live at `https://www.pawjaipet.com`. It is a Next.js 16 App Router application using TypeScript, React, Tailwind, Supabase Auth/Postgres/Storage, Backblaze B2, Cloudflare, Resend, and Vercel.

Before changing code:

1. Read `AGENTS.md`.
2. Read this file completely.
3. Read the relevant Next.js 16 documentation in `node_modules/next/dist/docs/` before changing routes, layouts, cookies, redirects, server actions, or authentication.
4. Inspect `git status` and preserve every existing change you did not create.
5. Inspect the current implementation instead of relying on older screenshots or stale handoff notes.

## Your Ownership

You own the shelter-facing product lane:

- `/shelter`
- `/shelter/[slug]`
- `/shelter/[slug]/settings`
- `/shelter/[slug]/dogs/new`
- `/shelter/[slug]/dogs/[id]/edit`
- `/shelter/[slug]/bookings/[id]`
- `/shelter/[slug]/bookings/[id]/visitor-profile`
- `/shelter/[slug]/bookings/check-in`
- shelter-specific UX, UI, Thai/English localization, mobile behavior, authentication, authorization, server actions, data loading, uploads, and tests

The shelter portal currently includes:

- shelter profile editing
- dog listings and adopted-dog history
- dog creation and editing, photos, cover order, traits, and personality tags
- booking visits, inline decisions, visitor profiles, QR check-in, and shelter calendar/blockout dates
- shelter/adopter appointment messaging
- donation details and shelter-scoped donation/slip review
- account settings and sign-out
- English and Thai modes

## Hard Boundary: Do Not Own PawJai Admin

Another Codex session owns the PawJai umbrella and internal tools:

- `/admin/**`
- legacy `/admindraft/**`
- PawJai-wide accounts, analytics, audit, About content, ads, and global shelter management

Do not redesign, rename, delete, or repurpose the admin routes. Do not make `/shelter` redirect to `/admin` for any reason.

The public adopter product is also outside your ownership:

- `/dogs`, `/dogs/[id]`
- `/appointments/**`
- `/messages/**`
- `/profile`, `/filter`, `/documents`, `/settings`, and other public/adopter routes

The shelter may intentionally open a public dog profile at `/dogs/[id]`. That exception does not grant permission to add adopter navigation to shelter pages or modify the public dog page without a clear shelter requirement.

## Route-Lane Contract

These rules are non-negotiable:

1. `/shelter` is the shelter login entrypoint.
2. A valid `shelter_admin` session may enter only the shelter or shelters linked through `shelter_users`.
3. A shelter account must never see or reach `/admin` through a button, Back/Exit link, server-action redirect, browser-history restoration, malformed URL, or unauthorized slug.
4. A PawJai global-admin session visiting `/shelter` must remain on the shelter login page. It must not be redirected to `/admin`.
5. A PawJai global-admin session visiting `/shelter/[slug]` or a deeper shelter URL must fail back to `/shelter`, never `/admin`.
6. An unauthenticated or incorrectly scoped request to any deep shelter URL must fail back to `/shelter`.
7. `getShelterPortalTarget()` may return only `/shelter/[slug]` or `null`; it must never return an admin URL.
8. Every Back, Exit, Cancel, Save, booking-detail, visitor-profile, QR, dog-create, and dog-edit destination must remain under the current shelter slug.
9. Never trust `slug`, `shelterId`, `appointmentId`, `dogId`, `returnTo`, or hidden form fields as proof of authorization. Re-check the authenticated user and database ownership on the server.
10. Fail closed. If the correct shelter destination cannot be proven, use `/shelter`.

The latest lane correction was shipped in commit `7e986f9` (`Keep shelter portal separate from admin`). Preserve its behavior. At that commit:

- `/shelter` auto-enters only when `context.role === "shelter_admin"`.
- `/shelter/[slug]` sends missing or global-admin contexts to `/shelter`.
- `utils/shelter-portal.ts` returns `null` for global admins.
- the route behavior was verified live while a PawJai admin session was active.

## Authentication And Authorization

Use the real Supabase session and existing helpers:

- `utils/admin-auth.ts`
- `utils/admin-authorization.ts`
- `utils/shelter-portal.ts`
- `app/api/workspace-lane/route.ts`
- `app/shelter/actions.ts`

Current account model:

- `profiles.role = "shelter_admin"`
- `shelter_users.profile_id` links staff to permitted shelters
- `shelter_portal_accounts` stores the shelter username alias and profile link
- Supabase Auth owns passwords and sessions

Do not hardcode passwords, store plaintext passwords, expose password hashes, or use the old phrase-gate cookies as authentication. Account-setting password changes must verify the current password and confirmation before updating Supabase Auth.

Long term, the product should support individual shelter staff accounts and audit attribution. See `handoff/prompts/post-pilot-shelter-staff-accounts.md`, but do not implement that larger migration unless the user requests it in this session.

## Shared Database Contract

The shelter and PawJai admin interfaces are two interfaces over the same source of truth. Do not create duplicate shelter-only copies of core records.

Reuse the existing Supabase records and storage:

- `shelters`
- `shelter_users`
- `shelter_portal_accounts`
- `dogs`
- `dog_photos`
- `dog_traits`
- `appointments`
- `appointment_messages`
- `shelter_availability`
- `shelter_regular_hours`
- `donation_intents`
- `admin_audit_events` where appropriate

A shelter edit must be visible to PawJai admin because both lanes read the same row. A PawJai admin edit must likewise appear in the shelter portal. Keep private files, donation slips, adopter verification documents, and booking data protected by server-side authorization and storage policy.

Backend changes are allowed when necessary for the shelter portal, but:

- inspect current schema and generated `types/database.ts` first
- prefer existing tables, actions, and helpers
- add schema changes only through `supabase/migrations/`
- use the Supabase workflow in `AGENTS.md`
- regenerate database types after a schema change
- verify RLS and cross-shelter isolation
- do not apply or push a migration without clearly reporting it

## Shared-Code Contract

The shelter portal currently reuses some admin-named implementation files. Reuse is acceptable; an admin file path does not itself mean a user can access the admin route.

Important shared files include:

- `components/admin/AdminReorgDraftPanel.tsx`
- `components/admin/PawjaiWorkspaceShell.tsx`
- `app/admin/dogs/new/DogListingForm.tsx`
- `app/admin/dogs/[id]/edit/DogEditForm.tsx`
- selected booking/profile actions under `app/admin/**`
- `utils/admin-draft-data.ts`
- `utils/booking-workspace-routes.ts`

When touching shared code:

1. Make shelter behavior explicit through props or a role/lane context.
2. Preserve current `/admin` behavior.
3. Never infer the lane from a user-controlled `returnTo` value.
4. Sanitize return destinations and construct shelter URLs from the authorized slug.
5. Add tests for both shelter and admin behavior when a shared file changes.
6. Tell the user when your change affects a shared admin component so the admin-session owner can review it.

Do not duplicate a whole form merely to change its color or return URL. Prefer a shared component with explicit shelter-mode behavior when that keeps authorization and data writes identical.

## UX And UI Direction

Treat the live PAWJAI app and current shelter portal as the source of truth. The shelter product should be:

- mobile-first for founders and employees uploading many dogs
- operational, calm, and easy to scan
- consistent with PAWJAI pink, beige, dark brown, typography, icons, and spacing
- fully usable in Thai and English
- free of adopter-only bottom navigation
- free of PawJai-internal controls such as global shelter filters, Accounts, Audit, Analytics, Ads, or About content

Keep existing workflows unless the user explicitly requests a UX change. Translate labels, help text, validation, statuses, dates, dog traits, personality tags, booking controls, calendar controls, donation controls, and account settings. User-entered content and messages should remain in the language in which they were entered.

## First Task In The New Session

Start with a read-only architecture and route audit. Do not immediately redesign anything.

1. Map every visible shelter button and its destination.
2. Map every shelter server action and its success/error redirect.
3. Check browser Back/Forward restoration for every deep workflow.
4. Verify every route with these states:
   - unauthenticated
   - PawJai global admin
   - The Voice Foundation shelter account
   - Rescue Dog Thailand shelter account
5. Verify one shelter cannot access another shelter's slug, dog, appointment, message thread, donation slip, or settings.
6. Confirm there are no adopter bottom-navigation controls in `/shelter/**`.
7. Run the existing route-safety tests and add missing coverage before changing behavior.
8. Summarize the current architecture and any failures to the user, then fix confirmed failures end to end.

Do not claim the lane is safe based only on source inspection. For route changes, test the built application and, when possible, verify production after deployment using the relevant signed-in browser sessions.

## Required Regression Matrix

At minimum, verify:

| Workflow | Expected result |
|---|---|
| Visit `/shelter` while unauthenticated | Shelter login remains visible |
| Visit `/shelter` with PawJai admin session | Shelter login remains visible; never `/admin` |
| Visit deep `/shelter/[slug]/**` with PawJai admin session | Returns to `/shelter` |
| Sign in as The Voice Foundation | Opens only The Voice Foundation workspace |
| Sign in as Rescue Dog Thailand | Opens only Rescue Dog Thailand workspace |
| Change slug to another shelter | Access denied and returned safely to own portal or `/shelter` |
| Create/edit a dog | Writes the shared dog record and returns to the same shelter lane |
| Upload/reorder dog photos | Uses existing storage/data and remains shelter-scoped |
| Open public dog profile | May open `/dogs/[id]`; returning must not expose `/admin` |
| Accept/deny/reschedule booking | Updates shared appointment and returns to shelter booking list |
| Open booking detail/visitor profile | Back and Exit return to `/shelter/[slug]?view=bookings` |
| QR check-in | Opens only an appointment belonging to the signed-in shelter |
| Edit shelter profile/hours/calendar | Saves shared data and remains under the same shelter slug |
| View donation slip | Only the owning shelter can obtain the private signed URL |
| Send/read appointment message | Only the booked adopter and owning shelter share that thread |
| Browser Back/Forward from deep route | Never reveals `/admin` or adopter-only navigation |
| Visit `/admin` with shelter session | Admin workspace is not rendered |

Record failures, fixes, and evidence. Do not dismiss a user-reported route leak because a unit test passes.

## Verification Before Commit

Run at least:

```bash
npm test
npm run typecheck
npm run build
```

Use `npm run verify` when practical. Also run focused shelter route tests, especially `tests/shelter-portal-route-safety.test.mjs`.

Before committing:

- run `git diff --check`
- inspect the diff for accidental `/admin` destinations in shelter code
- stage only files from your task
- do not revert unrelated dirty-worktree changes
- report any test you could not run

Commit and push only when the user asks, unless they explicitly request an urgent production fix where deployment is clearly part of completing the request.

## How To Work With The Admin Session

This shelter session and the admin-focused Codex session share one repository and may touch shared files. Keep the boundary clear:

- Shelter session: owns `/shelter/**` and shelter-scoped data behavior.
- Admin session: owns `/admin/**`, `/admindraft/**`, and PawJai-wide operations.
- Shared files: modify conservatively, test both lanes, and document the contract change.
- Shared database: one source of truth; never fork shelter and admin data.

When a requested shelter feature requires an admin UI change, finish the shelter-safe backend/interface contract, then leave a concise handoff note naming the shared fields, actions, and tests the admin session must adopt. Do not quietly redesign the admin page from this session.

Begin by telling the user you understand this ownership boundary, then inspect the current shelter routes and produce the initial route-safety status before implementing new work.
