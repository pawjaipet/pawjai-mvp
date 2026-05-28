create table if not exists public.pawjai_profile (
  id text primary key default 'default' check (id = 'default'),
  hero_slogan text not null default 'Connecting Thai dogs with loving homes',
  mission_title text not null default 'Our Mission',
  mission_body text not null default 'Thailand is home to an estimated 3.5 million stray dogs. PawJai was built to change that — one adoption at a time. We partner with shelters across the country to make the adoption process joyful, transparent, and accessible to everyone.',
  partner_shelters jsonb not null default '[
    {"name":"Soi Dog Foundation","detail":"Phuket · 1,600+ dogs","logo_url":null},
    {"name":"Ban Rak Nong Shelter","detail":"Bangkok · 200+ dogs","logo_url":null},
    {"name":"Happy Paws Bangkok","detail":"Bangkok · 120+ dogs","logo_url":null},
    {"name":"Chiang Mai Dog Rescue","detail":"Chiang Mai · 80+ dogs","logo_url":null}
  ]'::jsonb,
  contact_items jsonb not null default '[
    {"type":"email","label":"hello@pawjai.co.th","href":"mailto:hello@pawjai.co.th"},
    {"type":"social","label":"@pawjai.official","href":null},
    {"type":"website","label":"pawjai.co.th","href":"https://pawjai.co.th"}
  ]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.pawjai_profile (id)
values ('default')
on conflict (id) do nothing;

alter table public.pawjai_profile enable row level security;

drop policy if exists "pawjai_profile_public_select" on public.pawjai_profile;
create policy "pawjai_profile_public_select"
on public.pawjai_profile
for select
to public
using (true);

drop policy if exists "pawjai_profile_admin_write" on public.pawjai_profile;
create policy "pawjai_profile_admin_write"
on public.pawjai_profile
for all
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

drop trigger if exists set_pawjai_profile_updated_at on public.pawjai_profile;
create trigger set_pawjai_profile_updated_at
before update on public.pawjai_profile
for each row execute function public.set_updated_at();
