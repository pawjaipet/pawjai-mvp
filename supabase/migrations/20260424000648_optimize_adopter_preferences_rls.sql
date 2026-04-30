drop policy if exists "adopter_preferences_owner_select" on public.adopter_preferences;
drop policy if exists "adopter_preferences_owner_insert" on public.adopter_preferences;
drop policy if exists "adopter_preferences_owner_update" on public.adopter_preferences;

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
