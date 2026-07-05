# PAWJAI Admin Flow Change Playbook

Use this when changing `/admin`, shelter staff tools, ads, bookings, dog listings, QR check-in, or PawJai profile content.

## Guardrails

- Admin UI gating is not enough. Server actions must check authorization before privileged reads or writes.
- Any service-role mutation needs an explicit gate, authenticated admin role, or shelter membership check.
- Shelter-scoped staff should only see and mutate their shelter data.
- Founder/global admin behavior should be separate from shelter staff behavior.
- Shared shelter accounts are allowed, but they must still be normal Supabase Auth users with `profiles.role = 'shelter_admin'` and a `shelter_users` link.
- Privileged mutations should write an admin audit event when practical.

## Check These Files

- `utils/admin-auth.ts`
- `utils/admin-audit.ts`
- `utils/supabase/admin.ts`
- `app/admin/dogs/new/actions.ts`
- `app/admin/dogs/[id]/edit/actions.ts`
- `app/admin/bookings/actions.ts`
- `app/admin/ads/actions.ts`
- `app/admin/pawjaiprofile/actions.ts`
- related RLS policies in `supabase/migrations/`

## Before Shipping

- Search for the changed action with `rg`.
- Confirm each action handles unauthorized calls directly.
- Confirm hidden form fields cannot grant broader access.
- Confirm `/admin/audit` can explain who changed sensitive records.
- Confirm uploaded files have type, size, and path validation.
- Run `npm run verify`.
