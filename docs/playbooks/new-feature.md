# PAWJAI New Feature Playbook

Use this when adding a product feature, route, server action, database behavior, or user-facing flow.

## Flow

1. Read `docs/agent-map.md`.
2. Identify the route, component, model utility, server action, and table/storage surface involved.
3. Reuse existing model utilities before adding new logic to components.
4. For data changes, follow `docs/playbooks/supabase-change.md`.
5. For Figma-driven UI, follow `docs/playbooks/ui-from-figma.md`.
6. Add focused tests for model logic and risky server-action boundaries.
7. Run `npm run verify`.

## Design Rules

- Keep user flows direct; PAWJAI is an operational adoption app, not a marketing demo.
- Keep sensitive adopter/document data out of client components unless required.
- Prefer typed utility functions in `utils/` for booking, documents, matching, donations, and messages.
- Keep admin/shelter behavior explicit; do not infer privileges from UI state.

## Done Means

- User path works.
- Authorization is checked.
- Data changes are covered by RLS or explicit server-side checks.
- Tests cover the highest-risk logic.
- Verification command result is reported.
