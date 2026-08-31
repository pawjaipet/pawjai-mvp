-- PawJai subscription billing and enforceable entitlements.
-- Billing/provider records are service-role only. The dog-view ledger is
-- user-scoped and the rolling limit is enforced atomically by Postgres.

create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  provider text not null default 'stripe' check (provider = 'stripe'),
  provider_customer_id text unique,
  provider_subscription_id text unique,
  provider_price_id text,
  tier text not null default 'free' check (tier in ('free', 'standard', 'premium')),
  status text not null default 'none' check (
    status in ('none', 'incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')
  ),
  cancel_at_period_end boolean not null default false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  last_payment_at timestamptz,
  last_payment_failed_at timestamptz,
  latest_invoice_id text,
  last_provider_event_created_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.billing_subscriptions is
  'Server-only Stripe subscription projection. Effective authorization tier remains auth.users app_metadata.pawjai_subscription_tier.';

alter table public.billing_subscriptions enable row level security;
revoke all on table public.billing_subscriptions from anon, authenticated;
grant select, insert, update, delete on table public.billing_subscriptions to service_role;

create table if not exists public.subscription_audit_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  previous_tier text check (previous_tier is null or previous_tier in ('free', 'standard', 'premium')),
  new_tier text check (new_tier is null or new_tier in ('free', 'standard', 'premium')),
  subscription_status text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists subscription_audit_events_user_created_idx
  on public.subscription_audit_events (user_id, created_at desc)
  where user_id is not null;

alter table public.subscription_audit_events enable row level security;
revoke all on table public.subscription_audit_events from anon, authenticated;
grant select, insert on table public.subscription_audit_events to service_role;

create table if not exists public.subscription_dog_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dog_id uuid not null references public.dogs (id) on delete cascade,
  viewed_at timestamptz not null default timezone('utc', now())
);

create index if not exists subscription_dog_views_user_window_idx
  on public.subscription_dog_views (user_id, viewed_at desc);
create index if not exists subscription_dog_views_user_dog_window_idx
  on public.subscription_dog_views (user_id, dog_id, viewed_at desc);

alter table public.subscription_dog_views enable row level security;
revoke all on table public.subscription_dog_views from anon, authenticated;
grant select, insert on table public.subscription_dog_views to authenticated;
grant select, insert, delete on table public.subscription_dog_views to service_role;

create policy "subscription_dog_views_owner_select"
  on public.subscription_dog_views
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "subscription_dog_views_owner_insert"
  on public.subscription_dog_views
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and viewed_at between timezone('utc', now()) - interval '1 minute'
      and timezone('utc', now()) + interval '1 minute'
  );

create or replace function public.record_subscription_dog_view(p_dog_id uuid)
returns table (
  allowed boolean,
  was_new boolean,
  unique_views integer,
  view_limit integer,
  next_reset_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_tier text := coalesce(auth.jwt() -> 'app_metadata' ->> 'pawjai_subscription_tier', 'free');
  v_limit integer;
  v_count integer;
  v_reset_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (select 1 from public.dogs where id = p_dog_id) then
    raise exception 'Dog not found' using errcode = '23503';
  end if;

  v_limit := case v_tier
    when 'premium' then null
    when 'standard' then 100
    else 25
  end;

  -- Serialize limit decisions per user so concurrent tabs cannot overspend.
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select count(distinct dog_id)::integer, min(viewed_at) + interval '24 hours'
    into v_count, v_reset_at
  from public.subscription_dog_views
  where user_id = v_user_id
    and viewed_at > timezone('utc', now()) - interval '24 hours';

  if exists (
    select 1 from public.subscription_dog_views
    where user_id = v_user_id
      and dog_id = p_dog_id
      and viewed_at > timezone('utc', now()) - interval '24 hours'
  ) then
    return query select true, false, v_count, v_limit, v_reset_at;
    return;
  end if;

  if v_limit is not null and v_count >= v_limit then
    return query select false, false, v_count, v_limit, v_reset_at;
    return;
  end if;

  insert into public.subscription_dog_views (user_id, dog_id)
  values (v_user_id, p_dog_id);

  return query select true, true, v_count + 1, v_limit,
    coalesce(v_reset_at, timezone('utc', now()) + interval '24 hours');
end;
$$;

revoke all on function public.record_subscription_dog_view(uuid) from public, anon;
grant execute on function public.record_subscription_dog_view(uuid) to authenticated;

alter table public.appointments
  add column if not exists subscription_tier_at_booking text not null default 'free'
    check (subscription_tier_at_booking in ('free', 'standard', 'premium')),
  add column if not exists priority_visit boolean not null default false;

create index if not exists appointments_shelter_priority_visit_idx
  on public.appointments (shelter_id, appointment_date, priority_visit desc, appointment_time);

alter table public.product_analytics_events
  drop constraint if exists product_analytics_events_name_valid;
alter table public.product_analytics_events
  add constraint product_analytics_events_name_valid check (
    event_name in (
      'page_view',
      'dog_profile_view',
      'dog_feed_impression',
      'dog_shared',
      'feed_session_summary',
      'booking_started',
      'booking_succeeded',
      'booking_failed',
      'subscription_limit_prompt',
      'subscription_changed'
    )
  );
