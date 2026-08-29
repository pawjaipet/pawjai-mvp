# Fix Appointment Message Attachments Prompt

You are working in the PAWJAI repo at `/Users/sudlabha/Desktop/paw`.

PAWJAI is live at `https://www.pawjaipet.com` and uses Supabase project `bdnyvcvkyepipdcygkvn`. This task is launch-critical because appointment message attachments can contain sensitive adopter/shelter files.

## Current State To Verify First

As of 2026-08-29, the app code and migration for private appointment message attachments exist on `main`, but production Supabase Storage still reports:

```text
appointment-message-attachments public: true
```

Relevant files:

```text
utils/appointment-message-attachments.ts
app/appointments/[id]/actions.ts
app/appointments/[id]/page.tsx
app/shelter/actions.ts
utils/message-threads.ts
components/appointments/AppointmentDetailClient.tsx
components/admin/AdminReorgDraftPanel.tsx
supabase/migrations/20260824100225_private_appointment_message_attachments.sql
```

Before changing anything, verify production state:

```bash
npm run typecheck
npx supabase --version
npx supabase migration list
npx supabase db query --linked "select column_name, data_type from information_schema.columns where table_schema='public' and table_name='appointment_messages' and column_name in ('attachment_url','attachment_storage_path','attachment_name','attachment_type') order by column_name"
npx supabase db query --linked "select id, public, file_size_limit, allowed_mime_types from storage.buckets where id='appointment-message-attachments'"
```

If `storage.buckets` cannot be queried through the CLI, use a read-only Supabase client with the service role key locally, but never print or commit secret values.

## Goal

Make appointment message attachments private/signed in production and improve the flow so adopters, shelters, and PawJai admins can still view authorized attachments.

## Required Behavior

- Adopter can upload an attachment in `/appointments/[id]`.
- Shelter can view adopter attachments in `/shelter/[slug]?view=messages`.
- Shelter can upload an attachment from the shelter workspace.
- Adopter can view shelter attachments in `/appointments/[id]`.
- PawJai/global admin can view attachments in admin message/booking views.
- Direct public storage URLs should not work for private appointment message attachments.
- Missing or expired signed URLs should degrade gracefully in the UI, with a clear link/error state rather than breaking the whole appointment page.

## Implementation Notes

- Prefer the existing helper in `utils/appointment-message-attachments.ts`.
- Keep `attachment_storage_path` as the source of truth for signed URL generation.
- Do not rely on public `attachment_url` for new messages once the bucket is private.
- Keep backward compatibility for legacy rows that only have `attachment_url`, but do not preserve public access as the desired future posture.
- Signed URLs should be short-lived and generated only on authenticated/authorized server reads.
- Verify shelter/admin/adopter authorization paths before and after flipping the bucket.

## Production Storage Change

The expected final posture is:

```sql
update storage.buckets
set public = false
where id = 'appointment-message-attachments';
```

Only run this after confirming the deployed app can generate signed URLs from `attachment_storage_path`.

## Tests And Verification

Run:

```bash
npm run typecheck
npm test
```

Then run a production smoke test with temporary data:

1. Create or use a controlled test appointment.
2. Upload one small image or PDF as the adopter.
3. Confirm the shelter can view/download it.
4. Upload one small image or PDF as the shelter.
5. Confirm the adopter can view/download it.
6. Confirm PawJai/global admin can view/download it.
7. Confirm a direct public storage URL for the object is denied.
8. Clean up temporary appointment messages/storage objects.

## Do Not Repeat

These have already been tested and passed separately:

- True global admin dog create/upload from `/admin/dogs/new`.
- Donation receipt upload/viewing both ways once shelter payment info exists.

## Final Report

Return:

1. Whether the bucket is now private in production.
2. What code or migration changes were made.
3. Exact smoke-test paths and roles tested.
4. Whether adopter, shelter, and admin attachment viewing all passed.
5. Any remaining privacy or launch blockers.
