# PAWJAI Admin Account Setup

PAWJAI uses Supabase Auth for admin sign-in. Do not use shared passphrases or raw admin cookies.

## Account Types

- `admin`: PawJai global admin. Can manage all shelters, ads, PawJai profile content, and audit logs.
- `shelter_admin`: Shared shelter workspace account. Can manage only shelters linked through `shelter_users`.
- `adopter`: Normal user account. Cannot access `/admin`.

## Preferred Workflow

Use `/admin/accounts` from an existing PawJai global admin account. It can create a new Supabase Auth user, assign `admin` or `shelter_admin`, and link shelter accounts to a shelter.

## Manual Fallback: Create A PawJai Global Admin

1. Create or invite a Supabase Auth user.
2. Ensure that user has a row in `public.profiles`.
3. Set `public.profiles.role = 'admin'` for that user.
4. Have the user sign in at `/admin/login`.

## Create One Shared Shelter Account

1. Create or invite a Supabase Auth user with an email owned by the shelter.
2. Set that user's profile role:

```sql
update public.profiles
set role = 'shelter_admin'
where id = '<profile_id>';
```

3. Link the profile to the shelter:

```sql
insert into public.shelter_users (profile_id, shelter_id, role)
values ('<profile_id>', '<shelter_id>', 'owner')
on conflict (shelter_id, profile_id) do update
set role = excluded.role;
```

4. Share the login email and password with the shelter owner or manager.

## Operating Rules

- Prefer one shared shelter account only when the shelter wants a simple workflow.
- Use one account per staff member later if you need per-person accountability.
- Never set `role` from client-side code or user-editable metadata.
- Use `/admin/audit` after important changes to confirm privileged actions are being logged.
- If a shelter account should lose access, delete its `shelter_users` row or change its profile role back to `adopter`.
