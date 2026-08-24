# Supabase Launch Hardening Prompt — Advisor Warnings, Migration History, Private Attachments

You are working in the PAWJAI repo at `/Users/sudlabha/Desktop/paw`.

PAWJAI is live at `https://www.pawjaipet.com` and uses Supabase project `bdnyvcvkyepipdcygkvn`. Do **not** make broad app changes. This task is specifically for Supabase launch hardening.

## Current Findings To Verify First

Run read-only checks before changing anything:

```bash
npx supabase --version
npx supabase migration list
npx supabase db advisors --linked --output json
npx supabase db query --linked "select table_name from information_schema.tables where table_schema='public' and table_name in ('return_inquiries','appointment_messages','donation_intents','product_analytics_events','admin_audit_events','rate_limit_buckets') order by table_name"
npx supabase db query --linked "select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id"
```

Known state from the launch-readiness pass on 2026-08-24:

- `npm run verify` passes locally after test/audit cleanup.
- `npm run build` passes locally.
- Production health passes for `pawjaipet.com`, `www.pawjaipet.com`, `/admin`, and `media.pawjaipet.com`.
- `public.return_inquiries` was missing in production even though local migration `20260608223947_add_return_inquiries.sql` exists.
- Supabase migration history was not trustworthy: many local migrations were not recorded remotely.
- Supabase advisors reported security warnings:
  - public/anon can execute `public.is_appointment_message_adopter`
  - authenticated can execute `public.is_appointment_message_adopter`
  - leaked password protection disabled
- Advisor performance warnings remained for RLS initplan and multiple permissive policies.
- `appointment-message-attachments` bucket was public, with 200MB PDF/image/video attachments.

## Goals

1. Reconcile Supabase migration history without dropping or damaging production data.
2. Apply or repair the missing `return_inquiries` schema safely.
3. Make appointment message attachments private or otherwise access-controlled.
4. Resolve Supabase advisor **security** warnings first.
5. Leave performance-only advisor warnings for a separate pass unless low-risk.

## Constraints

- Do not run destructive SQL.
- Do not reset the remote database.
- Do not drop production tables, buckets, or user data.
- Do not expose service role keys or secrets.
- Use `supabase db query --linked` for inspection and small targeted SQL.
- If using migrations, prefer repairing/marking migration history only after verifying the schema already matches.
- After any DB/storage change, run a targeted verification query and `npm run verify`.

## Specific Checks And Fixes

### 1. `return_inquiries`

Verify whether the table exists. If missing, apply the SQL from:

```text
supabase/migrations/20260608223947_add_return_inquiries.sql
```

Then verify:

```sql
select table_name from information_schema.tables
where table_schema='public' and table_name='return_inquiries';
```

Also verify RLS is enabled and policies exist.

### 2. Migration History

Compare local migrations against `supabase_migrations.schema_migrations`. Many schema objects may already exist even when migration history is missing. Do not blindly `db push` until you know which migrations are already reflected in the schema.

Produce a table with:

- migration file
- schema objects it creates/changes
- remote object exists?
- migration history recorded?
- recommended action: apply, repair-as-applied, skip, or investigate

### 3. Private Appointment Message Attachments

Current bucket:

```text
appointment-message-attachments
```

It was public during the readiness pass. The desired launch posture is private/signed access, because users or shelters may attach sensitive PDFs/images/videos.

Recommended implementation:

- Set `storage.buckets.public = false` for `appointment-message-attachments`.
- Add a durable `attachment_storage_path` column to `public.appointment_messages`, or otherwise ensure the app can generate signed URLs on page load.
- Update app code so authorized adopters/shelters/admins receive short-lived signed URLs.
- Keep backward compatibility for old `attachment_url` rows if public URLs already exist.
- Verify both ends:
  - adopter uploads attachment in `/appointments/[id]?tab=messages`
  - shelter views it in `/shelter/[slug]?view=messages`
  - shelter uploads attachment
  - adopter views it
  - unauthorized user cannot fetch private storage object directly

### 4. SECURITY DEFINER Advisor Warning

Advisor warned that `public.is_appointment_message_adopter` is executable by public/anon and authenticated.

Investigate whether it must be callable directly from exposed roles. Prefer:

- keep function execution as narrow as possible
- revoke from `public`/`anon`
- ensure policies still work
- use a private schema if appropriate for future cleanup

Do not break appointment message RLS while fixing this.

### 5. Leaked Password Protection

This is likely a Supabase dashboard setting, not a repo migration. Enable it in Supabase Auth settings if available. Record the dashboard path and final state.

## Acceptance Criteria

- Production DB has `return_inquiries` table with RLS and expected policies.
- Migration history is documented and no longer ambiguous for launch-critical migrations.
- Appointment message attachments are private or have a clearly documented temporary risk exception.
- Advisor security warnings are resolved or documented with a reason and next action.
- `npm run verify` passes.
- `npm run health:production` passes.

## Final Report Format

Return:

1. What changed remotely.
2. What was only documented/recommended.
3. Exact verification commands and results.
4. Any remaining launch blockers.
