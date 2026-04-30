create table public.adopter_preferences (
  adopter_id uuid primary key references public.adopters (id) on delete cascade,
  preferred_size public.dog_size,
  preferred_energy_level public.dog_energy_level,
  good_with_kids boolean,
  good_with_dogs boolean,
  good_with_cats boolean,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.adopter_preferences enable row level security;

create trigger set_adopter_preferences_updated_at
before update on public.adopter_preferences
for each row
execute function public.set_updated_at();

create policy "adopter_preferences_owner_select"
on public.adopter_preferences
for select
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = adopter_preferences.adopter_id
      and a.profile_id = (select auth.uid())
  )
);

create policy "adopter_preferences_owner_insert"
on public.adopter_preferences
for insert
to authenticated
with check (
  exists (
    select 1
    from public.adopters a
    where a.id = adopter_preferences.adopter_id
      and a.profile_id = (select auth.uid())
  )
);

create policy "adopter_preferences_owner_update"
on public.adopter_preferences
for update
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = adopter_preferences.adopter_id
      and a.profile_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.adopters a
    where a.id = adopter_preferences.adopter_id
      and a.profile_id = (select auth.uid())
  )
);
