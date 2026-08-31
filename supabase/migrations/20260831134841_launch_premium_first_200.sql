-- PawJai launch promotion: the first 200 adopter accounts keep Premium access.
-- Paid subscription state remains separate so billing can be enabled later
-- without replacing or revoking a founding-user grant.

create table if not exists public.subscription_launch_grants (
  user_id uuid primary key references auth.users (id) on delete cascade,
  campaign text not null default 'founding_200'
    check (campaign = 'founding_200'),
  grant_number smallint not null unique
    check (grant_number between 1 and 200),
  tier text not null default 'premium'
    check (tier = 'premium'),
  granted_at timestamptz not null default timezone('utc', now())
);

comment on table public.subscription_launch_grants is
  'Permanent Premium grants for the first 200 PawJai adopter accounts. Service-role only.';

alter table public.subscription_launch_grants enable row level security;
revoke all on table public.subscription_launch_grants from anon, authenticated;
grant select, insert, update, delete on table public.subscription_launch_grants to service_role;

-- Existing adopter accounts are the beginning of the founding cohort. Shelter
-- and PawJai admin auth users are excluded because they have no adopter row.
with ranked_adopters as (
  select
    adopters.profile_id as user_id,
    row_number() over (order by users.created_at, users.id)::smallint as grant_number
  from public.adopters as adopters
  join auth.users as users on users.id = adopters.profile_id
)
insert into public.subscription_launch_grants (user_id, grant_number)
select user_id, grant_number
from ranked_adopters
where grant_number <= 200
on conflict do nothing;

-- Trusted app metadata makes the common entitlement read free of an extra
-- database query. The grant table remains authoritative if a session is stale.
update auth.users as users
set raw_app_meta_data = coalesce(users.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'pawjai_launch_premium', true,
    'pawjai_launch_premium_number', grants.grant_number
  )
from public.subscription_launch_grants as grants
where users.id = grants.user_id;

create or replace function public.ensure_launch_premium_grant_for_user(
  p_user_id uuid
)
returns table (
  granted boolean,
  grant_number smallint
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_grant_number smallint;
  v_next_grant_number smallint;
begin
  if p_user_id is null then
    raise exception 'User is required' using errcode = '22004';
  end if;

  -- Only public adopter accounts can consume one of the 200 grants.
  if not exists (
    select 1
    from public.adopters
    where profile_id = p_user_id
  ) then
    return query select false, null::smallint;
    return;
  end if;

  select grants.grant_number
    into v_grant_number
  from public.subscription_launch_grants as grants
  where grants.user_id = p_user_id;

  if v_grant_number is not null then
    return query select true, v_grant_number;
    return;
  end if;

  -- Serialize the final open slots so concurrent signups cannot both claim the
  -- same number or take the cohort past 200.
  perform pg_advisory_xact_lock(hashtextextended('pawjai:founding-200', 0));

  select grants.grant_number
    into v_grant_number
  from public.subscription_launch_grants as grants
  where grants.user_id = p_user_id;

  if v_grant_number is not null then
    return query select true, v_grant_number;
    return;
  end if;

  select max(grants.grant_number)
    into v_next_grant_number
  from public.subscription_launch_grants as grants;

  if coalesce(v_next_grant_number, 0) >= 200 then
    return query select false, null::smallint;
    return;
  end if;

  v_next_grant_number := (coalesce(v_next_grant_number, 0) + 1)::smallint;

  insert into public.subscription_launch_grants (user_id, grant_number)
  values (p_user_id, v_next_grant_number);

  return query select true, v_next_grant_number;
end;
$$;

revoke all on function public.ensure_launch_premium_grant_for_user(uuid)
  from public, anon, authenticated;
grant execute on function public.ensure_launch_premium_grant_for_user(uuid)
  to service_role;
