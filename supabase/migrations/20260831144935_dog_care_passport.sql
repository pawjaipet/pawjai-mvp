create type public.dog_vaccination_status as enum (
  'unknown',
  'not_started',
  'partial',
  'up_to_date',
  'overdue'
);

create type public.dog_vaccination_verification_status as enum (
  'verified',
  'pending',
  'unknown'
);

create type public.dog_care_document_type as enum (
  'adoption_document',
  'vaccination_proof',
  'medical_record',
  'other'
);

create type public.dog_care_document_visibility as enum (
  'adopter_visible',
  'shelter_only'
);

create type public.dog_care_event_type as enum (
  'medical',
  'behavior',
  'diet',
  'follow_up',
  'general',
  'adoption'
);

create table if not exists public.dog_care_records (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  adopter_id uuid references public.adopters (id) on delete set null,
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  vaccination_status public.dog_vaccination_status not null default 'unknown',
  medical_notes text,
  special_needs_notes text,
  allergies text,
  medications text,
  last_vet_check_date date,
  next_vet_check_due_date date,
  last_updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (dog_id)
);

create index if not exists dog_care_records_dog_id_idx
  on public.dog_care_records (dog_id);

create index if not exists dog_care_records_adopter_id_idx
  on public.dog_care_records (adopter_id);

create index if not exists dog_care_records_shelter_id_idx
  on public.dog_care_records (shelter_id);

create trigger set_dog_care_records_updated_at
before update on public.dog_care_records
for each row execute function public.set_updated_at();

create table if not exists public.dog_care_documents (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  adopter_id uuid references public.adopters (id) on delete set null,
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  document_type public.dog_care_document_type not null default 'other',
  title text not null check (char_length(trim(title)) > 0 and char_length(title) <= 180),
  bucket_id text,
  storage_path text,
  file_url text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  visibility public.dog_care_document_visibility not null default 'adopter_visible',
  uploaded_at timestamptz not null default timezone('utc', now())
);

create index if not exists dog_care_documents_dog_id_idx
  on public.dog_care_documents (dog_id);

create index if not exists dog_care_documents_adopter_id_idx
  on public.dog_care_documents (adopter_id);

create index if not exists dog_care_documents_shelter_id_idx
  on public.dog_care_documents (shelter_id);

create table if not exists public.dog_vaccination_records (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  adopter_id uuid references public.adopters (id) on delete set null,
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  vaccine_name text not null check (char_length(trim(vaccine_name)) > 0 and char_length(vaccine_name) <= 160),
  administered_on date,
  due_on date,
  provider_name text,
  notes text,
  verification_status public.dog_vaccination_verification_status not null default 'unknown',
  document_id uuid references public.dog_care_documents (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists dog_vaccination_records_dog_id_idx
  on public.dog_vaccination_records (dog_id);

create index if not exists dog_vaccination_records_due_on_idx
  on public.dog_vaccination_records (due_on);

create trigger set_dog_vaccination_records_updated_at
before update on public.dog_vaccination_records
for each row execute function public.set_updated_at();

create table if not exists public.dog_care_timeline_events (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  adopter_id uuid references public.adopters (id) on delete set null,
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  event_type public.dog_care_event_type not null default 'general',
  title text not null check (char_length(trim(title)) > 0 and char_length(title) <= 180),
  description text,
  event_date date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists dog_care_timeline_events_dog_date_idx
  on public.dog_care_timeline_events (dog_id, event_date desc nulls last, created_at desc);

alter table public.dog_care_records enable row level security;
alter table public.dog_care_documents enable row level security;
alter table public.dog_vaccination_records enable row level security;
alter table public.dog_care_timeline_events enable row level security;

grant select, insert, update, delete on table public.dog_care_records to authenticated, service_role;
grant select, insert, update, delete on table public.dog_care_documents to authenticated, service_role;
grant select, insert, update, delete on table public.dog_vaccination_records to authenticated, service_role;
grant select, insert, update, delete on table public.dog_care_timeline_events to authenticated, service_role;

create policy "dog_care_records_related_party_select"
on public.dog_care_records
for select
to authenticated
using (
  exists (
    select 1
    from public.adopters adopter
    where adopter.id = dog_care_records.adopter_id
      and adopter.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = dog_care_records.shelter_id
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

create policy "dog_care_records_shelter_or_admin_insert"
on public.dog_care_records
for insert
to authenticated
with check (
  exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = dog_care_records.shelter_id
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

create policy "dog_care_records_shelter_or_admin_update"
on public.dog_care_records
for update
to authenticated
using (
  exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = dog_care_records.shelter_id
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
    where su.shelter_id = dog_care_records.shelter_id
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

create policy "dog_care_records_shelter_or_admin_delete"
on public.dog_care_records
for delete
to authenticated
using (
  exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = dog_care_records.shelter_id
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

create policy "dog_care_documents_related_party_select"
on public.dog_care_documents
for select
to authenticated
using (
  (
    visibility = 'adopter_visible'
    and exists (
      select 1
      from public.adopters adopter
      where adopter.id = dog_care_documents.adopter_id
        and adopter.profile_id = (select auth.uid())
    )
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = dog_care_documents.shelter_id
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

create policy "dog_care_documents_shelter_or_admin_write"
on public.dog_care_documents
for all
to authenticated
using (
  exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = dog_care_documents.shelter_id
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
    where su.shelter_id = dog_care_documents.shelter_id
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

create policy "dog_vaccination_records_related_party_select"
on public.dog_vaccination_records
for select
to authenticated
using (
  exists (
    select 1
    from public.adopters adopter
    where adopter.id = dog_vaccination_records.adopter_id
      and adopter.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = dog_vaccination_records.shelter_id
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

create policy "dog_vaccination_records_shelter_or_admin_write"
on public.dog_vaccination_records
for all
to authenticated
using (
  exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = dog_vaccination_records.shelter_id
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
    where su.shelter_id = dog_vaccination_records.shelter_id
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

create policy "dog_care_timeline_events_related_party_select"
on public.dog_care_timeline_events
for select
to authenticated
using (
  exists (
    select 1
    from public.adopters adopter
    where adopter.id = dog_care_timeline_events.adopter_id
      and adopter.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = dog_care_timeline_events.shelter_id
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

create policy "dog_care_timeline_events_shelter_or_admin_write"
on public.dog_care_timeline_events
for all
to authenticated
using (
  exists (
    select 1
    from public.shelter_users su
    where su.shelter_id = dog_care_timeline_events.shelter_id
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
    where su.shelter_id = dog_care_timeline_events.shelter_id
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
