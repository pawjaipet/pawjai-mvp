drop policy if exists "adopters_owner_related_shelter_or_admin_select" on public.adopters;
drop policy if exists "adopters_owner_or_admin_select" on public.adopters;

create policy "adopters_owner_or_admin_select"
on public.adopters
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'
  )
);
