alter table public.profiles enable row level security;
alter table public.adopters enable row level security;
alter table public.shelters enable row level security;
alter table public.shelter_users enable row level security;
alter table public.shelter_availability enable row level security;
alter table public.dogs enable row level security;
alter table public.dog_photos enable row level security;
alter table public.dog_traits enable row level security;
alter table public.applications enable row level security;
alter table public.application_details enable row level security;
alter table public.application_documents enable row level security;
alter table public.appointments enable row level security;
alter table public.wishlists enable row level security;
alter table public.questionnaire_templates enable row level security;
alter table public.questionnaire_questions enable row level security;
alter table public.application_answers enable row level security;

create policy "profiles_self_or_admin_select"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
);

create policy "profiles_self_insert"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
);

create policy "profiles_self_update"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
);

create policy "adopters_owner_related_shelter_or_admin_select"
on public.adopters
for select
to authenticated
using (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.adopter_id = adopters.id
      and su.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.appointments appt
    join public.shelter_users su
      on su.shelter_id = appt.shelter_id
    where appt.adopter_id = adopters.id
      and su.profile_id = auth.uid()
  )
);

create policy "adopters_owner_or_admin_insert"
on public.adopters
for insert
to authenticated
with check (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
);

create policy "adopters_owner_or_admin_update"
on public.adopters
for update
to authenticated
using (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
)
with check (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
);

create policy "shelters_public_select"
on public.shelters
for select
to public
using (true);

create policy "shelters_admin_or_shelter_admin_insert"
on public.shelters
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role in ('shelter_admin', 'admin')
  )
);

create policy "shelters_member_or_admin_update"
on public.shelters
for update
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
    where su.shelter_id = shelters.id
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
    where su.shelter_id = shelters.id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
);

create policy "shelters_owner_or_admin_delete"
on public.shelters
for delete
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
    where su.shelter_id = shelters.id
      and su.profile_id = auth.uid()
      and su.role = 'owner'
  )
);

create policy "shelter_users_self_or_admin_select"
on public.shelter_users
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

create policy "shelter_users_admin_insert"
on public.shelter_users
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

create policy "shelter_users_admin_update"
on public.shelter_users
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

create policy "shelter_users_admin_delete"
on public.shelter_users
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

create policy "shelter_availability_public_select"
on public.shelter_availability
for select
to public
using (true);

create policy "shelter_availability_member_or_admin_write"
on public.shelter_availability
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
    where su.shelter_id = shelter_availability.shelter_id
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
    where su.shelter_id = shelter_availability.shelter_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
);

create policy "dogs_public_select"
on public.dogs
for select
to public
using (true);

create policy "dogs_member_or_admin_write"
on public.dogs
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
    where su.shelter_id = dogs.shelter_id
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
    where su.shelter_id = dogs.shelter_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
);

create policy "dog_photos_public_select"
on public.dog_photos
for select
to public
using (true);

create policy "dog_photos_member_or_admin_write"
on public.dog_photos
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
    from public.dogs d
    join public.shelter_users su
      on su.shelter_id = d.shelter_id
    where d.id = dog_photos.dog_id
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
    from public.dogs d
    join public.shelter_users su
      on su.shelter_id = d.shelter_id
    where d.id = dog_photos.dog_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
);

create policy "dog_traits_public_select"
on public.dog_traits
for select
to public
using (true);

create policy "dog_traits_member_or_admin_write"
on public.dog_traits
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
    from public.dogs d
    join public.shelter_users su
      on su.shelter_id = d.shelter_id
    where d.id = dog_traits.dog_id
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
    from public.dogs d
    join public.shelter_users su
      on su.shelter_id = d.shelter_id
    where d.id = dog_traits.dog_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
);

create policy "applications_related_party_select"
on public.applications
for select
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = applications.adopter_id
      and a.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = applications.shelter_id
      and su.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

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
      and a.profile_id = auth.uid()
      and d.shelter_id = applications.shelter_id
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

create policy "applications_related_party_update"
on public.applications
for update
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = applications.adopter_id
      and a.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = applications.shelter_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.adopters a
    where a.id = applications.adopter_id
      and a.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = applications.shelter_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

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
      and a.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_details.application_id
      and su.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

create policy "application_details_related_party_write"
on public.application_details
for all
to authenticated
using (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_details.application_id
      and a.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_details.application_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
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
      and a.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_details.application_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

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
      and a.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_documents.application_id
      and su.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

create policy "application_documents_related_party_write"
on public.application_documents
for all
to authenticated
using (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_documents.application_id
      and a.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_documents.application_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
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
      and a.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_documents.application_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

create policy "appointments_related_party_select"
on public.appointments
for select
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = appointments.adopter_id
      and a.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = appointments.shelter_id
      and su.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

create policy "appointments_related_party_insert"
on public.appointments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.adopters a
    where a.id = appointments.adopter_id
      and a.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = appointments.shelter_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

create policy "appointments_related_party_update"
on public.appointments
for update
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = appointments.adopter_id
      and a.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = appointments.shelter_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.adopters a
    where a.id = appointments.adopter_id
      and a.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = appointments.shelter_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

create policy "wishlists_owner_select"
on public.wishlists
for select
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = wishlists.adopter_id
      and a.profile_id = auth.uid()
  )
);

create policy "wishlists_owner_insert"
on public.wishlists
for insert
to authenticated
with check (
  exists (
    select 1
    from public.adopters a
    where a.id = wishlists.adopter_id
      and a.profile_id = auth.uid()
  )
);

create policy "wishlists_owner_delete"
on public.wishlists
for delete
to authenticated
using (
  exists (
    select 1
    from public.adopters a
    where a.id = wishlists.adopter_id
      and a.profile_id = auth.uid()
  )
);

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
      and su.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

create policy "questionnaire_templates_member_or_admin_write"
on public.questionnaire_templates
for all
to authenticated
using (
  exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = questionnaire_templates.shelter_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = questionnaire_templates.shelter_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

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
      and su.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

create policy "questionnaire_questions_member_or_admin_write"
on public.questionnaire_questions
for all
to authenticated
using (
  exists (
    select 1
    from public.questionnaire_templates qt
    join public.shelter_users su
      on su.shelter_id = qt.shelter_id
    where qt.id = questionnaire_questions.template_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
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
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

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
      and a.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_answers.application_id
      and su.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

create policy "application_answers_related_party_write"
on public.application_answers
for all
to authenticated
using (
  exists (
    select 1
    from public.applications app
    join public.adopters a
      on a.id = app.adopter_id
    where app.id = application_answers.application_id
      and a.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_answers.application_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
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
      and a.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.applications app
    join public.shelter_users su
      on su.shelter_id = app.shelter_id
    where app.id = application_answers.application_id
      and su.profile_id = auth.uid()
      and su.role in ('owner', 'staff')
  )
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);
