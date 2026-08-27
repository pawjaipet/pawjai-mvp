-- Add privacy-minimized behavioral events for feed depth and dog interest.
-- Existing RLS and service-role-only grants on this table remain unchanged.

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
      'booking_failed'
    )
  );
