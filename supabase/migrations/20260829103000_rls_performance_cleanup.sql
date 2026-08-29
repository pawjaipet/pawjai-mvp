-- Narrow RLS performance cleanup for production.
-- 1. Replace row-by-row auth.uid() policy checks with (select auth.uid()).
-- 2. Split FOR ALL write policies away from public SELECT policies.
-- 3. Remove an exact duplicate index reported by Supabase Advisor.

drop index if exists public.kv_store_442bb426_key_idx1;

drop policy if exists "profiles_self_or_admin_select" on public.profiles;
create policy "profiles_self_or_admin_select"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert"
on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()));

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "adopters_owner_related_shelter_or_admin_select" on public.adopters;
create policy "adopters_owner_related_shelter_or_admin_select"
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
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.adopter_id = adopters.id
      and su.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.appointments appt
    join public.shelter_users su
      on su.shelter_id = appt.shelter_id
    where appt.adopter_id = adopters.id
      and su.profile_id = (select auth.uid())
  )
);

drop policy if exists "adopters_owner_or_admin_insert" on public.adopters;
create policy "adopters_owner_or_admin_insert"
on public.adopters
for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'
  )
);

drop policy if exists "adopters_owner_or_admin_update" on public.adopters;
create policy "adopters_owner_or_admin_update"
on public.adopters
for update
to authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'
  )
)
with check (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'
  )
);

drop policy if exists "shelters_admin_or_shelter_admin_insert" on public.shelters;
create policy "shelters_admin_or_shelter_admin_insert"
on public.shelters
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role in ('shelter_admin', 'admin')
  )
);

drop policy if exists "shelters_member_or_admin_update" on public.shelters;
create policy "shelters_member_or_admin_update"
on public.shelters
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = shelters.id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
)
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = shelters.id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);

drop policy if exists "shelters_owner_or_admin_delete" on public.shelters;
create policy "shelters_owner_or_admin_delete"
on public.shelters
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = shelters.id
      and su.profile_id = (select auth.uid())
      and su.role = 'owner'
  )
);

drop policy if exists "shelter_users_self_or_admin_select" on public.shelter_users;
create policy "shelter_users_self_or_admin_select"
on public.shelter_users
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

drop policy if exists "shelter_users_admin_insert" on public.shelter_users;
create policy "shelter_users_admin_insert"
on public.shelter_users
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "shelter_users_admin_update" on public.shelter_users;
create policy "shelter_users_admin_update"
on public.shelter_users
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "shelter_users_admin_delete" on public.shelter_users;
create policy "shelter_users_admin_delete"
on public.shelter_users
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "shelter_availability_member_or_admin_write" on public.shelter_availability;
create policy "shelter_availability_member_or_admin_insert"
on public.shelter_availability
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = shelter_availability.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);

create policy "shelter_availability_member_or_admin_update"
on public.shelter_availability
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = shelter_availability.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
)
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = shelter_availability.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);

create policy "shelter_availability_member_or_admin_delete"
on public.shelter_availability
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = shelter_availability.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);

drop policy if exists "dogs_member_or_admin_write" on public.dogs;
create policy "dogs_member_or_admin_insert"
on public.dogs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = dogs.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);

create policy "dogs_member_or_admin_update"
on public.dogs
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = dogs.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
)
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = dogs.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);

create policy "dogs_member_or_admin_delete"
on public.dogs
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = dogs.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);

drop policy if exists "dog_photos_member_or_admin_write" on public.dog_photos;
create policy "dog_photos_member_or_admin_insert"
on public.dog_photos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.dogs d
    join public.shelter_users su
      on su.shelter_id = d.shelter_id
    where d.id = dog_photos.dog_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);

create policy "dog_photos_member_or_admin_update"
on public.dog_photos
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.dogs d
    join public.shelter_users su
      on su.shelter_id = d.shelter_id
    where d.id = dog_photos.dog_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
)
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.dogs d
    join public.shelter_users su
      on su.shelter_id = d.shelter_id
    where d.id = dog_photos.dog_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);

create policy "dog_photos_member_or_admin_delete"
on public.dog_photos
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.dogs d
    join public.shelter_users su
      on su.shelter_id = d.shelter_id
    where d.id = dog_photos.dog_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);

drop policy if exists "dog_traits_member_or_admin_write" on public.dog_traits;
create policy "dog_traits_member_or_admin_insert"
on public.dog_traits
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.dogs d
    join public.shelter_users su
      on su.shelter_id = d.shelter_id
    where d.id = dog_traits.dog_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);

