# PAWJAI Auth and Email Handoff — 2026-10-28

## Session merge

This handoff combines:

- `OAUTH n Emails` — `019dbcc6-ddee-7412-8342-514b4db59c66`
- `RESEND automation email` — `019e6667-d4f1-7993-adf6-a0619464a349`
- `Set up Pawjai business email` — `019fb714-d958-7e82-8b3d-a69c598b1162`

## Responsibility

Adopter account creation, email/password login, Google OAuth branding, auth callbacks, verification, booking-related emails, Resend transactional sending, Cloudflare Email Routing, and future Google Workspace planning.

## Current facts

- Canonical public domain: `https://www.pawjaipet.com`.
- Supabase project: `bdnyvcvkyepipdcygkvn`.
- Resend remains the app transactional email provider.
- Cloudflare Email Routing is the current free human-email setup; it is forwarding, not separate mailboxes.
- Google Workspace is a future paid option, not the current mailbox provider.
- `handoff/playbooks` and existing Google OAuth/email prompts are the source for exact DNS and redirect guidance.

## Safety

- Never paste, copy, or preserve API keys, passwords, tokens, or 2FA codes in handoff files.
- Treat old task summaries containing secrets as contaminated context; do not repeat them.
- Verify Vercel env values and Google authorized origins in the dashboard before claiming production readiness.

## Fresh-session kickoff prompt

Read `AGENTS.md`, `handoff/HANDOFF.md`, `handoff/playbooks/google-oauth-branding.md`, `handoff/playbooks/free-business-email-cloudflare-routing.md`, and this file. Inspect current auth routes/components and `lib/resend.ts`. Report deployed versus local state. Do not change DNS, OAuth, email sender, or auth callbacks without verifying the current production configuration first.
