alter table public.ads
  add column if not exists submission_code text;

update public.ads
set submission_code = 'AD-' || upper(substr(replace(id::text, '-', ''), 1, 8))
where submission_code is null;

alter table public.ads
  alter column submission_code set not null;

create unique index if not exists ads_submission_code_key
  on public.ads (submission_code);

create table if not exists public.ad_clicks (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  destination_url text not null,
  referrer text,
  user_agent text,
  clicked_at timestamptz not null default timezone('utc', now())
);

create index if not exists ad_clicks_ad_id_clicked_at_idx
  on public.ad_clicks (ad_id, clicked_at desc);

create index if not exists ad_clicks_user_id_idx
  on public.ad_clicks (user_id)
  where user_id is not null;

alter table public.ad_clicks enable row level security;

grant select on table public.ad_clicks to authenticated;

drop policy if exists "ad_clicks_admin_select" on public.ad_clicks;
create policy "ad_clicks_admin_select"
on public.ad_clicks
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'
  )
);
