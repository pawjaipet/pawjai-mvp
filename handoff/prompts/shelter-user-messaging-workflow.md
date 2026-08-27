# Shelter And Adopter Messaging Workflow Prompt

## Purpose

Build the real messaging workflow for PAWJAI after the shelter/admin reorganization.

Messaging is **not ready for the shelter pilot yet**, so do not promise it to partner shelters until this prompt has been implemented and tested. The MVP should only allow messages between:

- an adopter who has booked a visit
- the shelter linked to that booked dog/appointment

PawJai admin can view message activity and thread contents for oversight, but PawJai admin must not reply, edit, delete, or impersonate either side in the first version.

## Current Context

PAWJAI has these lanes now:

- Public/adopter app:
  - `/messages`
  - `/appointments/[id]?tab=messages`
- Shelter portal:
  - `/shelter`
  - `/shelter/[slug]?view=messages`
  - shelters authenticate through Supabase Auth, with username aliases resolved by `utils/shelter-portal.ts`
- PawJai admin umbrella:
  - `/admindraft`
  - admin can see all shelters and bookings
- Shared internal booking routes:
  - `/booking/[id]`
  - `/booking/[id]/visitor-profile`
  - these must keep role-aware Back/Exit behavior through `returnTo`

Existing useful files:

- `app/messages/page.tsx`
- `components/appointments/AppointmentDetailClient.tsx`
- `app/appointments/[id]/actions.ts`
- `utils/appointment-messages.ts`
- `utils/admin-auth.ts`
- `utils/shelter-portal.ts`
- `components/admin/AdminReorgDraftPanel.tsx`
- `types/database.ts`

The adopter side already has a message surface and can insert adopter messages through `sendAppointmentMessageAction`. The shelter/admin side currently only shows connected message counts and a visual-only composer in `ShelterMessagesTab`.

## Recommendation On Third-Party Tools

Do **not** use a third-party chat platform for the MVP.

Use PAWJAI's existing Supabase database as the source of truth:

- Supabase Postgres: message rows
- Supabase Storage: optional attachments
- Resend: email notifications only
- Supabase Realtime: optional later if live chat becomes necessary

This is better for the pilot because the message rules are simple and sensitive:

- conversation exists only after a real booking
- shelter cannot message random users
- adopter cannot message unrelated shelters
- PawJai admin can read but not interact
- adopter documents and private booking context stay inside PAWJAI

Future optional integrations:

- LINE Messaging API if Thai adopters strongly prefer LINE and explicitly opt in
- Twilio Conversations or WhatsApp only if phone-based support becomes a proven need
- Intercom/Zendesk only if PAWJAI later needs support-ticket workflows, not shelter/adopter booking chat

Do not send ID documents, verification photos, house photos, or sensitive adopter profile data through a third-party chat API.

## Data Model

Reuse the existing `appointment_messages` table. Do not create a parallel message table unless the existing table is proven insufficient.

Current table shape in `types/database.ts`:

- `id`
- `appointment_id`
- `adopter_id`
- `shelter_id`
- `sender_role`: `"adopter" | "shelter" | "system"`
- `sender_label`
- `body`
- `attachment_url`
- `attachment_name`
- `attachment_type`
- `read_by_adopter_at`
- `read_by_shelter_at`
- `created_at`

Thread identity should be `appointment_id`.

The appointment already connects:

- adopter
- dog
- shelter
- booking code
- visit date/time
- booking status

Do not create free-floating shelter-to-user conversations.

## Access Rules

Every read/write path must prove access from database state, not from URL params alone.

Adopter:

- can read messages only where `appointments.adopter_id` matches their adopter profile
- can send messages only to appointments they own
- sender role must be `"adopter"`

Shelter:

- can read messages only for appointments where `appointment.shelter_id` is one of the signed-in shelter admin's `shelter_users.shelter_id` values
- can send messages only for appointments linked to their shelter
- sender role must be `"shelter"`
- route should live in the shelter lane, not old `/admin`

PawJai admin:

- can read all threads from `/admindraft`
- cannot send messages in MVP
- should see a clear read-only label in the UI
- any attempted admin send action should be impossible from UI and rejected on the server

System:

- can insert `"system"` messages only from trusted server actions if needed
- system messages should be rare and clearly labelled

## Route Design

Shelter portal:

- `/shelter/[slug]?view=messages`
  - list message threads for that shelter
- `/shelter/[slug]/messages/[appointmentId]`
  - focused conversation page if inline messaging becomes too crowded
  - Back/Exit returns to `/shelter/[slug]?view=messages`

PawJai admin:

- `/admindraft?view=messages`
  - all-shelter message overview
- `/admindraft?view=shelters&shelter={shelterId}&shelterView=messages`
  - shelter-specific message list inside the umbrella
- `/admindraft/messages/[appointmentId]`
  - optional read-only thread page
  - Back/Exit returns to the correct admin umbrella URL

Adopter:

- keep `/messages`
- keep `/appointments/[id]?tab=messages`
- adopter sees the same messages from the same `appointment_messages` rows

Shared booking pages:

- `/booking/[id]`
- `/booking/[id]/visitor-profile`
- these may link to the message thread, but must preserve `returnTo`

Important: do not redirect shelter staff to `/admindraft` from any shelter messaging path.

## Shelter Messaging UI

Inside the shelter workspace, replace the current visual-only `ShelterMessagesTab` with real data.

Conversation list should show:

- adopter name
- dog name
- booking code
- appointment date/time
- booking status
- latest message preview
- latest message timestamp
- unread badge/count for shelter
- quick filters:
  - unread
  - upcoming visits
  - needs reply
  - all
- search:
  - adopter name
  - dog name
  - booking code

Conversation detail should show:

