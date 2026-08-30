# Supabase Advisor Final Proof - 2026-08-30

## Scope

This note records the final Supabase advisor proof run before public launch readiness work continues. No database, storage, or application code changes were made as part of this check.

## Commands Run

```bash
npx supabase --version
npx supabase db advisors --linked --output json
npx supabase db advisors --linked --type security --output json
npx supabase db advisors --linked --type performance --output json
npx supabase migration list
```

## Results

- Supabase CLI version: `2.115.0` (`2.116.0` was available at run time).
- Security advisor result: one warning remains.
- Performance advisor result: no issues found.
- Remaining security warning:
  - Name: `auth_leaked_password_protection`
  - Title: `Leaked Password Protection Disabled`
  - Level: `WARN`
  - Category: `SECURITY`
  - Supabase remediation link: `https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection`

## Dashboard Check

The hosted project dashboard showed the project as `pawjaipet FREE`. The Email auth provider screen showed the `Prevent use of leaked passwords` setting with the note that it is only available on the Pro plan and above.

Because this is a hosted Auth setting and the dashboard marks it as Pro-plan-only, it was not changed from code, SQL, or the CLI in this session.

## Storage Sanity Check

The production storage bucket check confirmed:

- `appointment-message-attachments` is private (`public: false`).
- `dog-photos` remains public as expected for dog profile media.
- `identity-documents`, `application-documents`, and `adopter-documents` remain private.

## What Remains

To clear the final Supabase security advisor warning:

1. Upgrade the Supabase project to Pro.
2. Go to Supabase Dashboard -> Authentication -> Sign In / Providers -> Email.
3. Enable `Prevent use of leaked passwords`.
4. Save the setting.
5. Re-run:

```bash
npx supabase db advisors --linked --type security --output json
```

The expected clean result is no remaining security advisor warnings.
