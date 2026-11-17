-- Studio-background photo experiment (studio-bg-v1).
-- Allow one new first-party event, dog_photo_exposure: a qualified exposure of
-- a dog's feed cover (image loaded, card active, visible, unobstructed for 1s).
--
-- Additive only. Every existing event name stays valid and no rows change.
-- RLS and the service-role-only grants on this table are unchanged.
-- Order: apply this migration BEFORE merging the app change that sends the
-- event. (If the app ships first, exposures are rejected in an isolated insert
-- and nothing else is lost, but the experiment collects no data.)
--
-- Rollback (after the experiment is retired):
--   delete from public.product_analytics_events where event_name = 'dog_photo_exposure';
--   then re-create the constraint without 'dog_photo_exposure'.

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
      'subscription_changed',
      'dog_photo_exposure'
    )
  );
