create table if not exists public.shelter_portal_accounts (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  username extensions.citext not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint shelter_portal_accounts_username_not_blank check (length(btrim(username::text)) > 0),
  constraint shelter_portal_accounts_username_format check (username::text ~ '^[a-z0-9][a-z0-9_-]{2,39}$')
);

drop trigger if exists set_shelter_portal_accounts_updated_at on public.shelter_portal_accounts;
create trigger set_shelter_portal_accounts_updated_at
before update on public.shelter_portal_accounts
for each row execute function public.set_updated_at();

alter table public.shelter_portal_accounts enable row level security;

grant select, update on public.shelter_portal_accounts to authenticated;

drop policy if exists "shelter_portal_accounts_self_or_admin_select" on public.shelter_portal_accounts;
create policy "shelter_portal_accounts_self_or_admin_select"
on public.shelter_portal_accounts
for select
to authenticated
using (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

drop policy if exists "shelter_portal_accounts_self_or_admin_update" on public.shelter_portal_accounts;
create policy "shelter_portal_accounts_self_or_admin_update"
on public.shelter_portal_accounts
for update
to authenticated
using (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
)
with check (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);
