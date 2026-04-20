# PAWJAI — Agent & MCP Connector Reference

This file documents all MCP servers and AI agent tools wired into the PAWJAI project (Thai dog adoption & matching platform). Use this as the source of truth for what each connector can do and when to call it.

---

## MCP Servers

### 1. Figma — Design Source
**Server:** `plugin:design:figma` / `mcp__Figma__*`

The canonical source for all UI design. The PAWJAI Figma Make file contains 23 screens, 34 shadcn/ui primitives, and 538 image assets.

**File key:** `cfYww0U2M4xAkvHv3Gbvss`
**Figma URL:** `https://www.figma.com/make/cfYww0U2M4xAkvHv3Gbvss/PAWJAI-Currently`

| Tool | When to use |
|------|-------------|
| `get_design_context` | Primary tool — fetch code + screenshot for any node. Pass `fileKey` + `nodeId`. |
| `get_screenshot` | Get a visual screenshot of a specific node without full code context. |
| `get_metadata` | Get structural overview (layer names, IDs, positions). Never use on Make files. |
| `get_variable_defs` | Fetch design tokens (colors, spacing, typography) from the file. |
| `get_code_connect_map` | Check which Figma components are mapped to codebase components. |
| `add_code_connect_map` | Register a new Figma ↔ codebase component mapping. |
| `create_design_system_rules` | Generate design system rules from the Figma file. |

**Screens available (by nodeId — fetch via get_metadata to resolve):**

| Screen | Description |
|--------|-------------|
| SignUp | Sign-up form |
| RegisterAccount | Account registration |
| VerificationA–D | 4-step identity verification |
| DocumentVerificationA–D | 4-step document upload flow |
| DocumentReminderPopup | Missing documents reminder |
| Questionnaire1–3 | Adopter questionnaire (3 pages) |
| Homepage | Main home screen |
| DogsScrolling | Scrollable dog browse listing |
| DogProfilePage / DogProfile | Dog detail page (2 variants) |
| FilterPage | Search & filter |
| SchedulePage / SelectedSchedule | Appointment scheduling |
| AppointmentsPage | User's appointments list |
| MessagesPage / ChatThreadPage | Messaging & chat |
| ProfileDashboard | User account dashboard |
| SubscriptionPage | Subscription / pricing |
| MorePage / AboutUsPage | Settings & info |
| NavigationMenu / BottomNavBar | Nav components |
| AdminTestPage | Admin panel |

---

### 2. Supabase — Backend & Database
**Server:** `mcp__96b59bab-9681-4ba9-97d1-24bbaec99e22__*`

PAWJAI's backend runs entirely on Supabase: PostgreSQL DB, Row Level Security, Edge Functions, and Storage.

**Database migrations (apply in order):**
1. `001_core_schema.sql` — tables
2. `002_rls_policies.sql` — RLS policies
3. `003_storage_setup.sql` — storage buckets
4. `004_views_and_queries.sql` — views & queries
5. `005_seed_data.sql` — seed data

**Edge Functions:**
- `server/index.tsx` — main entry
- `server/database.tsx` — DB operations
- `server/kv_store.tsx` — key-value store
- `server/routes-admin.tsx` — admin API routes
- `server/routes-adopters.tsx` — adopter API routes

| Tool | When to use |
|------|-------------|
| `list_projects` | See all Supabase projects linked to the account |
| `get_project` | Get project details (ID, region, status) |
| `get_project_url` | Get the project's API URL |
| `get_publishable_keys` | Get anon/public keys for client config |
| `execute_sql` | Run SQL queries directly against the DB |
| `apply_migration` | Apply a new SQL migration |
| `list_migrations` | List all applied migrations |
| `list_tables` | Inspect DB tables and schema |
| `generate_typescript_types` | Generate TypeScript types from the DB schema |
| `deploy_edge_function` | Deploy or update an Edge Function |
| `get_edge_function` | Inspect a deployed Edge Function |
| `list_edge_functions` | List all deployed functions |
| `get_logs` | Fetch logs (DB, edge functions, etc.) |
| `get_advisors` | Get performance and security advisors |
| `list_extensions` | List enabled PostgreSQL extensions |
| `create_branch` / `list_branches` | Manage DB preview branches |
| `merge_branch` / `rebase_branch` / `reset_branch` / `delete_branch` | Branch lifecycle |
| `pause_project` / `restore_project` | Project compute management |
| `list_organizations` / `get_organization` | Org-level access |
| `get_cost` / `confirm_cost` | Review and confirm costs before paid actions |
| `search_docs` | Search Supabase documentation |

---

## Agent Workflows

### Design → Code
1. Open screen in Figma, copy the node ID from the URL (`?node-id=X-Y` → `X:Y`)
2. Call `get_design_context(fileKey, nodeId)` → get reference React+Tailwind code + screenshot
3. Adapt the output to this project's stack (React, Tailwind, shadcn/ui)
4. Reuse existing components before generating new ones

### DB Schema Changes
1. Write the SQL migration
2. Call `apply_migration` with the SQL
3. Call `generate_typescript_types` to update types
4. Update relevant Edge Functions if routes changed

### New Feature End-to-End
1. Get design from Figma (`get_design_context`)
2. Implement frontend component
3. Wire to Supabase via existing client utils (`utils/supabase/client.tsx`)
4. If new DB table/column needed: `apply_migration` → `generate_typescript_types`
5. If new API route needed: update Edge Function → `deploy_edge_function`

---

## Project Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase Edge Functions (Deno) |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Design | Figma Make |

---

## Key Files (from Figma Make source)

```
App.tsx                          — app entry point
styles/globals.css               — global styles
components/                      — screen components (23 screens)
components/ui/                   — shadcn/ui primitives (34 components)
components/figma/                — Figma-specific helpers (ImageWithFallback)
imports/                         — Figma component variant exports (~94 files)
utils/supabase/                  — Supabase client utilities
supabase/functions/server/       — Edge Function source
supabase/migrations/             — 5 SQL migration files
docs/                            — API reference, setup guides, architecture
guidelines/Guidelines.md         — design guidelines
```
