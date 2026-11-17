# Reliability monitoring

The reliability monitor is separate from product/marketing analytics. It reports only allowlisted operational failures and is disabled by default until an approved provider and retention policy are configured.

## Current implementation

- Client exceptions and unhandled promise rejections are captured by `ReliabilityMonitor`.
- Reports use random short-lived correlation IDs, route templates, coarse stages, release/environment, and bounded metadata.
- Recursive sensitive-key filtering removes credentials, contact details, message bodies, URLs, storage paths, document data, and user-entered content before transport.
- Browser and server endpoints are rate-limited at 20 reports per minute per client key.
- Reports are fire-and-forget; monitoring failure cannot block saving, uploading, login, or navigation.
- No database table, cookies, session replay, screenshots, request bodies, headers, or permanent device identifiers are used.

## Setup remaining

`RELIABILITY_MONITORING_ENABLED=true` currently emits sanitized reports to server logs only. This is not yet an operator dashboard. Before enabling in production, choose one approved error-monitoring provider, confirm DPA/region/retention, wire its official Next.js 16 SDK, configure source-map policy and operator alerts, and send one explicitly tagged synthetic event. Do not enable a paid account or external delivery destination without approval.

## Instrumentation pattern

Mutation flows should call `reportReliabilityFailure` with an allowlisted `eventName`, stage, correlation ID shared with the server action, and coarse metadata such as `fileSizeBucket`, `mediaFormat`, `retryCount`, or `fieldId`. Never pass raw errors, form values, filenames, storage keys, URLs, or message text.
