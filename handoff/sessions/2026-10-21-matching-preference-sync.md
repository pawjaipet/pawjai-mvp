# Matching Preference Sync

Production was missing all detailed adopter preference columns and the full-answer snapshot. The previous action silently dropped these fields on schema errors. Added only these matching columns with migration 20261021062027, applied and recorded via the linked CLI. Existing dog traits were not modified or invented. Earlier discarded adopter choices cannot be reconstructed from the database; users need to reapply their filters (local browser drafts may still contain them).

Local app fixes: complete preference upsert with explicit failure result; snapshot-first restoration; multi-select energy/size filtering; exact dog-social-style filtering instead of collapsing selective/solo to a boolean; trait load failures no longer silently produce empty tags; explicit /swipe revalidation after shelter saves. Advanced matching still ranks partial matches by design, and the existing no-match fallback remains visibly labelled. Free-text personality bubbles are not automatically interpreted as structured matching answers.

Checks: 255 tests and typecheck passed before two additional save-contract tests. Database persistence round-trip passed in a rolled-back transaction. Webpack production build passed; Turbopack encountered local Operation not permitted. Full verify flagged existing high dependency advisories in sharp and source-map-js. Generated live types into /tmp/paw-matching-live-types.ts; new fields already match the hand-maintained types/database.ts, so unrelated absent-table types were not overwritten.

Application changes are not committed or deployed as part of this task. Preserve unrelated auth, analytics, reliability-monitoring, legal-page and brand changes in the worktree.
