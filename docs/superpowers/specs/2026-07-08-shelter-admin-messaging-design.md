# Shelter And Admin Messaging Design

## Goal

Build a local draft of PAWJAI's real appointment-based messaging workflow so shelter staff can reply to booked adopters and PawJai admin can oversee threads read-only.

## Scope

This first shippable slice covers the existing shelter portal and admin draft workspace. It keeps the current adopter surfaces intact, uses the existing `appointment_messages` table, and treats `appointment_id` as the thread id. It does not add a third-party chat tool, new message table, shelter attachments, email notifications, or dedicated message detail routes.

## Architecture

Create a shared message-thread model that joins appointment, dog, adopter, shelter, and message rows into stable thread summaries. The model will provide shelter-scoped loading, admin-scoped loading, pure search/filter helpers, unread counts, and latest-message metadata.

Shelter writes are handled by a server action in the shelter lane. The action authenticates with `getAdminAuthContext({ includePhraseGate: false })`, requires `role === "shelter_admin"`, proves the appointment belongs to one of the signed-in shelter user's shelters, and inserts a text-only `sender_role: "shelter"` row.

PawJai admin uses the same read model but never gets a composer or send action. The UI labels the workspace as read-only for admin oversight.

## UI

Replace the placeholder `ShelterMessagesTab` with real data inside `AdminReorgDraftPanel`. The tab shows filters, search, a thread list, latest preview, unread count, appointment context, message timeline, and a reply composer only in shelter mode.

The admin draft view shows all shelter threads or a shelter-filtered subset with the same appointment context, but without send controls, attachment controls, or shelter read mutation behavior.

## Access Rules

Shelter staff can read and send only for appointments where the appointment `shelter_id` is in their `shelter_users` membership set. PawJai admin can read all threads from `/admindraft` but cannot send. Adopters continue to use existing adopter-owned appointment messaging.

Every authorization check is based on database state and authenticated context, not URL params alone.

## Error Handling

If `appointment_messages` is unavailable, the shelter/admin workspace shows a disabled state and keeps the rest of the shelter workspace usable. Unexpected errors are logged server-side. Cross-shelter misses return a generic failure and do not reveal whether another shelter's appointment exists.

## Tests

Add tests before implementation for cross-shelter isolation, admin read-only behavior, no old `/admin` messaging link, search by booking code/dog/adopter, unread updates, and source-level server action scoping. Run targeted tests, typecheck, and local dev verification before commit or push.
