create table if not exists public.return_inquiries (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  adopter_id uuid not null references public.adopters(id) on delete cascade,
  dog_id uuid references public.dogs(id) on delete set null,
  shelter_id uuid not null references public.shelters(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists return_inquiries_one_per_appointment_adopter_idx
  on public.return_inquiries (appointment_id, adopter_id);

create index if not exists return_inquiries_shelter_created_idx
  on public.return_inquiries (shelter_id, created_at desc);

create index if not exists return_inquiries_adopter_created_idx
  on public.return_inquiries (adopter_id, created_at desc);

alter table public.return_inquiries enable row level security;

drop policy if exists "Adopters can read their return inquiries" on public.return_inquiries;
create policy "Adopters can read their return inquiries"
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
  );

drop policy if exists "Adopters can create return inquiries" on public.return_inquiries;
create policy "Adopters can create return inquiries"
  on public.return_inquiries
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.appointments a
      join public.adopters ad
        on ad.id = a.adopter_id
      where a.id = return_inquiries.appointment_id
        and a.adopter_id = return_inquiries.adopter_id
        and a.shelter_id = return_inquiries.shelter_id
        and (
          a.dog_id = return_inquiries.dog_id
          or (a.dog_id is null and return_inquiries.dog_id is null)
        )
        and ad.profile_id = (select auth.uid())
    )
  );

drop policy if exists "Shelter staff can read return inquiries" on public.return_inquiries;
create policy "Shelter staff can read return inquiries"
  on public.return_inquiries
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
      from public.shelter_users su
      where su.shelter_id = return_inquiries.shelter_id
        and su.profile_id = (select auth.uid())
        and su.role in ('owner', 'staff')
    )
  );

alter table public.appointment_messages
  add column if not exists attachment_storage_path text;

update public.appointment_messages
set attachment_storage_path = regexp_replace(
  split_part(
    attachment_url,
    '/storage/v1/object/public/appointment-message-attachments/',
    2
  ),
  '\?.*$',
  ''
)
where attachment_storage_path is null
  and attachment_url like '%/storage/v1/object/public/appointment-message-attachments/%';

create index if not exists appointment_messages_attachment_storage_path_idx
  on public.appointment_messages (attachment_storage_path)
  where attachment_storage_path is not null;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'appointment-message-attachments',
  'appointment-message-attachments',
  false,
  209715200,
  array[
    'application/pdf',
    'image/heic',
    'image/heif',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime'
  ]::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create schema if not exists private;

create or replace function private.is_appointment_message_adopter(
  p_adopter_id uuid,
  p_shelter_id uuid,
  p_appointment_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.appointments appointment
    join public.adopters adopter
      on adopter.id = appointment.adopter_id
    where appointment.id = p_appointment_id
      and appointment.adopter_id = p_adopter_id
      and appointment.shelter_id = p_shelter_id
      and adopter.profile_id = (select auth.uid())
  );
$$;

revoke all on function public.is_appointment_message_adopter(uuid, uuid, uuid) from public;
revoke all on function public.is_appointment_message_adopter(uuid, uuid, uuid) from anon;
revoke all on function public.is_appointment_message_adopter(uuid, uuid, uuid) from authenticated;

revoke all on function private.is_appointment_message_adopter(uuid, uuid, uuid) from public;
revoke all on function private.is_appointment_message_adopter(uuid, uuid, uuid) from anon;
grant usage on schema private to authenticated;
grant execute on function private.is_appointment_message_adopter(uuid, uuid, uuid) to authenticated;

drop policy if exists "Adopters can read their appointment messages" on public.appointment_messages;
create policy "Adopters can read their appointment messages"
  on public.appointment_messages
  for select
  to authenticated
  using (
    (select private.is_appointment_message_adopter(adopter_id, shelter_id, appointment_id))
  );

drop policy if exists "Adopters can send appointment messages" on public.appointment_messages;
create policy "Adopters can send appointment messages"
  on public.appointment_messages
  for insert
  to authenticated
  with check (
    sender_role = 'adopter'
    and (select private.is_appointment_message_adopter(adopter_id, shelter_id, appointment_id))
  );
