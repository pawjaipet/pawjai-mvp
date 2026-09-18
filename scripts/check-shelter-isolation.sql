-- All fixtures and test writes are rolled back. Safe to repeat on the linked DB.
begin;
set local statement_timeout = '30s';
create temp table portal_qa (shelter_id uuid, actor_id uuid, dog_id uuid, booking_id uuid, donation_id uuid, message_id uuid);
create temp table portal_qa_results (shelter_id uuid, checks integer);
grant select on portal_qa to authenticated;
do $$
declare s record; dog uuid; booking uuid; donation uuid; message uuid; adopter uuid; donor uuid;
begin
  select a.id,a.profile_id into adopter,donor from public.adopters a
    where not exists(select 1 from public.shelter_users su where su.profile_id=a.profile_id) limit 1;
  if adopter is null then raise exception 'Need one adopter for isolated booking fixtures'; end if;
  for s in select distinct on(su.shelter_id) su.shelter_id,su.profile_id
    from public.shelter_users su join public.profiles p on p.id=su.profile_id
    where p.role='shelter_admin' and su.role in ('owner','staff') order by su.shelter_id,su.profile_id
  loop
    insert into public.dogs(shelter_id,name,adoption_status) values(s.shelter_id,'ISOLATION QA rollback only','draft') returning id into dog;
    insert into public.appointments(shelter_id,dog_id,adopter_id,appointment_date,appointment_time,status)
      values(s.shelter_id,dog,adopter,'2099-01-01','01:23','cancelled') returning id into booking;
    insert into public.donation_intents(user_id,dog_id,shelter_id,treat_count,amount_thb)
      values(donor,dog,s.shelter_id,1,10) returning id into donation;
    insert into public.appointment_messages(appointment_id,shelter_id,adopter_id,sender_role,body)
      values(booking,s.shelter_id,adopter,'shelter','ISOLATION QA rollback only') returning id into message;
    insert into portal_qa values(s.shelter_id,s.profile_id,dog,booking,donation,message);
  end loop;
end $$;
do $$
declare actor record; other record; n integer; checks integer;
begin
  for actor in select * from portal_qa loop
    checks := 0;
    perform set_config('request.jwt.claim.sub',actor.actor_id::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',actor.actor_id,'role','authenticated')::text,true);
    set local role authenticated;
    select count(*) into n from public.dogs where id=actor.dog_id;
    if n<>1 then raise exception 'Own draft unavailable'; end if; checks:=checks+1;
    select count(*) into n from public.appointments where id=actor.booking_id;
    if n<>1 then raise exception 'Own booking unavailable'; end if; checks:=checks+1;
    select count(*) into n from public.donation_intents where id=actor.donation_id;
    if n<>1 then raise exception 'Own donation unavailable'; end if; checks:=checks+1;
    select count(*) into n from public.appointment_messages where id=actor.message_id;
    if n<>1 then raise exception 'Own message unavailable'; end if; checks:=checks+1;
    update public.dogs set name='Own edit allowed' where id=actor.dog_id;
    get diagnostics n = row_count;
    if n<>1 then raise exception 'Own dog edit rejected'; end if; checks:=checks+1;
    begin
      update public.profiles set role='admin' where id=actor.actor_id;
      raise exception 'Privilege escalation allowed';
    exception when insufficient_privilege then checks:=checks+1;
    end;
    for other in select * from portal_qa where shelter_id<>actor.shelter_id loop
      select count(*) into n from public.dogs where id=other.dog_id;
      if n<>0 then raise exception 'Other draft leaked'; end if; checks:=checks+1;
      select count(*) into n from public.appointments where id=other.booking_id;
      if n<>0 then raise exception 'Other booking leaked'; end if; checks:=checks+1;
      select count(*) into n from public.donation_intents where id=other.donation_id;
      if n<>0 then raise exception 'Other donation leaked'; end if; checks:=checks+1;
      select count(*) into n from public.appointment_messages where id=other.message_id;
      if n<>0 then raise exception 'Other message leaked'; end if; checks:=checks+1;
      update public.dogs set name='Forbidden edit' where id=other.dog_id;
      get diagnostics n = row_count;
      if n<>0 then raise exception 'Other dog editable'; end if; checks:=checks+1;
      update public.appointments set shelter_note='Forbidden edit' where id=other.booking_id;
      get diagnostics n = row_count;
      if n<>0 then raise exception 'Other booking editable'; end if; checks:=checks+1;
      update public.shelters set bank_account_name='Forbidden edit' where id=other.shelter_id;
      get diagnostics n = row_count;
      if n<>0 then raise exception 'Other bank details editable'; end if; checks:=checks+1;
      delete from public.dogs where id=other.dog_id;
      get diagnostics n = row_count;
      if n<>0 then raise exception 'Other dog deletable'; end if; checks:=checks+1;
    end loop;
    reset role;
    for other in select * from portal_qa where shelter_id<>actor.shelter_id loop
      begin
        update public.appointments set dog_id=other.dog_id where id=actor.booking_id;
        raise exception 'Mismatched booking allowed';
      exception when check_violation then checks:=checks+1; end;
      begin
        update public.donation_intents set dog_id=other.dog_id where id=actor.donation_id;
        raise exception 'Mismatched donation allowed';
      exception when check_violation then checks:=checks+1; end;
      begin
        update public.appointment_messages set shelter_id=other.shelter_id where id=actor.message_id;
        raise exception 'Mismatched message allowed';
      exception when check_violation then checks:=checks+1; end;
    end loop;
    insert into portal_qa_results values(actor.shelter_id,checks);
  end loop;
end $$;
select count(*) as shelters_tested, sum(checks) as checks_passed, 'all fixtures rolled back' as cleanup from portal_qa_results;
rollback;
