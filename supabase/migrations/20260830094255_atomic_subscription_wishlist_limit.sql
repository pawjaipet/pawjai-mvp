create or replace function public.toggle_subscription_wishlist_for_user(
  p_user_id uuid,
  p_adopter_id uuid,
  p_dog_id uuid,
  p_tier text
)
returns table (
  saved boolean,
  limit_reached boolean,
  wishlist_count integer,
  wishlist_limit integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_limit integer := case
    when p_tier = 'premium' then null
    when p_tier = 'standard' then 20
    else 5
  end;
  v_count integer;
begin
  if not exists (
    select 1 from public.adopters
    where id = p_adopter_id and profile_id = p_user_id
  ) then
    raise exception 'Adopter does not belong to user' using errcode = '42501';
  end if;

  if not exists (select 1 from public.dogs where id = p_dog_id) then
    raise exception 'Dog not found' using errcode = '23503';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 1));

  if exists (
    select 1 from public.wishlists
    where adopter_id = p_adopter_id and dog_id = p_dog_id
  ) then
    delete from public.wishlists
    where adopter_id = p_adopter_id and dog_id = p_dog_id;
    select count(*)::integer into v_count
    from public.wishlists where adopter_id = p_adopter_id;
    return query select false, false, v_count, v_limit;
    return;
  end if;

  select count(*)::integer into v_count
  from public.wishlists where adopter_id = p_adopter_id;

  if v_limit is not null and v_count >= v_limit then
    return query select false, true, v_count, v_limit;
    return;
  end if;

  insert into public.wishlists (adopter_id, dog_id)
  values (p_adopter_id, p_dog_id);
  return query select true, false, v_count + 1, v_limit;
end;
$$;

revoke all on function public.toggle_subscription_wishlist_for_user(uuid, uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.toggle_subscription_wishlist_for_user(uuid, uuid, uuid, text)
  to service_role;
