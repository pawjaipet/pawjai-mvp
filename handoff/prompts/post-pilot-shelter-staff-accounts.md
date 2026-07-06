# Post-Pilot Shelter Staff Accounts Prompt

## Context

PAWJAI is piloting shelter access with one shared username/password per shelter:

- The Voice Foundation: `thevoice`
- Rescue Dog Thailand: `rescuedog`

This is intentionally simple for the first shelter onboarding period. After the pilot, PAWJAI should move to individual employee accounts so every founder, manager, and staff member has their own login under the correct shelter.

## Goal

Replace shared shelter logins with a real shelter staff account system that keeps the shelter workspace simple while improving accountability, access control, and security.

## Target Account Model

Use the existing Supabase Auth + `profiles` + `shelter_users` model:

- `profiles.role = "shelter_admin"` for shelter workspace users.
- `shelter_users.profile_id` links each staff account to one or more shelters.
- `shelter_users.role` controls shelter-level permissions.

Recommended shelter roles:

- `owner`: founder or shelter manager. Can edit shelter profile, create/edit dog listings, manage bookings, invite/remove staff, and see messages.
- `staff`: day-to-day employee. Can create/edit dog listings, manage bookings, and reply to messages.
- `viewer`: read-only staff or volunteer. Can view dog listings and bookings but cannot save changes.

## UX Requirements

PawJai admin should be able to:

1. Open a partner shelter.
2. View all staff linked to that shelter.
3. Invite/create a staff account.
4. Choose role: owner, staff, viewer.
5. Reset a staff password.
6. Remove a staff member from the shelter without deleting their adopter profile or unrelated account data.

Shelter owner should eventually be able to:

1. See their own staff list.
2. Invite employees to their shelter.
3. Remove employees who leave.
4. Reset shared operational access if needed.

Staff should:

1. Log in with their own email/password.
2. Land directly in their shelter workspace.
3. Never see other shelters unless explicitly linked by PawJai admin.

## Migration From Shared Pilot Login

1. Keep the shared pilot accounts active during transition.
2. Create individual accounts for each shelter founder/manager.
3. Give founders `owner` role.
4. Ask founders to add employees or provide employee emails.
5. After all active employees have individual logins, disable the shared pilot account.
6. Keep an emergency PawJai admin override account for support.

## Audit And Safety

When implementing, make sure important shelter actions record who performed the change:

- dog profile created
- dog profile edited
- dog photo uploaded/deleted/reordered
- adoption status changed
- booking accepted/denied/rescheduled/completed/no-showed
- shelter profile edited
- staff account invited/removed

Use the existing admin audit pattern where possible.

## Acceptance Checklist

- PawJai admin can create/link a staff account to a shelter.
- Shelter staff login lands directly on `/admindraft?shelter={id}` in locked shelter mode.
- A Voice Foundation staff account cannot see Rescue Dog Thailand data.
- A Rescue Dog Thailand staff account cannot see Voice Foundation data.
- PawJai admin can still see all shelters.
- Removing a staff member immediately blocks shelter workspace access.
- Shared pilot login can be disabled after the transition.
