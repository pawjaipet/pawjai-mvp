# Shelter Admin Messaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local draft of shelter-scoped messaging and PawJai admin read-only oversight for appointment message threads.

**Architecture:** Add a focused message-thread helper for read models and filtering, add a shelter-only server action for replies, and replace the placeholder message tab with real thread data. Keep adopter messaging, database schema, attachments, and notifications unchanged.

**Tech Stack:** Next.js 16 App Router, Server Actions, TypeScript, React 19, Supabase Postgres via existing admin/server clients, Node test runner.

---

## File Structure

- Create `utils/message-threads.ts`: pure thread shaping, search/filter helpers, Supabase read loaders.
- Create or modify `app/shelter/actions.ts`: shelter reply server action with strict shelter membership checks.
- Modify `utils/admin-draft-data.ts`: include message thread data and unavailable state in the admin draft payload.
- Modify `components/admin/AdminReorgDraftPanel.tsx`: render real shelter/admin message tabs, with composer only for shelter mode.
- Modify `tests/appointment-messages.test.mjs`: helper-level tests for thread filtering, search, unread counts, and unavailable detection.
- Modify `tests/admin-draft-route.test.mjs`: source-level route/UI assertions for read-only admin and no old `/admin` messaging path.
- Modify `tests/server-actions.test.mjs`: source-level assertions for shelter action auth checks and insert shape.

### Task 1: Message Thread Model

- [ ] Write failing tests in `tests/appointment-messages.test.mjs` for `buildAppointmentMessageThreads`, `filterAppointmentMessageThreads`, shelter isolation, admin visibility, search by booking code/dog/adopter, and unread counts.
- [ ] Run `npm test -- tests/appointment-messages.test.mjs` and confirm the new tests fail because `utils/message-threads.ts` does not exist.
- [ ] Create `utils/message-threads.ts` with thread types, pure builder/filter helpers, and Supabase loaders.
- [ ] Run `npm test -- tests/appointment-messages.test.mjs` and confirm the tests pass.

### Task 2: Shelter Reply Action

- [ ] Write failing source-level tests in `tests/server-actions.test.mjs` asserting the shelter action uses `includePhraseGate: false`, requires `context.role === "shelter_admin"`, checks `context.shelterIds.includes`, inserts `sender_role: "shelter"`, and revalidates `/messages`, `/admindraft`, and `/shelter/`.
- [ ] Run `npm test -- tests/server-actions.test.mjs` and confirm the new assertions fail.
- [ ] Add `sendShelterAppointmentMessageAction` to `app/shelter/actions.ts` using the existing Supabase admin client and appointment membership check.
- [ ] Run `npm test -- tests/server-actions.test.mjs` and confirm the tests pass.

### Task 3: Data Wiring

- [ ] Write failing source-level tests in `tests/admin-draft-route.test.mjs` asserting `loadAdminDraftData` imports and uses message-thread loaders and exposes message thread data.
- [ ] Run `npm test -- tests/admin-draft-route.test.mjs` and confirm the new assertions fail.
- [ ] Update `utils/admin-draft-data.ts` to include `messageThreads` and `messagesUnavailable` in `AdminDraftData`, scoped by `shelterIds` when present.
- [ ] Run `npm test -- tests/admin-draft-route.test.mjs` and confirm the tests pass.

### Task 4: Shelter/Admin UI

- [ ] Write failing source-level tests in `tests/admin-draft-route.test.mjs` asserting `ShelterMessagesTab` no longer links to `/admin/bookings`, renders "Read-only PawJai admin view", includes filter/search controls, and uses `sendShelterAppointmentMessageAction`.
- [ ] Run `npm test -- tests/admin-draft-route.test.mjs` and confirm the new assertions fail.
- [ ] Update `components/admin/AdminReorgDraftPanel.tsx` to pass message threads into the selected shelter workspace and render real list/detail UI.
- [ ] Run `npm test -- tests/admin-draft-route.test.mjs` and confirm the tests pass.

### Task 5: Verification

- [ ] Run `npm run typecheck`.
- [ ] Run `npm test`.
- [ ] Start `npm run dev` on an available localhost port.
- [ ] Open the shelter portal and admin draft routes locally to confirm the message tab renders without crashing.
- [ ] Leave the work uncommitted until the user confirms the draft is ready.
