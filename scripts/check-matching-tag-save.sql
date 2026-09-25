-- Run inside a transaction; the runner below rolls back all test records.
do $$
declare s record; dog uuid; before_rows jsonb; after_rows jsonb; n integer;
begin
  select shelter_id,profile_id into s from public.shelter_users where role in ('owner','staff') limit 1;
  insert into public.dogs(shelter_id,name,adoption_status) values(s.shelter_id,'Matching tags rollback test','draft') returning id into dog;
  insert into public.dog_traits(dog_id,trait_type,trait_value) values(dog,'personality','Original'),(dog,'media_manifest','{"items":[]}');
  perform public.replace_dog_matching_tags(dog,s.shelter_id,s.profile_id,'shelter_admin',
    '[{"trait_type":"personality","trait_value":"Playful"},{"trait_type":"training_preference_match","trait_value":"Dogs still in training"}]');
  select count(*) into n from public.dog_traits where dog_id=dog;
  if n<>3 then raise exception 'Tag replacement or media preservation failed'; end if;
  if not exists(select 1 from public.admin_audit_events where target_id=dog::text
    and metadata->'before' @> '[{"trait_type":"personality","trait_value":"Original"}]') then
    raise exception 'Previous values not recoverable in audit';
  end if;
  select jsonb_agg(to_jsonb(t) order by id) into before_rows from public.dog_traits t where dog_id=dog;
  begin
    perform public.replace_dog_matching_tags(dog,s.shelter_id,s.profile_id,'shelter_admin',
      '[{"trait_type":"personality","trait_value":"Duplicate"},{"trait_type":"personality","trait_value":"Duplicate"}]');
    raise exception 'Expected insertion failure';
  exception when unique_violation then null;
  end;
  select jsonb_agg(to_jsonb(t) order by id) into after_rows from public.dog_traits t where dog_id=dog;
  if before_rows is distinct from after_rows then raise exception 'Failure destroyed old tags'; end if;
  if has_function_privilege('authenticated','public.replace_dog_matching_tags(uuid,uuid,uuid,public.app_role,jsonb)','EXECUTE')
    or has_function_privilege('anon','public.replace_dog_matching_tags(uuid,uuid,uuid,public.app_role,jsonb)','EXECUTE') then
    raise exception 'Client can bypass server authorization';
  end if;
end $$;
select 'Matching tag save, rollback, audit and client denial checks passed' as result;
