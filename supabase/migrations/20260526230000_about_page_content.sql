-- site_settings: key-value store for editable page content
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- anyone can read settings
create policy "public read site_settings"
  on public.site_settings for select
  using (true);

-- only shelter admins / service role can write
create policy "admin write site_settings"
  on public.site_settings for all
  using (
    exists (
      select 1 from public.shelter_profiles sp
      where sp.user_id = auth.uid()
    )
  );

-- partner_shelters: editable list shown on about page
create table if not exists public.partner_shelters (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  province    text not null,
  dog_count   text not null default '0 dogs',
  logo_url    text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.partner_shelters enable row level security;

create policy "public read partner_shelters"
  on public.partner_shelters for select
  using (true);

create policy "admin write partner_shelters"
  on public.partner_shelters for all
  using (
    exists (
      select 1 from public.shelter_profiles sp
      where sp.user_id = auth.uid()
    )
  );

-- seed site_settings
insert into public.site_settings (key, value) values
(
  'mission',
  '"Thailand is home to an estimated 3.5 million stray dogs. PawJai was built to change that — one adoption at a time. We partner with shelters across the country to make the adoption process joyful, transparent, and accessible to everyone."'::jsonb
),
(
  'how_it_works',
  '[
    {"step":"1","icon":"🔍","title":"Browse & Match","desc":"Swipe through profiles of dogs waiting for homes. Our smart matching learns your preferences over time."},
    {"step":"2","icon":"📅","title":"Book a Visit","desc":"Schedule a meet-and-greet at the shelter at a time that suits you. No adoption pressure — just a friendly visit."},
    {"step":"3","icon":"🏠","title":"Adopt & Celebrate","desc":"Complete the adoption paperwork with the shelter and bring your new companion home!"}
  ]'::jsonb
),
(
  'contact',
  '[
    {"icon":"✉️","label":"hello@pawjai.co.th","type":"email"},
    {"icon":"📱","label":"@pawjai.official","type":"social"},
    {"icon":"🌐","label":"pawjai.co.th","type":"web"}
  ]'::jsonb
)
on conflict (key) do nothing;

-- seed partner_shelters
insert into public.partner_shelters (name, province, dog_count, sort_order) values
  ('Soi Dog Foundation',    'Phuket',     '1,600+ dogs', 1),
  ('Ban Rak Nong Shelter',  'Bangkok',    '200+ dogs',   2),
  ('Happy Paws Bangkok',    'Bangkok',    '120+ dogs',   3),
  ('Chiang Mai Dog Rescue', 'Chiang Mai', '80+ dogs',    4)
on conflict do nothing;
