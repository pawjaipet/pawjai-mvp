alter table public.appointments
  add column if not exists proposed_appointment_date date,
  add column if not exists proposed_appointment_time time,
  add column if not exists reschedule_requested_by text,
  add column if not exists reschedule_note text;

alter table public.appointments
  drop constraint if exists appointments_reschedule_requested_by_check;

alter table public.appointments
  add constraint appointments_reschedule_requested_by_check
  check (
    reschedule_requested_by is null
    or reschedule_requested_by in ('shelter', 'adopter')
  );

create index if not exists appointments_reschedule_requested_idx
  on public.appointments (shelter_id, proposed_appointment_date)
  where proposed_appointment_date is not null;

alter table public.adopter_preferences
  add column if not exists filter_answers jsonb not null default '{}'::jsonb,
  add column if not exists filter_summary text;
