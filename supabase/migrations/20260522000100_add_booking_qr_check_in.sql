alter table public.appointments
  add column if not exists booking_code text,
  add column if not exists check_in_token_hash text,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by text,
  add column if not exists check_in_note text;

update public.appointments
set booking_code = 'APT-' || upper(left(replace(id::text, '-', ''), 5))
where booking_code is null;

alter table public.appointments
  alter column booking_code set not null;

create unique index if not exists appointments_booking_code_unique_idx
  on public.appointments (booking_code);

create unique index if not exists appointments_check_in_token_hash_unique_idx
  on public.appointments (check_in_token_hash)
  where check_in_token_hash is not null;

create unique index if not exists appointments_active_slot_unique_idx
  on public.appointments (shelter_id, appointment_date, appointment_time)
  where status not in ('cancelled', 'no_show');
