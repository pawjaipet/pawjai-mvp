alter table public.ads
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists ad_status text not null default 'approved';

alter table public.ads
  drop constraint if exists ads_ad_status_check;

alter table public.ads
  add constraint ads_ad_status_check
  check (ad_status in ('pending', 'approved', 'denied'));

update public.ads
set ad_status = 'approved'
where ad_status is null;

create index if not exists ads_review_status_idx
  on public.ads (ad_status, is_active, start_date, end_date);
