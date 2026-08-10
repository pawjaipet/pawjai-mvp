-- First-party launch analytics for PawJai's public adopter experience.
-- Events are written and read only by trusted server code. We intentionally
-- do not store IP addresses, user agents, or browser fingerprints.

create table if not exists public.product_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  visitor_id uuid,
  session_id uuid,
  user_id uuid references auth.users (id) on delete set null,
  dog_id uuid references public.dogs (id) on delete set null,
  appointment_id uuid references public.appointments (id) on delete set null,
  path text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint product_analytics_events_name_valid check (
    event_name in (
      'page_view',
      'dog_profile_view',
      'booking_started',
      'booking_succeeded',
      'booking_failed'
    )
  ),
  constraint product_analytics_events_path_valid check (
    length(path) between 1 and 500
    and path like '/%'
  ),
  constraint product_analytics_events_metadata_object check (
    jsonb_typeof(metadata) = 'object'
    and octet_length(metadata::text) <= 4096
  )
);

comment on table public.product_analytics_events is
  'Privacy-minimized first-party product analytics. No IP, user agent, or fingerprint data.';

create index if not exists product_analytics_events_created_idx
  on public.product_analytics_events (created_at desc);

create index if not exists product_analytics_events_name_created_idx
  on public.product_analytics_events (event_name, created_at desc);

create index if not exists product_analytics_events_dog_created_idx
  on public.product_analytics_events (dog_id, created_at desc)
  where dog_id is not null;

create index if not exists product_analytics_events_user_created_idx
  on public.product_analytics_events (user_id, created_at desc)
  where user_id is not null;

create index if not exists product_analytics_events_visitor_created_idx
  on public.product_analytics_events (visitor_id, created_at desc)
  where visitor_id is not null;

alter table public.product_analytics_events enable row level security;

-- The public Data API has no direct access. The app's server-only service-role
-- client records events and renders the PawJai-only analytics dashboard.
revoke all on table public.product_analytics_events from anon, authenticated;
grant select, insert, delete on table public.product_analytics_events to service_role;
