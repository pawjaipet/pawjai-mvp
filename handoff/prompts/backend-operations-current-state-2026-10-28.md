# PAWJAI Backend Operations Handoff — 2026-10-28

## Session merge

This handoff preserves the backend/operations umbrella from `BACKEND related` and the completed/current messaging work from `MESSAGES`.

Source task IDs:

- `BACKEND related` — `019e4dee-6a91-7912-8b45-4fabf0a5369b`
- `MESSAGES` — `019f41e3-c3ce-7b11-a644-402737ce3a2e`

## Responsibility

Booking, rescheduling, accept/deny decisions, appointment detail synchronization, appointment messaging, return inquiries, private message attachments, dog import/intake, media upload reliability, adopter preference filtering, and backend dog-feed matching.

## Messaging evidence to preserve

- Shelter messaging pipeline shipped with shelter-scoped reply behavior and admin read-only overview.
- Attachment work covers adopter/shelter flows, private storage expectations, file validation, and route scoping.
- Messaging commits referenced in the source task include `678b32a`, `540c299`, and `67cc539`; verify them against current `git log` before citing as deployed.
- `handoff/prompts/fix-private-appointment-message-attachments.md` and `handoff/prompts/shelter-user-messaging-workflow.md` are relevant focused prompts.
- `handoff/sessions/2026-10-24-guest-discovery-exports.md` records that unrelated shelter-message edits were deliberately preserved in the worktree.

## Backend boundary

- Use `utils/supabase/server.ts` for server components/actions, `client.ts` for client components, and `admin.ts` only for service-role work.
- Do not apply migrations merely because they exist locally. Verify remote migration state first.
- Keep public dog media on `media.pawjaipet.com`; keep private adopter/document/appointment files private and signed.
- Keep donation schema, auth/email, and finance in their dedicated lanes.

## Fresh-session kickoff prompt

Read `AGENTS.md`, `handoff/HANDOFF.md`, this file, the messaging and attachment prompts, and the latest shelter isolation/save reliability sessions. Inspect `git status`, current migrations, message actions, booking actions, and route guards. Separate committed/deployed behavior from local dirty changes before editing. Run focused tests first; do not overwrite unrelated work.
