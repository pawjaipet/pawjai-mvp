alter table public.ads
  add column if not exists media_type text not null default 'image';

alter table public.ads
  drop constraint if exists ads_media_type_check;

alter table public.ads
  add constraint ads_media_type_check
  check (media_type in ('image', 'video'));

create index if not exists ads_media_type_idx
  on public.ads (media_type);
