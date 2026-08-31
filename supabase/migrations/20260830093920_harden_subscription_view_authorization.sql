-- The Auth API returns current app_metadata, while an existing access-token JWT
-- can remain stale until refresh. Route entitlement writes through a service-only
-- function so failed-payment revocation takes effect immediately.

create or replace function public.record_subscription_dog_view_for_user(
  p_user_id uuid,
  p_dog_id uuid,
  p_tier text
)
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
  v_tier text := case when p_tier in ('standard', 'premium') then p_tier else 'free' end;
  v_limit integer;
  v_count integer;
  v_reset_at timestamptz;
begin
  if p_user_id is null then
    raise exception 'User is required' using errcode = '22004';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'User not found' using errcode = '23503';
  end if;

  if not exists (select 1 from public.dogs where id = p_dog_id) then
    raise exception 'Dog not found' using errcode = '23503';
  end if;

  v_limit := case v_tier
    when 'premium' then null
    when 'standard' then 100
    else 25
  end;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select count(distinct dog_id)::integer, min(viewed_at) + interval '24 hours'
    into v_count, v_reset_at
  from public.subscription_dog_views
  where user_id = p_user_id
    and viewed_at > timezone('utc', now()) - interval '24 hours';

  if exists (
    select 1 from public.subscription_dog_views
    where user_id = p_user_id
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
  values (p_user_id, p_dog_id);

  return query select true, true, v_count + 1, v_limit,
    coalesce(v_reset_at, timezone('utc', now()) + interval '24 hours');
end;
$$;

revoke all on function public.record_subscription_dog_view_for_user(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.record_subscription_dog_view_for_user(uuid, uuid, text)
  to service_role;
