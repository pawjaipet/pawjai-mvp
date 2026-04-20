# Pawjai Supabase Backend

This repo now includes the first Supabase backend scaffold for Pawjai under `/Users/sudlabha/Desktop/paw/supabase`.

## Included now

- Local Supabase project initialized with `supabase/config.toml`
- Core schema migration for the Pawjai domain tables
- RLS migration for user, shelter, dog, application, and appointment ownership rules
- Storage migration for profile pictures, dog photos, identity documents, and application documents
- Empty seed file for future fixtures

## Current migration set

- `20260420194640_001_core_schema.sql`
- `20260420194650_002_rls_policies.sql`
- `20260420194655_003_storage_setup.sql`

## Key design choices

- `profiles` is the base identity table keyed to `auth.users`
- `adopters` stores stable adopter profile data
- `applications` and related tables store dog-specific adoption flow data
- Shelter staff access is modeled through `shelter_users`
- Public browsing is enabled for shelters, dogs, dog photos, dog traits, and shelter availability
- Sensitive documents stay in private storage buckets with path-based policies
- `shelter_users` writes are admin-only in this first pass to avoid recursive RLS during bootstrap

## Known follow-ups

- Add remote migration/apply flow once we expose Supabase project tools in this session
- Generate database types after the schema is applied
- Add seed data for a sample shelter, dogs, and adopter journey
- Add edge functions for shelter/admin workflows
- Revisit whether appointments need stricter slot uniqueness rules
- Revisit whether adopters should be allowed to update applications after submission
