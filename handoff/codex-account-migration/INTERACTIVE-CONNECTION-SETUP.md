# Interactive Company Account Connection Setup

## Short answer

The new AI does not need a password or API key to understand the PAWJAI project. It needs the repository and migration pack first. Service access can then be connected one service at a time through interactive login, approved connectors, or a company secret manager.

Never paste passwords, API keys, service-role keys, OAuth client secrets, recovery codes, or `.env.local` contents into chat or Markdown files.

## What the owner provides

- The company account email or organization identity when selecting the correct login.
- Interactive approval when a browser, CLI, dashboard, or connector asks for authentication.
- Confirmation that the login is the intended PAWJAI company account.
- Approval before any production, database, billing, DNS, or credential action.

The owner enters the password or one-time code directly into the provider's login screen. The AI should never ask the owner to type those secrets into the chat.

## Access levels by phase

### Phase 1: Context only

No service credentials are required. The AI can read:

- `AGENTS.md`
- `handoff/`
- source code, tests, documentation, and safe project assets

It can produce an understanding report and propose the new session map.

### Phase 2: Read-only verification

Connect only the service needed for the specific verification:

- GitHub: repository and branch visibility
- Vercel: project and deployment visibility
- Supabase: project/dashboard visibility
- Cloudflare: zone and DNS visibility
- Backblaze: bucket/media visibility
- Resend: domain and sending-status visibility
- Figma/Google: file or analytics visibility when required

Use the provider's interactive login or an approved Codex connector. Do not create broad permanent keys just to get started.

### Phase 3: Write or deploy access

Only after the owner explicitly approves the task should the AI request the minimum write permission needed. Production changes, database migrations, DNS changes, credential rotation, and deployments require separate confirmation.

## Environment variables and API keys

The application may need environment variables to run locally or deploy. Recreate them through the company secret manager, local secure environment setup, or provider dashboard. Do not commit them or paste them into the migration pack.

Use least privilege and rotate any credential that appeared in an old transcript, screenshot, local secrets folder, or retired personal account.

## Correct first-session behavior

1. Read the migration pack.
2. Report which access is missing.
3. Ask for interactive connection to one named service only when needed.
4. Verify the connection with a non-destructive read.
5. State exactly what was verified.
6. Ask before any write, deploy, migration, archive, or credential action.

The AI must not block project understanding just because cloud connections are not yet available.
