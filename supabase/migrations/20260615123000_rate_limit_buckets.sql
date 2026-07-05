-- Server-side rate limit buckets for sensitive Server Actions.
-- App code writes through the service-role client; public clients should not read or mutate this table.

create table if not exists public.rate_limit_buckets (
  bucket_key text primary key,
  action text not null,
  identifier_hash text not null,
  count integer not null default 1,
  reset_at timestamptz not null,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint rate_limit_buckets_count_positive check (count > 0),
  constraint rate_limit_buckets_action_not_blank check (length(btrim(action)) > 0),
  constraint rate_limit_buckets_identifier_not_blank check (length(btrim(identifier_hash)) > 0)
);

alter table public.rate_limit_buckets enable row level security;

create index if not exists rate_limit_buckets_reset_at_idx
  on public.rate_limit_buckets (reset_at);
