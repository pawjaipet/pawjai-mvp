# PAWJAI Migration Manifest

Audited: 2026-11-13
Root: `/Users/sudlabha/Desktop/paw`

## Safe project payload

These are the materials the company account should receive through company-controlled source storage or an approved secure file transfer:

| Path | Purpose | Approx. size |
|---|---|---:|
| `AGENTS.md` and `agents.md` | Agent instructions and current project rules | small |
| `app/` | Next.js routes and server actions | 1.1 MB |
| `components/` | UI and domain components | 860 KB |
| `lib/`, `utils/`, `types/` | Shared logic, Supabase helpers, generated types | 520 KB |
| `supabase/` | Migrations and database support files | 348 KB |
| `scripts/` | Import, media, and email utilities | 84 KB |
| `tests/` | Regression and integration tests | 384 KB |
| `docs/` | Architecture, privacy, and reliability notes | 180 KB |
| `public/`, `data/` | Static assets and local data | 100 KB |
| `handoff/` | Historical context, session exports, brand, finance, and migration pack | 33 MB |
| `Corporate Identity/` | Original brand assets and references | 68 MB |
| `outputs/` | Analytics workbooks, screenshots, and reports | 15 MB |
| `pawjaidogs/`, `pawjaiads/` | Local dog/ad media and related assets | 91 MB plus empty ads folder |
| `package.json`, lockfile, config files | Reproducible project setup | small |

The source repository currently contains approximately 502 tracked files, 151 handoff files, 414 source/test files, and 876 output/snapshot/asset files based on the audit command. Counts change as work continues.

The untracked `app/doglistings/review-preview/` prototype is part of the latest admin/shelter session and must be included in the migration backup even though it is not currently committed.

## Copy only after review

- `pawjai snapshots/` is a 374 MB historical backup collection. Keep it as an encrypted company backup, but inspect archives before uploading; old snapshots may contain stale environment values.
- `tmp/` is approximately 71 MB and may contain generated recordings, test artifacts, or sensitive intermediate files. Copy only named items that are needed.
- `tmp-recordings/` is approximately 37 MB and may contain user or product recordings. Review privacy and retention before transfer.
- `.codex-artifacts/` may contain local task artifacts. Copy only if a specific handoff needs them.

## Never copy wholesale

- `.env.local`
- `pawjai related secrets/`
- `.claude/`
- `.vercel/`
- `.codex-auth-profile-smoke.png`
- `.next/`, `node_modules/`, `.npm-cache/`, and build caches
- `.DS_Store` files

Use a company password manager or approved secret manager for credentials, recovery codes, and tokens. Rotate credentials before retiring the personal account.

## Current uncommitted work

The worktree is dirty. The following tracked files have local modifications and must not be lost during the move:

```text
agents.md
app/auth/actions.ts
app/documents/page.tsx
app/layout.tsx
components/admin/AdminReorgDraftPanel.tsx
components/auth/AuthForm.tsx
components/documents/DocumentsPageClient.tsx
components/trust/TrustLinks.tsx
handoff/codex-session-merge-ledger.md
tests/message-launch-readiness.test.mjs
tests/seo.test.mjs
tests/shelter-portal-route-safety.test.mjs
utils/google-analytics.ts
utils/seo.ts
```

There are also untracked application, handoff, reliability, brand, and temporary paths. Do not reset, clean, or discard them during migration. Review and commit or archive them deliberately from the current checkout.

## Cloud-only items not represented by files

- Codex task transcripts and task metadata
- OpenAI account, billing, workspace, and seat configuration
- GitHub, Vercel, Supabase, Cloudflare, Backblaze, Resend, registrar, Google, and Figma ownership/permissions
- Local-folder approvals and MCP/connector authorizations

The history snapshot and runbooks document these items, but only the service dashboards and account migration flow can transfer or reauthorize them.
