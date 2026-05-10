alter table public.ads
  alter column start_date set not null,
  alter column end_date set not null;

create index if not exists ads_live_window_idx
  on public.ads (is_active, start_date, end_date)
  where is_active = true;