create policy "dog_traits_member_or_admin_update"
on public.dog_traits
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.dogs d
    join public.shelter_users su
      on su.shelter_id = d.shelter_id
    where d.id = dog_traits.dog_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
)
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.dogs d
    join public.shelter_users su
      on su.shelter_id = d.shelter_id
    where d.id = dog_traits.dog_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);

create policy "dog_traits_member_or_admin_delete"
on public.dog_traits
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.dogs d
    join public.shelter_users su
      on su.shelter_id = d.shelter_id
    where d.id = dog_traits.dog_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);

drop policy if exists "applications_related_party_select" on public.applications;
create policy "applications_related_party_select"
on public.applications
for select
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = applications.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = applications.shelter_id
      and su.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "applications_owner_or_admin_insert" on public.applications;
create policy "applications_owner_or_admin_insert"
on public.applications
for insert
to authenticated
with check (
  exists (
    select 1
    from public.adopters a
    join public.dogs d
      on d.id = applications.dog_id
    where a.id = applications.adopter_id
      and a.profile_id = (select auth.uid())
      and d.shelter_id = applications.shelter_id
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "applications_related_party_update" on public.applications;
create policy "applications_related_party_update"
on public.applications
for update
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = applications.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = applications.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.adopters a
    where a.id = applications.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = applications.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "application_details_related_party_select" on public.application_details;
create policy "application_details_related_party_select"
on public.application_details
for select
to authenticated
using (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_details.application_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_details.application_id
      and su.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "application_details_related_party_write" on public.application_details;
create policy "application_details_related_party_insert"
on public.application_details
for insert
to authenticated
with check (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_details.application_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_details.application_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

create policy "application_details_related_party_update"
on public.application_details
for update
to authenticated
using (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_details.application_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_details.application_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_details.application_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_details.application_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

create policy "application_details_related_party_delete"
on public.application_details
for delete
to authenticated
using (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_details.application_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_details.application_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "application_documents_related_party_select" on public.application_documents;
create policy "application_documents_related_party_select"
on public.application_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_documents.application_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_documents.application_id
      and su.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "application_documents_related_party_write" on public.application_documents;
create policy "application_documents_related_party_insert"
on public.application_documents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_documents.application_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_documents.application_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

create policy "application_documents_related_party_update"
on public.application_documents
for update
to authenticated
using (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_documents.application_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_documents.application_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_documents.application_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_documents.application_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

create policy "application_documents_related_party_delete"
on public.application_documents
for delete
to authenticated
using (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_documents.application_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_documents.application_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "appointments_related_party_select" on public.appointments;
create policy "appointments_related_party_select"
on public.appointments
for select
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = appointments.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = appointments.shelter_id
      and su.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "appointments_related_party_insert" on public.appointments;
create policy "appointments_related_party_insert"
on public.appointments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.adopters a
    where a.id = appointments.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = appointments.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "appointments_related_party_update" on public.appointments;
create policy "appointments_related_party_update"
on public.appointments
for update
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = appointments.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = appointments.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.adopters a
    where a.id = appointments.adopter_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = appointments.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "wishlists_owner_select" on public.wishlists;
create policy "wishlists_owner_select"
on public.wishlists
for select
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = wishlists.adopter_id
      and a.profile_id = (select auth.uid())
  )
);

drop policy if exists "wishlists_owner_insert" on public.wishlists;
create policy "wishlists_owner_insert"
on public.wishlists
for insert
to authenticated
with check (
  exists (
    select 1
    from public.adopters a
    where a.id = wishlists.adopter_id
      and a.profile_id = (select auth.uid())
  )
);

drop policy if exists "wishlists_owner_delete" on public.wishlists;
create policy "wishlists_owner_delete"
on public.wishlists
for delete
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = wishlists.adopter_id
      and a.profile_id = (select auth.uid())
  )
);

drop policy if exists "questionnaire_templates_public_active_select" on public.questionnaire_templates;
create policy "questionnaire_templates_public_active_select"
on public.questionnaire_templates
for select
to public
using (
  is_active = true
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = questionnaire_templates.shelter_id
      and su.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "questionnaire_templates_member_or_admin_write" on public.questionnaire_templates;
create policy "questionnaire_templates_member_or_admin_insert"
on public.questionnaire_templates
for insert
to authenticated
with check (
  exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = questionnaire_templates.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

create policy "questionnaire_templates_member_or_admin_update"
on public.questionnaire_templates
for update
to authenticated
using (
  exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = questionnaire_templates.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = questionnaire_templates.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

create policy "questionnaire_templates_member_or_admin_delete"
on public.questionnaire_templates
for delete
to authenticated
using (
  exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = questionnaire_templates.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "questionnaire_questions_public_active_select" on public.questionnaire_questions;
create policy "questionnaire_questions_public_active_select"
on public.questionnaire_questions
for select
to public
using (
  exists (
    select 1
    from public.questionnaire_templates qt
    where qt.id = questionnaire_questions.template_id
      and qt.is_active = true
  )
  or exists (
    select 1
    from public.questionnaire_templates qt
    join public.shelter_users su
      on su.shelter_id = qt.shelter_id
    where qt.id = questionnaire_questions.template_id
      and su.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "questionnaire_questions_member_or_admin_write" on public.questionnaire_questions;
create policy "questionnaire_questions_member_or_admin_insert"
on public.questionnaire_questions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.questionnaire_templates qt
    join public.shelter_users su
      on su.shelter_id = qt.shelter_id
    where qt.id = questionnaire_questions.template_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

create policy "questionnaire_questions_member_or_admin_update"
on public.questionnaire_questions
for update
to authenticated
using (
  exists (
    select 1
    from public.questionnaire_templates qt
    join public.shelter_users su
      on su.shelter_id = qt.shelter_id
    where qt.id = questionnaire_questions.template_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.questionnaire_templates qt
    join public.shelter_users su
      on su.shelter_id = qt.shelter_id
    where qt.id = questionnaire_questions.template_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

create policy "questionnaire_questions_member_or_admin_delete"
on public.questionnaire_questions
for delete
to authenticated
using (
  exists (
    select 1
    from public.questionnaire_templates qt
    join public.shelter_users su
      on su.shelter_id = qt.shelter_id
    where qt.id = questionnaire_questions.template_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "application_answers_related_party_select" on public.application_answers;
create policy "application_answers_related_party_select"
on public.application_answers
for select
to authenticated
using (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_answers.application_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_answers.application_id
      and su.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "application_answers_related_party_write" on public.application_answers;
create policy "application_answers_related_party_insert"
on public.application_answers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_answers.application_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_answers.application_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

create policy "application_answers_related_party_update"
on public.application_answers
for update
to authenticated
using (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_answers.application_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_answers.application_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_answers.application_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_answers.application_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

create policy "application_answers_related_party_delete"
on public.application_answers
for delete
to authenticated
using (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_answers.application_id
      and a.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_answers.application_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "donation_intents_owner_select" on public.donation_intents;
drop policy if exists "donation_intents_shelter_or_admin_select" on public.donation_intents;
create policy "donation_intents_related_party_select"
on public.donation_intents
for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users membership
    where membership.shelter_id = donation_intents.shelter_id
      and membership.profile_id = (select auth.uid())
      and membership.role in ('owner', 'staff')
  )
);

drop policy if exists "admin write site_settings" on public.site_settings;
create policy "admin insert site_settings"
on public.site_settings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

create policy "admin update site_settings"
on public.site_settings
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

create policy "admin delete site_settings"
on public.site_settings
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "admin write partner_shelters" on public.partner_shelters;
create policy "admin insert partner_shelters"
on public.partner_shelters
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

create policy "admin update partner_shelters"
on public.partner_shelters
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

create policy "admin delete partner_shelters"
on public.partner_shelters
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "pawjai_profile_admin_write" on public.pawjai_profile;
create policy "pawjai_profile_admin_insert"
on public.pawjai_profile
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

create policy "pawjai_profile_admin_update"
on public.pawjai_profile
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

create policy "pawjai_profile_admin_delete"
on public.pawjai_profile
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
);

drop policy if exists "shelter_regular_hours_member_or_admin_write" on public.shelter_regular_hours;
create policy "shelter_regular_hours_member_or_admin_insert"
on public.shelter_regular_hours
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = shelter_regular_hours.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);

create policy "shelter_regular_hours_member_or_admin_update"
on public.shelter_regular_hours
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = shelter_regular_hours.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
)
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = shelter_regular_hours.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);

create policy "shelter_regular_hours_member_or_admin_delete"
on public.shelter_regular_hours
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = shelter_regular_hours.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);

drop policy if exists "Adopters can read their return inquiries" on public.return_inquiries;
drop policy if exists "Shelter staff can read return inquiries" on public.return_inquiries;
create policy "return_inquiries_related_party_select"
on public.return_inquiries
for select
to authenticated
using (
  exists (
    select 1
    from public.adopters ad
    where ad.id = return_inquiries.adopter_id
      and ad.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = (select auth.uid())
      and actor.role = 'admin'
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = return_inquiries.shelter_id
      and su.profile_id = (select auth.uid())
      and su.role in ('owner', 'staff')
  )
);
