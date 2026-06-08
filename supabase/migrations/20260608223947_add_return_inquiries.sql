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
        and ad.profile_id = auth.uid()
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
        and ad.profile_id = auth.uid()
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
      where actor.id = auth.uid()
        and actor.role = 'admin'
    )
    or exists (
      select 1
      from public.shelter_users su
      where su.shelter_id = return_inquiries.shelter_id
        and su.profile_id = auth.uid()
        and su.role in ('owner', 'staff')
    )
  );
