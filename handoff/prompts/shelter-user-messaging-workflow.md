# Shelter And Adopter Messaging Workflow Prompt

## Context

PAWJAI is moving from the old `/admin` workspace into `/admindraft`, with the long-term goal of giving each partner shelter its own workspace. Shelter staff should be able to manage their shelter profile, dog listings, booking visits, and messages without seeing other shelters. PawJai admins should still see the full umbrella across every shelter.

The adopter side already has a `Messages` surface tied to appointments. The database already has `appointment_messages`, with each message linked to:

- `appointment_id`
- `shelter_id`
- `adopter_id`
- `sender_role`: `adopter`, `shelter`, or `system`
- body and optional attachment metadata
- read timestamps for adopter and shelter

The admin draft currently has a visual-only shelter `Messaging` tab. This prompt is for building the real messaging workflow between shelter employees and adopters.

## Goal

Build a draft-native messaging workflow inside `/admindraft` so shelter admins can:

1. See message threads for their own shelter only.
2. Open conversations by booking, adopter, dog, and shelter.
3. Reply to adopters from the shelter workspace.
4. See unread counts in the shelter workspace tab/card.
5. Mark messages as read for shelter staff.
6. Keep PawJai admins able to view messages across all shelters when using the umbrella view.

The first production version can be simple. It does not need brand chat accounts or public brand logins.

## Existing Data Model To Reuse

Use the existing `appointment_messages` table first. Do not create a parallel messaging table unless the existing table is insufficient.

Required behavior:

- Adopter messages insert with `sender_role = "adopter"`.
- Shelter replies insert with `sender_role = "shelter"`.
- System messages, if needed, insert with `sender_role = "system"`.
- Every query must scope by `shelter_id` for shelter admins.
- PawJai admins can query all shelters.
- Threads should be grouped by appointment because appointments already connect adopter, dog, shelter, and visit status.

## Admin Draft UX

Inside `/admindraft`, shelter view should show:

- Conversation list
  - adopter name
  - dog name
  - booking code
  - appointment date/time
  - latest message preview
  - unread indicator
  - booking status
- Conversation detail
  - timeline of messages
  - sender label
  - timestamp
  - booking context panel
  - reply box
  - send button

Keep it operational and close to the current admin styling. Avoid building a separate social-chat style app.

## Suggested Routes

- `/admindraft?shelter={shelterId}&view=messages`
  - messaging list inside the shelter workspace
- `/admindraft/messages/{appointmentId}`
  - optional focused conversation page if the inline tab becomes crowded

If possible, start inline in the shelter workspace and add the focused page only if needed.

## Server Actions

Create draft-native server actions, or shared actions in a neutral folder, for:

- `sendShelterAppointmentMessageAction`
- `markShelterThreadReadAction`

These should:

- call `requireShelterAccess(shelterId, "/admindraft?...")`
- validate the appointment belongs to the shelter
- insert into `appointment_messages`
- revalidate `/admindraft`
- revalidate `/messages`
- revalidate `/appointments/{appointmentId}`

Do not rely on the temporary phrase gate for real shelter access. Real shelter access must come from Supabase Auth + `profiles` + `shelter_users`.

## Third-Party API Considerations

Start with in-app Supabase messaging. Add third-party messaging only if it improves staff response speed or adopter notifications.

Possible future integrations:

- Resend email notification when a shelter replies.
- LINE Messaging API for Thailand-friendly notifications if adopters opt in.
- Twilio or WhatsApp only if phone-based messaging becomes a clear requirement.

Do not send private adopter documents or IDs through a third-party chat API. Keep sensitive content inside PAWJAI.

## Notification Rules

First version:

- In-app unread badges.
- Optional email notification to adopter when shelter replies.

Later:

- Shelter email notification when adopter replies.
- LINE notification opt-in.
- Message digest for shelter staff.

## Security Requirements

- Shelter admins can only read and send messages for appointments tied to their `shelter_users.shelter_id`.
- PawJai admins can see all.
- Adopters can only read and send messages for appointments linked to their adopter profile.
- Never expose service-role Supabase keys in client components.
- File attachments should use an existing private/public storage policy appropriate to the attachment type.

## Acceptance Checklist

- Shelter staff can open `/admindraft` and see only their shelter's message threads.
- PawJai admin can see message activity across shelters.
- Shelter can send a reply and adopter sees it in `/messages` and appointment detail.
- Adopter can reply and shelter sees it in `/admindraft`.
- Unread count updates in shelter workspace.
- Message queries are scoped and tested with at least two shelters: The Voice Foundation and Rescue Dog Thailand.
- No redirects to old `/admin` messaging.

## Testing Plan

Use two shelters:

- The Voice Foundation
- Rescue Dog Thailand

Create or use one shelter admin account per shelter. Confirm:

- Voice admin cannot see Rescue Dog Thailand messages.
- Rescue Dog Thailand admin cannot see Voice messages.
- PawJai admin can see both.
- Message send/read works from both sides.