- header with dog, adopter, booking code, visit date/time, and status
- Back/Exit button returning to the correct shelter URL
- message timeline
- sender labels: adopter, shelter, PawJai/system
- timestamps
- optional attachment preview
- shelter reply composer
- disabled/error state if messages are temporarily unavailable

The UI should match the existing PAWJAI admin/shelter visual language. Keep it operational and calm, not social-media-like.

## PawJai Admin Read-Only UI

PawJai admin should be able to:

- see message activity across all shelters
- filter by shelter
- search by dog, adopter, shelter, or booking code
- open a thread for oversight
- see the same booking context as shelter staff

PawJai admin must not see:

- a reply composer
- send button
- attachment upload button
- "mark as shelter read" behavior

Add visible copy such as:

`Read-only PawJai admin view`

## Server Actions And Data Helpers

Create shared helpers first, then wire UI.

Suggested helpers:

- `loadShelterMessageThreads({ shelterId })`
- `loadAdminMessageThreads({ shelterId?: string })`
- `loadAppointmentMessageThread({ appointmentId, context })`
- `assertCanReadAppointmentMessages({ appointmentId, context })`
- `assertCanSendAppointmentMessage({ appointmentId, context, senderRole })`

Suggested server actions:

- `sendShelterAppointmentMessageAction(formData)`
- `markShelterThreadReadAction(formData)`
- optional: `markAdopterThreadReadAction(formData)` if the adopter side does not already do it

Action behavior:

- validate current auth context with `getAdminAuthContext({ includePhraseGate: false })` for shelter routes
- validate `context.role === "shelter_admin"` for shelter sending
- validate the appointment belongs to the shelter
- insert into `appointment_messages`
- update `read_by_shelter_at` or `read_by_adopter_at` only for the correct actor
- revalidate:
  - `/shelter/[slug]`
  - `/messages`
  - `/appointments/[appointmentId]`
  - `/admindraft`

PawJai admin should not share the shelter send action.

## Attachments

Adopter attachment behavior already exists in `app/appointments/[id]/actions.ts`.

For shelter MVP, start text-only unless attachments are necessary for the pilot.

If adding shelter attachments:

- reuse the existing attachment columns
- keep max size and MIME checks strict
- prefer image-only first: JPG, PNG, WebP
- store under an `appointment-messages/{appointmentId}/...` path
- consider a dedicated bucket later if the current `dog-photos` bucket becomes semantically confusing
- never expose private verification documents through message attachments

## Notifications

MVP notification layer:

- send adopter an email through Resend when shelter replies
- send shelter an email through Resend when adopter replies, only if a shelter contact email exists and the shelter wants notifications
- email content should be minimal:
  - shelter/adopter display name
  - dog name
  - booking code
  - short message preview
  - button link back to PAWJAI

Do not include:

- ID numbers
- document links
- house photos
- full verification data
- private internal notes

Later:

- unread digest for shelter staff
- Supabase Realtime for live message updates
- LINE opt-in if the pilot proves it is worth it

## Error Handling

Reuse `isAppointmentMessagesUnavailableError` and `APPOINTMENT_MESSAGES_UNAVAILABLE_MESSAGE`.

Required behavior:

- if `appointment_messages` is unavailable, show a graceful disabled state
- do not crash the shelter portal
- keep booking and dog management usable
- log unexpected errors server-side
- do not reveal whether another shelter's appointment exists

Forbidden behavior:

- shelter route falls back to `/admindraft`
- shelter can open another shelter's thread
- PawJai admin can send a message
- adopter can message a shelter without a booking

## Tests

Add tests before or alongside implementation.

Required coverage:

- Voice shelter can see Voice message threads
- Voice shelter cannot see Rescue Dog Thailand threads
- Rescue Dog Thailand cannot see Voice threads
- shelter can send a message only for its own appointment
- adopter can send a message only for their own appointment
- PawJai admin can read all threads
- PawJai admin cannot send a message
- thread list search finds booking code, dog name, and adopter name
- unread count updates after sending and marking read
- Back/Exit from shelter thread returns to `/shelter/[slug]?view=messages`
- Back/Exit from admin thread returns to `/admindraft`
- old `/admin` is not used by the new messaging workflow

Manual checks:

- login as `thevoice` and open shelter messaging
- login as `rescuedog` and confirm empty or Rescue-only messaging
- create or use one appointment for each shelter
- send adopter -> shelter and shelter -> adopter
- confirm `/messages` and `/appointments/[id]?tab=messages` show the same thread
- confirm `/admindraft` sees both shelters read-only

Run before commit:

- `npm run typecheck`
- `npm test`
- `npm run verify` if the change touches multiple routes/actions

## Implementation Order

1. Audit current adopter messaging and appointment query helpers.
2. Create shared message loading helpers.
3. Create shelter send/read server actions with strict shelter scoping.
4. Replace the visual-only shelter `Messaging` tab with real thread data.
5. Add focused shelter thread route only if the inline tab is too crowded.
6. Add PawJai admin read-only message overview/thread view.
7. Add Resend notifications for shelter replies.
8. Add tests for cross-shelter isolation and admin read-only behavior.
9. Update the admin transfer Excel after the routes are implemented.

## Acceptance Criteria

Messaging can be considered pilot-ready only when:

- every message belongs to one appointment
- the appointment belongs to one shelter and one adopter
- shelter staff can send/read only for their shelter
- adopter can send/read only for their appointment
- PawJai admin can view but not interact
- `/shelter` never falls into `/admindraft`
- `/admindraft` never depends on old `/admin`
- messages are visible from both sides because they use the same `appointment_messages` table
- two-shelter separation has been tested with The Voice Foundation and Rescue Dog Thailand
- messaging is documented as available only after a booked visit
