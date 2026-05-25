create table if not exists public.appointment_messages (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  shelter_id uuid not null references public.shelters(id) on delete cascade,
  adopter_id uuid not null references public.adopters(id) on delete cascade,
  sender_role text not null check (sender_role in ('adopter', 'shelter', 'system')),
  sender_label text,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 4000),
  attachment_url text,
  attachment_name text,
  attachment_type text,
  read_by_adopter_at timestamptz,
  read_by_shelter_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists appointment_messages_appointment_created_idx
  on public.appointment_messages (appointment_id, created_at);

create index if not exists appointment_messages_shelter_created_idx
  on public.appointment_messages (shelter_id, created_at desc);

alter table public.appointment_messages enable row level security;

drop policy if exists "Adopters can read their appointment messages" on public.appointment_messages;
create policy "Adopters can read their appointment messages"
  on public.appointment_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.appointments a
      join public.adopters ad on ad.id = a.adopter_id
      where a.id = appointment_messages.appointment_id
        and ad.profile_id = auth.uid()
    )
  );

drop policy if exists "Adopters can send appointment messages" on public.appointment_messages;
create policy "Adopters can send appointment messages"
  on public.appointment_messages
  for insert
  to authenticated
  with check (
    sender_role = 'adopter'
    and exists (
      select 1
      from public.appointments a
      join public.adopters ad on ad.id = a.adopter_id
      where a.id = appointment_messages.appointment_id
        and a.adopter_id = appointment_messages.adopter_id
        and a.shelter_id = appointment_messages.shelter_id
        and ad.profile_id = auth.uid()
    )
  );
