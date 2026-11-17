# Build privacy-conscious platform reliability monitoring

Work in `/Users/sudlabha/Desktop/paw`. Read AGENTS.md and relevant handoff documents first. Implement and test this task end to end; do not stop at a proposal. Preserve unrelated uncommitted work, including ongoing auth/analytics changes. Inspect current production configuration rather than assuming old handoff notes are still current.

## Goal
Make failures visible across the public/adopter website, shelter portal, and admin workflows on desktop, tablets, and phones. Cover existing and new visitors after deployment, not just newly registered accounts. No device fingerprinting or permanent device identifiers. Keep reliability monitoring separate from marketing analytics and do not depend on advertising consent or GA availability to report essential operational failures; review the existing privacy policy and applicable consent requirements before enabling collection.

## First inspect
- Existing analytics, error boundaries, server logging, upload/compression flow, server actions, auth/session handling, and Supabase audit trail.
- Available error-monitoring services, hosting integrations, retention controls, and project credentials. Prefer one established error-monitoring SDK over building a bespoke logging database. Verify current official SDK documentation for Next.js 16.
- Choose the smallest maintainable implementation. Ask before creating paid subscriptions or new external accounts. If credentials are missing, implement/test the integration disabled by default, document the exact setup blocker, and do not claim monitoring is live.

## Capture
1. Client exceptions, unhandled rejections, React error boundaries, server exceptions, and failed application requests. Distinguish handled failures from fatal ones; exclude expected redirects, normal 404s, user cancellation, and routine auth expiry unless recovery fails.
2. Upload stages: selection, validation, preparation/compression, transfer, processing, attachment persistence, success/failure. Use structured error codes, stage, elapsed duration, retry count, coarse file-size bucket and allowlisted media format. Never collect file names, content, thumbnails, storage keys, or media URLs.
3. Form outcomes: submitted, validation rejected, saved, partially saved, failed, and recovered on retry. Record only allowlisted field identifiers and error codes, never values or raw validation messages. Start with dog creation/editing, booking decisions/adoption completion, shelter/donation settings, messaging attachments, and account/session failures; expand to other mutation flows using shared patterns.
4. Track form started, submitted, and completed events using a short-lived random attempt ID. Infer possible abandonment from unmatched starts after a documented time window. Do not label tab closure, navigation, network loss, or an incomplete attempt as a confirmed error. Avoid logging every keystroke or interaction.
5. Link frontend and server failures with a random correlation ID so partial saves and retries can be diagnosed without copying private data into logs. Events must not depend on a subsequent successful save.

## Privacy and isolation
- Use an explicit event schema and allowlist. Strip data both before sending and at ingestion. Disable automatic request bodies, cookies, authorization headers, console breadcrumbs, DOM text, user profiles, full URLs/query strings, session replay, screenshots, and uploaded content. Verify SDK defaults rather than assuming they are safe.
- Do not collect names, email addresses, telephone numbers, passwords, tokens, OTPs, donation/bank information, medical records, message bodies, or user-entered strings.
- Record route templates (for example `/shelter/[slug]/dogs/[id]/edit`), release ID, environment, locale, coarse browser/OS family, viewport class, and event timestamps. Avoid exact device models and raw user-agent/IP retention where configurable. Document any unavoidable provider processing.
- Derive shelter scope and role on the server from authenticated membership; never trust client-supplied tenant IDs. Platform operators may view cross-platform aggregate failures; shelter users must never see other shelters' diagnostics. Keep monitoring dashboards operator-only initially.
- Make attempt/session identifiers short-lived and random, not stable cross-device identities. Use documented bounded retention, such as 30 days for raw operational events and 90 days for aggregate counts, subject to provider capabilities and privacy review.
- Bound payload sizes, rate-limit unauthenticated reporting, deduplicate event floods, redact sensitive fields recursively, and restrict accepted origins where appropriate. Treat reports as untrusted input. Monitoring must never grant authorization or become a public data-query API.
- Monitoring failures must not block saving, uploading, login, or navigation. No unbounded offline queues, repeated retries, or recursive error-reporting loops.

## Employee/user feedback
- Show immediate pending/progress feedback, a clear success confirmation only after persistence succeeds, specific actionable partial/failure messages, and a safe retry option where supported.
- Include a copyable non-sensitive support reference on unexpected failures. Do not show raw database errors or internal stack traces.
- Preserve entered form state on failure. Prevent accidental duplicate submissions while pending, without trapping users indefinitely.
- Keep the existing laptop layout and branding. Make feedback accessible on phones, keyboard usable, and screen-reader announced without blocking primary controls.

## Operator visibility
Provide a documented operator dashboard (the chosen service's dashboard is acceptable; avoid an unnecessary new admin application) for failures by release, route, workflow/stage, shelter scope, and coarse browser/OS class. Include upload completion, form completion, partial saves, retries, and approximate abandoned attempts with sample-size caveats. Do not treat these metrics as exact counts when sampling or blockers apply.

Configure or document alerts for elevated save/upload failure rates, new high-impact errors after deployment, and repeated session-recovery failures. Use minimum sample sizes and deduplication to avoid noise. Alert payloads must contain no private user data. Confirm alert recipients and any external messaging destination before enabling delivery.

## Verification
- Unit tests for event allowlists, redaction, forbidden nested properties, URL sanitization, deduplication, bounds, and sampling.
- Tests for tenant spoofing, unauthorized dashboard access, anonymous report abuse, and monitoring-provider failure.
- Integration tests for invalid fields, rejected videos, compression failures, dropped networks, server failures, partial persistence, successful retry, and duplicate submission prevention.
- Desktop and mobile browser screenshots for progress, success, validation and error states. Never mutate real shelter records to demonstrate a failure. Use isolated disposable fixtures and clean them up.
- Run `npm run verify` and production build. Confirm source maps, release attribution and secret handling; do not publish source maps with sensitive source data.
- Verify an explicitly tagged synthetic event reaches the correct production project after approved setup, can be correlated, and contains no disallowed data. Exclude synthetic tests from operational metrics.

## Deliver
Implement the code and tests, document the service/setup/retention/alert choices and remaining limitations, and provide a clear checklist distinguishing implemented, configured, deployed, and verified. Do not claim historical failures can be recovered retroactively. Do not commit/push/deploy until the user authorizes that step for this implementation. Do not change existing shelter records or silently apply unrelated pending database migrations.
