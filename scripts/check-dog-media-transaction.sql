-- Execute inside BEGIN/ROLLBACK together with the migration.
do $$
declare dog uuid; shelter uuid; a uuid; b uuid; items jsonb; metadata jsonb; original text;
begin
  select id into shelter from public.shelters limit 1;
  insert into public.dogs(shelter_id,name,adoption_status) values(shelter,'Media rollback test','draft') returning id into dog;
  insert into public.dog_photos(dog_id,public_url,is_cover,sort_order,storage_path) values(dog,'https://example.invalid/a.jpg',true,0,'test/a') returning id into a;
  insert into public.dog_photos(dog_id,public_url,is_cover,sort_order,storage_path) values(dog,'https://example.invalid/b.jpg',false,1,'test/b') returning id into b;
  items:=jsonb_build_array(jsonb_build_object('id',a,'type','photo','isCover',false,'sortOrder',1),jsonb_build_object('id',b,'type','photo','isCover',true,'sortOrder',0));
  metadata:=jsonb_build_array(jsonb_build_object('trait_type','media_manifest','trait_value',jsonb_build_object('items',items)::text));
  perform public.save_dog_media_order(dog,items,metadata,null);
  if not exists(select 1 from public.dog_photos where id=b and is_cover and sort_order=0) then raise exception 'Cover not saved'; end if;
  select trait_value into original from public.dog_traits where dog_id=dog and trait_type='media_manifest';
  begin
    perform public.save_dog_media_order(dog,items,metadata,null);
    raise exception 'Stale save allowed' using errcode='22000';
  exception when raise_exception then null;
  end;
  items:=jsonb_build_array(jsonb_build_object('id',a,'type','photo','isCover',true,'sortOrder',0),jsonb_build_object('id',b,'type','photo','isCover',false,'sortOrder',1));
  begin
    perform public.save_dog_media_order(dog,items,metadata||metadata,original);
    raise exception 'Expected metadata insert failure';
  exception when unique_violation then null;
  end;
  if not exists(select 1 from public.dog_photos where id=b and is_cover and sort_order=0)
    or not exists(select 1 from public.dog_traits where dog_id=dog and trait_value=original) then
    raise exception 'Failed save changed original cover or metadata';
  end if;
  if has_function_privilege('authenticated','public.save_dog_media_order(uuid,jsonb,jsonb,text)','EXECUTE') then
    raise exception 'Client can call privileged media function';
  end if;
end $$;
select 'Cover transaction, stale save, failure rollback and access checks passed' as result;
