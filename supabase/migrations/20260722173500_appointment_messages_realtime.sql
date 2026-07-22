drop policy if exists "Shelter staff can read appointment messages" on public.appointment_messages;
create policy "Shelter staff can read appointment messages"
  on public.appointment_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      where actor.id = auth.uid()
        and actor.role = 'admin'
    )
    or exists (
      select 1
      from public.shelter_users su
      where su.shelter_id = appointment_messages.shelter_id
        and su.profile_id = auth.uid()
        and su.role in ('owner', 'staff')
    )
  );

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  )
  and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'appointment_messages'
  ) then
    alter publication supabase_realtime add table public.appointment_messages;
  end if;
end $$;
