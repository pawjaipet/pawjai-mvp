# PAWJAI Analytics and Measurement Handoff — 2026-10-28

## Session merge

This handoff combines:

- `Choose website activity tracking` — `01a0ed88-93d1-7932-b53f-31f5644883eb`
- `Fix PAWJAI auth analytics` — `01a14e5e-fd85-7203-9ad4-b23001e8ed59`

## Responsibility

GA4, first-party product analytics, auth funnel events, consent/privacy boundaries, booking conversion signals, focus-group previews, and analytics exports.

## Current evidence

- `handoff/sessions/2026-10-03-ga4-website-tracking.md` records GA4 property/stream setup, measurement ID, consent behavior, event taxonomy, privacy exclusions, deployment commit, and QA caveats.
- The focus-group save-count preview was deployed as an opt-in query-string preview; it is not access control and must not be treated as real adoption data.
- Existing exports include internal/testing activity and are not automatically a clean conversion funnel.
- Auth analytics changes are separate from GA4 delivery; verify event names and deployment before adding more.

## Fresh-session kickoff prompt

Read `AGENTS.md`, this file, `handoff/sessions/2026-10-03-ga4-website-tracking.md`, current analytics utilities/components, and privacy/trust pages. Separate production analytics from QA/focus-group data. Do not add user-entered content, tokens, private identifiers, or shelter/admin activity to analytics payloads.
