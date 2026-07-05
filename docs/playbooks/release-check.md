# PAWJAI Release Check Playbook

Use this before deploys, demos, or production data changes.

## Required

- `git status --short` reviewed.
- `npm run verify` run and result captured.
- `.env.local` not committed.
- Dependency audit reviewed.
- Known duplicate files reviewed or explicitly left alone.

## App Smoke Tests

- Public browsing: `/`, `/dogs`, `/dogs/[id]`, `/swipe`
- Auth: `/auth`, callback/confirm routes
- Verification: `/documents`
- Booking: `/schedule/[dogId]`, `/appointments`, `/appointments/[id]`
- Messaging: `/messages`, `/messages/[id]`
- Admin: `/admin`, `/admin/bookings`, `/admin/ads`

## Data And Security

- New migrations applied in order.
- Database types regenerated after schema changes.
- RLS and storage policies reviewed for sensitive data.
- Service-role actions checked for explicit authorization.
- Public uploads and private documents checked for limits and access control.

## Rollback Notes

- Note migration IDs.
- Note changed environment variables.
- Note external service changes in Supabase, Backblaze, Resend, or Vercel.
