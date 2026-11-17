# Session Merge Ledger Snapshot

The full historical ledger is `handoff/codex-session-merge-ledger.md`. This snapshot makes the final responsibility map obvious during an account migration.

| Survivor | Merged or archived sources | Why |
|---|---|---|
| `Admin and shelter portal architecture` | `Plan admin reorg`, `shelter portal` continuation | Same HQ/shelter roles, listings, bookings, and scoped workflows |
| `BACKEND related` | `MESSAGES`, booking/dog intake/filter backend work | Operational backend boundary for appointments, messages, imports, and matching |
| `Auth and email automation` | `OAUTH n Emails`, `RESEND automation email`, business email setup | Auth and transactional email are connected, while mailbox routing remains distinct |
| `Production, audit, and launch readiness` | launch review and production safety work | Shared readiness, security, SEO, and go/no-go decisions |
| `Analytics and measurement` | website tracking and auth analytics | Shared event taxonomy, consent, and funnel measurement |
| `UX/UI User Frontend` | adopter profile migration, old UX/UI frontend, frontend connection task | Same adopter-facing design and frontend continuity |
| `Domain, DNS, and media infrastructure` | `Migrate to new domain`, `Cloudflare CDN for Backblaze` | One infrastructure boundary for domain, CDN, origin media, and deployment host |

The merge process preserved context in dated prompts and the ledger before archive actions. No source code was deleted by this session-map work.
