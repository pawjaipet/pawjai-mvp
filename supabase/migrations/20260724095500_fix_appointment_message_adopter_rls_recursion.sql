create or replace function public.is_appointment_message_adopter(
  p_adopter_id uuid,
  p_shelter_id uuid,
  p_appointment_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.appointments appointment
    join public.adopters adopter
      on adopter.id = appointment.adopter_id
    where appointment.id = p_appointment_id
      and appointment.adopter_id = p_adopter_id
      and appointment.shelter_id = p_shelter_id
      and adopter.profile_id = auth.uid()
  );
$$;

revoke all on function public.is_appointment_message_adopter(uuid, uuid, uuid) from public;
grant execute on function public.is_appointment_message_adopter(uuid, uuid, uuid) to authenticated;

drop policy if exists "Adopters can read their appointment messages" on public.appointment_messages;
create policy "Adopters can read their appointment messages"
  on public.appointment_messages
  for select
  to authenticated
  using (
    public.is_appointment_message_adopter(adopter_id, shelter_id, appointment_id)
  );

drop policy if exists "Adopters can send appointment messages" on public.appointment_messages;
create policy "Adopters can send appointment messages"
  on public.appointment_messages
  for insert
  to authenticated
  with check (
    sender_role = 'adopter'
    and public.is_appointment_message_adopter(adopter_id, shelter_id, appointment_id)
  );
