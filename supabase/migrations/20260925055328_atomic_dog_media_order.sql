create or replace function public.save_dog_media_order(p_dog_id uuid, p_items jsonb, p_traits jsonb, p_expected_manifest text)
returns void language plpgsql security invoker set search_path = '' as $$
declare current_manifest text;
begin
  perform 1 from public.dogs where id=p_dog_id for update;
  if not found then raise exception 'Dog not found'; end if;
  select trait_value into current_manifest from public.dog_traits where dog_id=p_dog_id and trait_type='media_manifest';
  if current_manifest is distinct from p_expected_manifest then
    raise exception 'Media was changed by another save. Refresh before retrying.';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_typeof(p_traits) is distinct from 'array' then
    raise exception 'Invalid media order';
  end if;
  if (select count(*) from jsonb_array_elements(p_items) i where (i->>'isCover')::boolean) <> 1 then
    raise exception 'Choose exactly one cover';
  end if;
  if exists(select 1 from jsonb_array_elements(p_items) i where i->>'type' not in ('photo','video'))
    or exists(select 1 from jsonb_array_elements(p_items) i group by i->>'id' having count(*)>1) then
    raise exception 'Invalid or duplicate media item';
  end if;
  if exists(select 1 from public.dog_photos p where p.dog_id=p_dog_id and not exists(
    select 1 from jsonb_array_elements(p_items) i where i->>'type'='photo' and i->>'id'=p.id::text))
    or exists(select 1 from jsonb_array_elements(p_items) i where i->>'type'='photo' and not exists(
      select 1 from public.dog_photos p where p.dog_id=p_dog_id and p.id::text=i->>'id')) then
    raise exception 'Photos changed. Refresh before retrying.';
  end if;
  if exists(select 1 from jsonb_to_recordset(p_traits) t(trait_type text,trait_value text)
    where trait_type is null or trait_type not in ('media_manifest','cover_video_url','cover_video_storage_path','cover_video_poster_url') or trait_value is null) then
    raise exception 'Invalid media metadata';
  end if;
  update public.dog_photos set is_cover=false where dog_id=p_dog_id and is_cover;
  update public.dog_photos p set is_cover=(i->>'isCover')::boolean,sort_order=(i->>'sortOrder')::integer
    from jsonb_array_elements(p_items) i where p.dog_id=p_dog_id and i->>'type'='photo' and p.id::text=i->>'id';
  delete from public.dog_traits where dog_id=p_dog_id and trait_type in ('media_manifest','cover_video_url','cover_video_storage_path','cover_video_poster_url');
  insert into public.dog_traits(dog_id,trait_type,trait_value)
    select p_dog_id,trait_type,trait_value from jsonb_to_recordset(p_traits) t(trait_type text,trait_value text);
end;
$$;
revoke all on function public.save_dog_media_order(uuid,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.save_dog_media_order(uuid,jsonb,jsonb,text) to service_role;
