# PAWJAI Agent Map

Use this file as the first stop before making code changes. It keeps agents from rereading the whole repo and names the parts of the system that deserve extra care.

## Product Shape

PAWJAI is a Thai dog adoption and matching app built with Next.js App Router, React, TypeScript, Tailwind, shadcn-style components, Supabase Auth/Postgres/Storage, Backblaze B2 media, and Resend email.

Core user journeys:

- Browse dogs: `/`, `/home`, `/dogs`, `/dogs/[id]`, `/swipe`, `/filter`
- Save and match: wishlist actions, adopter preferences, swipe feed, profile dashboard
- Verify adopter: `/documents`, `app/documents/actions.ts`, private document storage
- Book visits: `/schedule`, `/schedule/[dogId]`, `/appointments`, `/appointments/[id]`
- Message shelters: `/messages`, `/messages/[id]`, appointment-scoped messages
- Donate: `/dogs/[id]/donate`, `/donations/actions.ts`
- Admin/shelter work: `/admin`, `/admin/listings`, `/admin/bookings`, `/admin/ads`, `/admin/pawjaiprofile`

## High-Value Files

- App shell: `app/layout.tsx`, `app/globals.css`, `proxy.ts`
- Supabase clients: `utils/supabase/client.ts`, `utils/supabase/server.ts`, `utils/supabase/admin.ts`, `utils/supabase/config.ts`
- Legacy/alternate Supabase clients: `lib/supabase/*`; check before extending because the app also uses `utils/supabase/*`
- Admin gate: `utils/admin-auth.ts`
- Database types: `types/database.ts`
- Migrations: `supabase/migrations/*.sql`
- Core models: `utils/account-model.ts`, `utils/adopter.ts`, `utils/appointments-model.ts`, `utils/booking.ts`, `utils/booking-email.ts`, `utils/adopter-documents.ts`, `utils/dog-preference-filter.ts`
- External services: `utils/backblaze.ts`, `lib/resend.ts`

## Supabase Data Model

Primary identity and roles:

- `profiles`: one row per Supabase Auth user; includes `role`
- `adopters`: adopter-facing profile data linked to `profiles`
- `shelters`: shelter records
- `shelter_users`: shelter staff membership and permissions

Dog and adoption flow:

- `dogs`, `dog_photos`, `dog_traits`
- `wishlists`
- `questionnaire_templates`, `questionnaire_questions`
- `applications`, `application_details`, `application_answers`, `application_documents`

Verification and matching:

- `adopter_profiles`
- `adopter_documents`
- `adopter_preferences`

Appointments and messages:

- `appointments`
- `appointment_messages`
- `return_inquiries`
- `shelter_regular_hours`, `shelter_availability`

Content and commerce:

- `site_settings`, `partner_shelters`, `pawjai_profile`
- `donation_intents`
- `ads`

## Auth And Authorization

- Browser and user-scoped server work should use `utils/supabase/client.ts` or `utils/supabase/server.ts`.
- Service-role work goes through `utils/supabase/admin.ts`. Treat this as privileged. Every service-role mutation must have an explicit user, owner, shelter member, or admin-gate check before mutation.
- Current admin gate is passphrase-cookie based in `utils/admin-auth.ts`; treat it as a temporary bootstrap mechanism, not strong production auth.
- RLS is enabled across core public tables in `20260420194650_002_rls_policies.sql` and later migrations. Do not bypass it casually with service role.
- Never use user-editable metadata for authorization. Store authorization state in DB rows or app metadata.

## Storage And Media

Supabase Storage buckets are configured in migrations:

- `profile-pictures`: public profile pictures
- `dog-photos`: public dog media
- `identity-documents`: private adopter identity documents
- `application-documents`: private application documents
- `adopter-documents`: private verification documents
- `shelter-assets`: public shelter logos/assets

Backblaze B2 is used for some public media via `utils/backblaze.ts`. Keep B2 keys server-only.

## Environment Variables

Public client variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only variables:

- `SUPABASE_SERVICE_ROLE_KEY`
- `PAWJAI_ADMIN_PASSPHRASE`
- `PAWJAI_BOOKING_TOKEN_SECRET`
- `RESEND_API_KEY`
- `PAWJAI_EMAIL_FROM`
- `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_ID`
- `PAWJAI_B2_PUBLIC_BASE_URL`

Do not move server-only values into `NEXT_PUBLIC_*`.

## Do Not Touch Casually

- `.env.local`
- `supabase/migrations/*.sql`
- `types/database.ts`
- `utils/supabase/admin.ts`
- `utils/admin-auth.ts`
- `utils/booking.ts`
- document upload and private-storage logic
- duplicate files with names like `page 2.tsx`, `page 3.tsx`, `state 2.ts`, or `*.test 2.mjs` until compared and intentionally resolved

## Known Friction

- The repo currently has duplicate generated/conflict files with spaces and numeric suffixes. Compare before deleting.
- There are two Supabase helper areas: `lib/supabase/*` and `utils/supabase/*`. Prefer the current app pattern, then consolidate later.
- Several server actions use the service-role client for user flows. Future security work should narrow this.
- `next.config.ts` allows 100 MB Server Action uploads. Revisit per-route upload strategy before production scale.
