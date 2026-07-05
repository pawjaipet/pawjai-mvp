# PAWJAI Supabase Change Playbook

Use this for schema, RLS, storage, generated types, or Supabase client changes.

## Before Editing

- Read `docs/agent-map.md`.
- Inspect related migrations and `types/database.ts`.
- Prefer one new migration for one coherent database change.
- Check whether the table is public data, user-owned data, shelter-owned data, or private adopter/document data.

## Migration Checklist

- Add or alter table/columns with explicit constraints.
- Enable RLS for exposed public-schema tables.
- Add policies matching the real access model.
- Add indexes for foreign keys, lookup filters, and date/status queries.
- For views, use `security_invoker = true` when exposed.
- For storage buckets, define public/private behavior, size limits, MIME types, and path rules.

## After Migration

- Regenerate `types/database.ts`.
- Update model utilities and server actions.
- Add or update tests for policy-sensitive logic where possible.
- Run `npm run verify`.
- If using live Supabase MCP/CLI, run advisors and inspect security warnings.

## Caution

- Do not use service role to paper over missing RLS unless the operation is truly internal/admin.
- Do not create policies from `raw_user_meta_data`.
- Do not change old migrations that have already been applied remotely unless the project is explicitly being rebuilt.
