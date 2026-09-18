-- Enforce identity and tenant boundaries even when a client bypasses the portal.
-- Avoid the adopter -> booking -> adopter policy recursion.
create or replace function private.can_read_adopter(target_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.adopters a where a.id=target_id and a.profile_id=(select auth.uid()))
    or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin')
    or exists(select 1 from public.appointments a join public.shelter_users su on su.shelter_id=a.shelter_id
      where a.adopter_id=target_id and su.profile_id=(select auth.uid()) and su.role in ('owner','staff'))
    or exists(select 1 from public.applications a join public.shelter_users su on su.shelter_id=a.shelter_id
      where a.adopter_id=target_id and su.profile_id=(select auth.uid()) and su.role in ('owner','staff'));
$$;
revoke all on function private.can_read_adopter(uuid) from public, anon;
grant execute on function private.can_read_adopter(uuid) to authenticated;
drop policy if exists adopters_owner_related_shelter_or_admin_select on public.adopters;
create policy adopters_owner_related_shelter_or_admin_select on public.adopters for select to authenticated
using (private.can_read_adopter(id));

create or replace function private.guard_portal_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_table_name = 'profiles' then
      if (tg_op = 'INSERT' and new.role <> 'adopter') or
         (tg_op = 'UPDATE' and (new.role is distinct from old.role or new.id is distinct from old.id)) then
        raise exception 'Account roles can only be managed by PawJai' using errcode = '42501';
      end if;
    elsif tg_table_name = 'shelter_portal_accounts' and new.profile_id is distinct from old.profile_id then
      raise exception 'Portal account ownership cannot be changed' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger guard_portal_profile_identity before insert or update on public.profiles
for each row execute function private.guard_portal_identity();
create trigger guard_portal_account_identity before update on public.shelter_portal_accounts
for each row execute function private.guard_portal_identity();

create or replace function private.guard_shelter_record_links()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name in ('appointments', 'donation_intents') then
    if new.dog_id is not null and not exists (
      select 1 from public.dogs d where d.id = new.dog_id and d.shelter_id = new.shelter_id
    ) then
      raise exception 'Dog and shelter must belong together' using errcode = '23514';
    end if;
  elsif tg_table_name = 'appointment_messages' then
    if not exists (select 1 from public.appointments a where a.id = new.appointment_id
      and a.shelter_id = new.shelter_id and a.adopter_id = new.adopter_id) then
      raise exception 'Message must belong to the booking shelter and adopter' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_shelter_record_links() from public, anon, authenticated;
create trigger guard_booking_shelter_links before insert or update of dog_id,shelter_id on public.appointments
for each row execute function private.guard_shelter_record_links();
create trigger guard_donation_shelter_links before insert or update of dog_id,shelter_id on public.donation_intents
for each row execute function private.guard_shelter_record_links();
create trigger guard_message_shelter_links before insert or update of appointment_id,shelter_id,adopter_id on public.appointment_messages
for each row execute function private.guard_shelter_record_links();

create or replace function private.guard_client_tenant_reassignment()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and (
    new.shelter_id is distinct from old.shelter_id or
    (tg_table_name = 'appointments' and (
      to_jsonb(new)->>'adopter_id' is distinct from to_jsonb(old)->>'adopter_id' or
      to_jsonb(new)->>'dog_id' is distinct from to_jsonb(old)->>'dog_id'
    ))
  ) then
    raise exception 'Record ownership cannot be changed from a client' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger guard_dog_tenant_reassignment before update on public.dogs
for each row execute function private.guard_client_tenant_reassignment();
create trigger guard_booking_tenant_reassignment before update on public.appointments
for each row execute function private.guard_client_tenant_reassignment();

drop policy if exists dogs_public_select on public.dogs;
create policy dogs_public_select on public.dogs for select to anon, authenticated using (
  adoption_status <> 'draft'
  or exists (select 1 from public.shelter_users su where su.shelter_id = dogs.shelter_id and su.profile_id = (select auth.uid()))
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);
drop policy if exists dog_photos_public_select on public.dog_photos;
create policy dog_photos_public_select on public.dog_photos for select to anon, authenticated using (
  exists (select 1 from public.dogs d where d.id = dog_photos.dog_id)
);
drop policy if exists dog_traits_public_select on public.dog_traits;
create policy dog_traits_public_select on public.dog_traits for select to anon, authenticated using (
  exists (select 1 from public.dogs d where d.id = dog_traits.dog_id)
);

create index if not exists dogs_shelter_updated_idx on public.dogs (shelter_id, updated_at desc);
create index if not exists appointments_shelter_date_idx on public.appointments (shelter_id, appointment_date);
create index if not exists donations_shelter_created_idx on public.donation_intents (shelter_id, created_at desc);
