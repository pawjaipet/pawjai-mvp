-- Remove historical personality duplicates using the same normalized key as the UI.
with ranked_personality_traits as (
  select
    id,
    row_number() over (
      partition by dog_id, lower(regexp_replace(btrim(trait_value), E'\\s+', ' ', 'g'))
      order by created_at, id
    ) as duplicate_rank
  from public.dog_traits
  where trait_type = 'personality'
)
delete from public.dog_traits traits
using ranked_personality_traits ranked
where traits.id = ranked.id
  and ranked.duplicate_rank > 1;

create unique index if not exists dog_traits_one_normalized_personality_per_dog_idx
  on public.dog_traits (
    dog_id,
    lower(regexp_replace(btrim(trait_value), E'\\s+', ' ', 'g'))
  )
  where trait_type = 'personality';

alter table public.donation_intents
  add column if not exists proof_bucket_id text,
  add column if not exists proof_storage_path text,
  add column if not exists proof_mime_type text,
  add column if not exists proof_original_file_name text,
  add column if not exists proof_submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null,
  add column if not exists shelter_note text,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.donation_intents
  drop constraint if exists donation_intents_status_valid;

alter table public.donation_intents
  add constraint donation_intents_status_valid
  check (status in ('initiated', 'viewed_qr', 'proof_submitted', 'verified', 'rejected'));

alter table public.donation_intents
  drop constraint if exists donation_intents_proof_required_for_review;

alter table public.donation_intents
  add constraint donation_intents_proof_required_for_review
  check (
    status not in ('proof_submitted', 'verified', 'rejected')
    or proof_storage_path is not null
  );

create index if not exists donation_intents_shelter_status_created_idx
  on public.donation_intents (shelter_id, status, created_at desc);

drop trigger if exists set_donation_intents_updated_at on public.donation_intents;
create trigger set_donation_intents_updated_at
before update on public.donation_intents
for each row execute function public.set_updated_at();

drop policy if exists "donation_intents_shelter_or_admin_select" on public.donation_intents;
create policy "donation_intents_shelter_or_admin_select"
on public.donation_intents
for select
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
    from public.shelter_users membership
    where membership.shelter_id = donation_intents.shelter_id
      and membership.profile_id = (select auth.uid())
      and membership.role in ('owner', 'staff')
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'donation-slips',
  'donation-slips',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
