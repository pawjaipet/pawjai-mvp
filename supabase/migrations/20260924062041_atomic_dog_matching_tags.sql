-- Only the authorized server action may replace tags. The transaction preserves
-- the previous set if insertion or audit recording fails.
create or replace function public.replace_dog_matching_tags(
  p_dog_id uuid, p_shelter_id uuid, p_actor_id uuid,
  p_actor_role public.app_role, p_traits jsonb
) returns void language plpgsql security invoker set search_path = '' as $$
declare
  editable text[] := array['localized_name_th','protectiveness','affection_style',
    'training_preference_match','people_friendliness','dog_social_style',
    'intake_note','personality','medical_needs'];
  previous jsonb;
begin
  perform 1 from public.dogs where id=p_dog_id and shelter_id=p_shelter_id for update;
  if not found then raise exception 'Dog does not belong to this shelter'; end if;
  if p_actor_role is null or p_actor_role not in ('admin','shelter_admin') then
    raise exception 'Staff role required';
  end if;
  if p_actor_role='shelter_admin' and not exists (
    select 1 from public.shelter_users where shelter_id=p_shelter_id
      and profile_id=p_actor_id and role in ('owner','staff')
  ) then raise exception 'Shelter access denied'; end if;
  if p_traits is null or jsonb_typeof(p_traits) <> 'array' then
    raise exception 'Tags must be an array';
  end if;
  if exists(select 1 from jsonb_to_recordset(p_traits) as t(trait_type text,trait_value text)
    where trait_type is null or not (trait_type=any(editable))
      or trait_value is null or length(trim(trait_value))=0) then
    raise exception 'Invalid matching tag';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('trait_type',trait_type,'trait_value',trait_value)), '[]'::jsonb)
    into previous from public.dog_traits where dog_id=p_dog_id and trait_type=any(editable);
  delete from public.dog_traits where dog_id=p_dog_id and trait_type=any(editable);
  insert into public.dog_traits(dog_id,trait_type,trait_value)
    select p_dog_id,trait_type,trait_value
    from jsonb_to_recordset(p_traits) as t(trait_type text,trait_value text);
  insert into public.admin_audit_events(actor_profile_id,actor_role,action,target_table,target_id,shelter_id,metadata)
    values(p_actor_id,p_actor_role,'dog.matching_tags.replace','dogs',p_dog_id::text,p_shelter_id,
      jsonb_build_object('before',previous,'after',p_traits));
end;
$$;
revoke all on function public.replace_dog_matching_tags(uuid,uuid,uuid,public.app_role,jsonb) from public,anon,authenticated;
grant execute on function public.replace_dog_matching_tags(uuid,uuid,uuid,public.app_role,jsonb) to service_role;
