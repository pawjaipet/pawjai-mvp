create table if not exists public.donation_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dog_id uuid not null references public.dogs (id) on delete cascade,
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  treat_count integer not null,
  amount_thb integer not null,
  status text not null default 'initiated',
  created_at timestamptz not null default timezone('utc', now()),
  constraint donation_intents_treat_count_positive check (treat_count > 0),
  constraint donation_intents_amount_thb_positive check (amount_thb > 0),
  constraint donation_intents_status_valid check (status in ('initiated', 'viewed_qr'))
);

create index if not exists donation_intents_user_id_idx
  on public.donation_intents (user_id);

create index if not exists donation_intents_dog_id_idx
  on public.donation_intents (dog_id);

create index if not exists donation_intents_shelter_id_idx
  on public.donation_intents (shelter_id);

create index if not exists donation_intents_created_at_desc_idx
  on public.donation_intents (created_at desc);

alter table public.donation_intents enable row level security;

grant select, insert on table public.donation_intents to authenticated;

drop policy if exists "donation_intents_owner_insert" on public.donation_intents;
create policy "donation_intents_owner_insert"
on public.donation_intents
for insert
to authenticated
with check (
  user_id = (select auth.uid())
);

drop policy if exists "donation_intents_owner_select" on public.donation_intents;
create policy "donation_intents_owner_select"
on public.donation_intents
for select
to authenticated
using (
  user_id = (select auth.uid())
);
