# GA4 website tracking — 3 October 2026

Deployed commit `70a0571` to production. GA4 standard account 410216648, property 556758283, stream 15887697557, measurement ID G-PPD6QKJEHR. Direct gtag integration; no Shopify, paid service, API secret or Tag Manager required.

Optional analytics consent controls Google loading and events. Admin/shelter routes, form contents, auth tokens and private resource identifiers are excluded. Advertising signals disabled. Enhanced measurement was disabled in GA4 to avoid automatic form capture and duplicate page views. `booking_succeeded` registered as a key event without a monetary value. User behaviour selected as Reports snapshot.

Events cover page views, existing feed/profile events, feed-card saves, matching completion, auth prompts/views/submissions/coarse failures/verification/login, and booking submit/outcomes. Server outcome receipts expire after 60 seconds. Consent rejection, blockers and redirects may undercount. Existing first-party operational analytics continues independently. No historical GA4 backfill.

Verification: 229 tests passed, typecheck passed, lint 0 errors (15 existing warnings), production audit 0 vulnerabilities, production build passed, Vercel deployment succeeded. Next upgraded to 16.3.6 to resolve critical production audit finding. Live consent prompt and dog-profile navigation checked. On 4 Oct, GA4 Home confirmed 14 events, 1 active user, 3 homepage views and 1 dog-profile view in its last-7-days report. Initial data includes QA visits. Realtime was empty during the check; historical receipt confirms delivery. Screenshot: outputs/01a0ed88-ux/GA4-confirmed.png.

Workbook: `outputs/01a0ed88-ux/PAWJAI-UX-tracker.xlsx`. Three sheets: UX actions, activity baseline, tracking guide. Read-only aggregate export from existing events covers 3 Sep–2 Oct inclusive Bangkok time: 1,854 events, 211 nonempty browser-session IDs, 512 page views, 930 dog impressions, 69 dog-profile views, 6 booking starts, 3 booking successes, 2 unavailable-slot failures. Includes internal/testing activity; not a conversion funnel.

Priorities for founder review: dog-detail saves currently require booking verification while feed saves differ; recover gracefully from unavailable slots; measure auth drop-off before redesign; test guest matching and clearer password recovery. No adoption-flow redesign shipped in this change.

Preserved unrelated dirty admin panel and two existing test changes. GitHub CLI switched from PROUD-AI to existing authorized account 6658065556PS because PROUD-AI push was denied.
