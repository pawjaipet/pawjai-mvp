-- Role-based admin hardening:
-- - Audit table for privileged admin/shelter-admin activity.
-- - Defensive unique guard for active appointment slots when existing data is clean.

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles (id) on delete set null,
  actor_role public.app_role not null,
  action text not null,
  target_table text,
  target_id text,
  shelter_id uuid references public.shelters (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint admin_audit_events_actor_role_valid check (actor_role in ('admin', 'shelter_admin')),
  constraint admin_audit_events_action_not_blank check (length(btrim(action)) > 0)
);

alter table public.admin_audit_events enable row level security;

grant select on public.admin_audit_events to authenticated;

create index if not exists admin_audit_events_actor_created_idx
  on public.admin_audit_events (actor_profile_id, created_at desc);

create index if not exists admin_audit_events_shelter_created_idx
  on public.admin_audit_events (shelter_id, created_at desc);

drop policy if exists "admin_audit_events_global_admin_select" on public.admin_audit_events;
create policy "admin_audit_events_global_admin_select"
on public.admin_audit_events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "admin_audit_events_shelter_admin_select" on public.admin_audit_events;
create policy "admin_audit_events_shelter_admin_select"
on public.admin_audit_events
for select
to authenticated
using (
  shelter_id is not null
  and exists (
    select 1
    from public.profiles p
    join public.shelter_users su
      on su.profile_id = p.id
    where p.id = auth.uid()
      and p.role = 'shelter_admin'
      and su.shelter_id = admin_audit_events.shelter_id
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'appointments_unique_active_shelter_slot_idx'
  ) then
    if exists (
      select 1
      from public.appointments
      where status in ('requested', 'confirmed')
      group by shelter_id, appointment_date, appointment_time
      having count(*) > 1
    ) then
      raise notice 'Skipped appointments_unique_active_shelter_slot_idx because duplicate active appointment slots already exist.';
    else
      create unique index appointments_unique_active_shelter_slot_idx
        on public.appointments (shelter_id, appointment_date, appointment_time)
        where status in ('requested', 'confirmed');
    end if;
  end if;
end $$;
