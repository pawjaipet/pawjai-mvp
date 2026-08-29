# Run Supabase Advisor And Security Cleanup Prompt

You are working in the PAWJAI repo at `/Users/sudlabha/Desktop/paw`.

Use this prompt to run a focused Supabase launch-hardening session. Start from:

```text
handoff/prompts/supabase-advisor-warnings-remain.md
```

PAWJAI is live at `https://www.pawjaipet.com` and uses Supabase project `bdnyvcvkyepipdcygkvn`. Do not make broad app changes. This session is for Supabase security/advisor cleanup, migration-history clarity, and production verification.

## Current Known State

As of 2026-08-29:

- Production app smoke tests passed for public dog profile, shelter-created dog upload, true global admin dog create/upload, donation receipt upload/viewing, and swipe/feed load.
- `appointment-message-attachments` still needs production privacy verification/fix. Use `handoff/prompts/fix-private-appointment-message-attachments.md` for that focused work if it is not already done.
- There may still be Supabase advisor warnings for security and performance.
- Historical handoff notes mention migration-history ambiguity. Verify current remote state before applying or repairing anything.

## First Commands

Run read-only discovery first:

```bash
npx supabase --version
npx supabase migration list
npx supabase db advisors --linked --output json
npx supabase db query --linked "select version, name, inserted_at from supabase_migrations.schema_migrations order by version"
npx supabase db query --linked "select table_name from information_schema.tables where table_schema='public' and table_name in ('return_inquiries','appointment_messages','donation_intents','product_analytics_events','admin_audit_events','rate_limit_buckets') order by table_name"
npx supabase db query --linked "select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id"
```

If CLI access to `storage.buckets` is unavailable, use the Supabase Storage API with the local service role key. Never print or commit secret values.

## Priority Order

1. Resolve advisor **security** warnings.
2. Confirm `appointment-message-attachments` is private/signed or hand off to the focused attachment prompt.
3. Confirm launch-critical tables exist with RLS enabled and expected policies.
4. Reconcile/describe migration history without destructive resets.
5. Address low-risk performance warnings only if the fix is obvious and narrowly scoped.

## Constraints

- Do not reset the remote database.
- Do not drop production data, buckets, users, or auth records.
- Do not run destructive SQL.
- Do not expose secrets.
- Prefer inspection and targeted SQL over broad `db push`.
- If migration history needs repair, document object-level evidence first.
- Use the Supabase skill guidance and current CLI help before running mutation commands.

## Specific Security Items To Check

- Function execute grants, especially `public.is_appointment_message_adopter`.
- Public or authenticated access to sensitive helper functions.
- RLS enabled on launch-critical public tables.
- Views that may bypass RLS unless `security_invoker = true`.
- Storage bucket privacy for sensitive files.
- Leaked password protection status in Supabase Auth dashboard.

## Acceptance Criteria

- Advisor security warnings are resolved or explicitly documented with a reason and next action.
- Production storage posture is known and sensitive buckets are private.
- Launch-critical migration state is documented clearly.
- Any remote SQL changes have matching migration/docs follow-up.
- `npm run typecheck` passes at minimum; run `npm run verify` if code changes are made.

## Final Report

Return:

1. Advisor warnings before and after.
2. Remote Supabase changes made.
3. Migration-history findings and recommended repair/apply actions.
4. Verification commands and results.
5. Remaining launch blockers, if any.
