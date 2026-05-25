alter table public.shelters
  add column if not exists logo_url text,
  add column if not exists google_maps_url text,
  add column if not exists meeting_instructions text;

create table if not exists public.shelter_regular_hours (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  slot_duration_minutes integer not null default 60 check (slot_duration_minutes > 0),
  is_closed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (shelter_id, day_of_week),
  constraint shelter_regular_hours_window_valid check (
    is_closed = true
    or (
      opens_at is not null
      and closes_at is not null
      and closes_at > opens_at
    )
  )
);

create index if not exists shelter_regular_hours_shelter_id_idx
  on public.shelter_regular_hours (shelter_id);

alter table public.shelter_regular_hours enable row level security;

drop policy if exists "shelter_regular_hours_public_select" on public.shelter_regular_hours;
create policy "shelter_regular_hours_public_select"
on public.shelter_regular_hours
for select
to public
using (true);

drop policy if exists "shelter_regular_hours_member_or_admin_write" on public.shelter_regular_hours;
create policy "shelter_regular_hours_member_or_admin_write"
on public.shelter_regular_hours
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = shelter_regular_hours.shelter_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
)
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = shelter_regular_hours.shelter_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
);

drop trigger if exists set_shelter_regular_hours_updated_at on public.shelter_regular_hours;
create trigger set_shelter_regular_hours_updated_at
before update on public.shelter_regular_hours
for each row execute function public.set_updated_at();
