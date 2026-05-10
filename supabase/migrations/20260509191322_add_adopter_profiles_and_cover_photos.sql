create type public.adopter_verification_status as enum (
  'not_started',
  'submitted',
  'approved',
  'needs_updates'
);

create type public.adopter_document_type as enum (
  'id_copy',
  'house_image',
  'income_statement',
  'other'
);

alter table public.adopters
  add column if not exists date_of_birth date,
  add column if not exists government_id_number text,
  add column if not exists verification_status public.adopter_verification_status not null default 'not_started',
  add column if not exists verification_submitted_at timestamptz,
  add column if not exists verification_reviewed_at timestamptz;

create table if not exists public.adopter_profiles (
  adopter_id uuid primary key references public.adopters (id) on delete cascade,
  had_pets_before boolean,
  rescue_dog_experience text,
  current_pets text,
  dog_experience text,
  adoption_reason text,
  housing_type text,
  home_ownership text,
  yard_space text,
  landlord_permission text,
  household_member_count integer,
  household_allergies text,
  other_pets jsonb not null default '[]'::jsonb,
  travel_plan text,
  bonding_plan jsonb not null default '[]'::jsonb,
  daily_time_available text,
  financial_preparedness text,
  emergency_plan text,
  patience_awareness text,
  behavior_response text,
  trauma_response text,
  agreement_accepted boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint adopter_profiles_household_member_count_positive check (
    household_member_count is null or household_member_count >= 0
  ),
  constraint adopter_profiles_other_pets_is_array check (jsonb_typeof(other_pets) = 'array'),
  constraint adopter_profiles_bonding_plan_is_array check (jsonb_typeof(bonding_plan) = 'array')
);

create table if not exists public.adopter_documents (
  id uuid primary key default gen_random_uuid(),
  adopter_id uuid not null references public.adopters (id) on delete cascade,
  document_type public.adopter_document_type not null,
  bucket_id text not null default 'adopter-documents',
  storage_path text not null,
  mime_type text,
  original_file_name text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists adopter_documents_adopter_id_idx
  on public.adopter_documents (adopter_id);

create index if not exists adopter_documents_adopter_type_idx
  on public.adopter_documents (adopter_id, document_type);

create trigger set_adopter_profiles_updated_at
before update on public.adopter_profiles
for each row
execute function public.set_updated_at();

alter table public.adopter_profiles enable row level security;
alter table public.adopter_documents enable row level security;

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

create policy "adopter_profiles_owner_or_admin_write"
on public.adopter_profiles
for all
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

create policy "adopter_documents_owner_or_admin_write"
on public.adopter_documents
for all
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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'adopter-documents',
  'adopter-documents',
  false,
  15728640,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "owners_manage_adopter_documents"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'adopter-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.profiles actor
      where actor.id = auth.uid()
        and actor.role = 'admin'
    )
  )
)
with check (
  bucket_id = 'adopter-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.profiles actor
      where actor.id = auth.uid()
        and actor.role = 'admin'
    )
  )
);

alter table public.dogs
  add column if not exists cover_photo_id uuid references public.dog_photos (id) on delete set null;

create index if not exists dogs_cover_photo_id_idx
  on public.dogs (cover_photo_id);

create or replace function public.sync_dog_cover_photo()
returns trigger
language plpgsql
as $$
declare
  target_dog_id uuid;
begin
  target_dog_id := coalesce(new.dog_id, old.dog_id);

  update public.dogs d
  set cover_photo_id = (
    select dp.id
    from public.dog_photos dp
    where dp.dog_id = target_dog_id
    order by
      case when dp.is_cover then 0 else 1 end,
      dp.sort_order,
      dp.created_at,
      dp.id
    limit 1
  )
  where d.id = target_dog_id;

  return null;
end;
$$;

drop trigger if exists sync_dog_cover_photo_after_write on public.dog_photos;

create trigger sync_dog_cover_photo_after_write
after insert or update of dog_id, is_cover, sort_order or delete
on public.dog_photos
for each row
execute function public.sync_dog_cover_photo();

update public.dogs d
set cover_photo_id = (
  select dp.id
  from public.dog_photos dp
  where dp.dog_id = d.id
  order by
    case when dp.is_cover then 0 else 1 end,
    dp.sort_order,
    dp.created_at,
    dp.id
  limit 1
)
where d.cover_photo_id is null;
