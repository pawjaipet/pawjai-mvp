# Guest discovery, donation setup and HQ exports

User authorized commit/push/redeploy after reviewing the prior session.

- Guest filters persist in a scoped HttpOnly cookie and affect anonymous discovery. Auth sheet scrolls internally, retains Home navigation, and has a sticky close button. Signup promotional copy is Thai/English.
- About reads the three real shelter records. Home removes shelter badge and displays aggregate save counts; detail displays shelter logo and shared Share action while retaining lower Treat.
- Tutorial keeps persistence and dismissal, with one upward paw gesture.
- Feed first photos on mounted neighbouring cards preload; loading/failure/retry states replace unexplained blanks. Five sampled covers returned HTTP200 but took roughly9–13seconds,255–744KB, with CDN MISS. This is a measured sample, not proof of universal CDN failure.
- HQ export endpoints independently enforce global-admin role. Dog ZIP streams bounded images plus CSV/manifest; failed or skipped photos are explicit. Limits:2000dogs,10000photos/traits,15MB/photo,500MB photo data,230seconds fetching. Booking CSV excludes notes, contact details, tokens and private documents. No schema changes.
- Voice Foundation Bangkok Bank account configured through existing production HQ form, verified against https://www.thevoicefoundation.org/:0370119992,มูลนิธิเดอะวอยซ์(เสียงจากเรา). PromptPay remains blank because not independently verified. Dog Rescue untouched. No payment or booking created.
- Added guest-cookie, export-role, CSV-injection, media-allowlist and actual ZIP-content regression tests. Existing save/booking tests remain intact.
- Lockfile updates Next16.4.3,sharp0.35.5,source-map-js1.2.2 to resolve production audit findings; adds fflate for ZIP.

Unrelated local analytics, legal, matching-preference and shelter-message edits deliberately excluded. Overlapping files were staged selectively; do not overwrite remaining work.
