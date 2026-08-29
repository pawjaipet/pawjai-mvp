-- Final narrow Supabase Advisor cleanup for remaining RLS performance warnings.

drop policy if exists "admin_audit_events_global_admin_select" on public.admin_audit_events;
drop policy if exists "admin_audit_events_shelter_admin_select" on public.admin_audit_events;
create policy "admin_audit_events_related_admin_select"
on public.admin_audit_events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
  or (
    shelter_id is not null
    and exists (
      select 1
      from public.profiles p
      join public.shelter_users su
        on su.profile_id = p.id
      where p.id = (select auth.uid())
        and p.role = 'shelter_admin'
        and su.shelter_id = admin_audit_events.shelter_id
    )
  )
);

drop policy if exists "shelter_portal_accounts_self_or_admin_select" on public.shelter_portal_accounts;
create policy "shelter_portal_accounts_self_or_admin_select"
on public.shelter_portal_accounts
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "shelter_portal_accounts_self_or_admin_update" on public.shelter_portal_accounts;
create policy "shelter_portal_accounts_self_or_admin_update"
on public.shelter_portal_accounts
for update
to authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
)
with check (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "adopter_profiles_owner_or_admin_select" on public.adopter_profiles;
create policy "adopter_profiles_owner_or_admin_select"
on public.adopter_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = adopter_profiles.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

drop policy if exists "adopter_profiles_owner_or_admin_write" on public.adopter_profiles;
create policy "adopter_profiles_owner_or_admin_insert"
on public.adopter_profiles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.adopters a
    where a.id = adopter_profiles.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

create policy "adopter_profiles_owner_or_admin_update"
on public.adopter_profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = adopter_profiles.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.adopters a
    where a.id = adopter_profiles.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

create policy "adopter_profiles_owner_or_admin_delete"
on public.adopter_profiles
for delete
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = adopter_profiles.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

drop policy if exists "adopter_documents_owner_or_admin_select" on public.adopter_documents;
create policy "adopter_documents_owner_or_admin_select"
on public.adopter_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = adopter_documents.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

drop policy if exists "adopter_documents_owner_or_admin_write" on public.adopter_documents;
create policy "adopter_documents_owner_or_admin_insert"
on public.adopter_documents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.adopters a
    where a.id = adopter_documents.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

create policy "adopter_documents_owner_or_admin_update"
on public.adopter_documents
for update
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = adopter_documents.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.adopters a
    where a.id = adopter_documents.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

create policy "adopter_documents_owner_or_admin_delete"
on public.adopter_documents
for delete
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = adopter_documents.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

drop policy if exists "Adopters can read their appointment messages" on public.appointment_messages;
drop policy if exists "Shelter staff can read appointment messages" on public.appointment_messages;
create policy "Appointment message related party select"
on public.appointment_messages
for select
to authenticated
using (
  (select private.is_appointment_message_adopter(
    appointment_messages.adopter_id,
    appointment_messages.shelter_id,
    appointment_messages.appointment_id
  ))
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = appointment_messages.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);
