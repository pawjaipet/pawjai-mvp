# Claude Code Prompt: Shelter Booking Availability Architecture

You are working in the PAWJAI repo. Build the next scheduling pass so every dog visit date/time is generated from shelter-specific data, not hard-coded UI state.

## Context

PAWJAI is a Thai dog adoption platform. Users create profiles, submit verification documents, choose a dog, then book a shelter visit. Admins use `/admin/bookings` to review bookings, scan QR check-ins, view visitor profiles, and manage the selected shelter.

Current useful tables:

- `shelters`: source of truth for shelter profile, contact, address, website, and future meeting instructions.
- `shelter_availability`: existing date range table with `availability_type` of `available` or `unavailable`.
- `appointments`: visit bookings with `shelter_id`, `dog_id`, `adopter_id`, date, time, status, booking code, and QR/check-in data.
- `dogs`: each dog has a shelter relationship.

Current admin UI:

- `/admin/bookings` has shelter tabs.
- The selected shelter tab shows a shelter profile editor for meeting/contact info.
- The selected shelter tab shows blockout date management using `shelter_availability`.

## Goal

Make the user booking calendar and appointment detail pages database-backed:

1. The “Meeting at” card should display the selected dog shelter’s real name, address, and maps link.
2. The “Shelter contact” card should display the selected dog shelter’s phone and email.
3. The “available/unavailable” calendar should derive disabled dates from each shelter’s schedule, holidays, and blockout dates.
4. The available time chips should derive from shelter working hours and existing bookings.

## Recommended Schema Additions

Keep `shelter_availability` for date ranges, but add explicit operating-hour tables:

```sql
create table public.shelter_regular_hours (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  slot_duration_minutes int not null default 60,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shelter_id, day_of_week)
);

alter table public.shelters
add column if not exists google_maps_url text,
add column if not exists meeting_instructions text;
```

Use `shelter_availability` for one-off closures and overrides:

- `availability_type = 'unavailable'`: holiday, staff training, closed day, fully blocked date range.
- `availability_type = 'available'`: special opening day override, if needed later.

## Availability Rules

For a given dog and month:

1. Find the dog’s `shelter_id`.
2. Load the shelter profile from `shelters`.
3. Load regular hours from `shelter_regular_hours`.
4. Load date ranges from `shelter_availability`.
5. Mark a calendar date unavailable when:
   - the weekday is closed in `shelter_regular_hours`;
   - the date falls inside an `unavailable` range;
   - the date is in the past;
   - every generated slot is already taken by active appointments.
6. Generate time slots from `opens_at`, `closes_at`, and `slot_duration_minutes`.
7. Remove slots already used by appointments with active statuses such as `requested` and `confirmed`.

## Security Requirements

- Public/user-facing pages can read shelter profile and availability data.
- Shelter profile and availability writes must stay admin-only for now.
- Service-role Supabase clients must stay server-only.
- Do not expose passwords, auth tokens, service keys, or private admin metadata in any user-facing route.
- Future shelter accounts should only see and edit rows scoped to their own `shelter_id`; PAWJAI admins can see all shelters.

## UI Requirements

Admin:

- Keep `/admin/bookings` as the whole-picture admin view.
- Keep shelter tabs as the scope selector.
- For each shelter tab, show:
  - shelter profile/contact editor;
  - address/meeting preview;
  - blockout date list;
  - current client bookings for that shelter.

User:

- On dog booking pages, show unavailable days clearly.
- Show selected day and available time chips only when the shelter has actual open slots.
- On appointment detail pages, show `Meeting at`, `Dog information`, `Shelter contact`, and the QR code from real booking/shelter data.

## Acceptance Criteria

- Changing The Voice Foundation’s address/phone/email in `/admin/bookings` updates the user appointment detail data source.
- Adding a blockout date in `/admin/bookings` prevents that date from being selectable for that shelter’s dogs.
- Another shelter can later be added without code changes to the booking calendar logic.
- Existing appointments still display correctly and QR check-in still opens the admin booking detail page.
- TypeScript, build, and a browser smoke test pass.
