create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is null and new.confirmed_at is null then
    return new;
  end if;

  insert into public.profiles (
    id,
    role,
    full_name,
    phone_number,
    profile_picture_url
  )
  values (
    new.id,
    'adopter',
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone_number', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'profile_picture_url', '')), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
