# Services and Connections

This file describes responsibilities only. Credentials and secret values stay in local environment configuration and must never be copied into a handoff.

| Service | PAWJAI use | Safe recovery note |
|---|---|---|
| Supabase | Postgres, Auth, Storage, RLS, migrations | Project ref is documented in `AGENTS.md`; use the CLI/linking workflow and verify remote state |
| Vercel | Production hosting and deploys from `main` | Confirm project/domain binding before changing DNS |
| Cloudflare | DNS and CDN for media | Media host is `media.pawjaipet.com`; preserve cache and origin assumptions |
| Backblaze B2 | Dog/ad media origin bucket | App keys and bucket permissions are sensitive; never record them here |
| Resend | Transactional email | Keep sending identities separate from human mailbox routing |
| Google/GA4 | Measurement and OAuth-related product flows | Analytics IDs may exist in dated evidence; do not add credentials or tokens |
| GitHub | Source control and deployment trigger | Preserve account/org ownership and branch protections during migration |

For exact environment variable names, read `handoff/HANDOFF.md` and local `.env.local` only on the authorized machine. Do not paste values into Codex messages or commit them.
