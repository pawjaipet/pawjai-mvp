# Shelter Save Reliability

## Delivered
- Matching tags now replace transactionally, with before/after audit metadata. Failed tag reads stop the editor instead of displaying empty selections.
- Cover/order and media metadata save in one transaction; stale concurrent media saves are rejected. Other profile fields still save separately, so partial errors remain explicitly reported.
- Rejected selected files no longer become covers or discard valid files. New profiles with skipped media remain drafts with warnings.
- Videos from 50MB to 250MB get automatic browser preparation into a short muted MP4 where MediaRecorder MP4 is supported; uploaded videos still pass through existing server compression. Above 250MB or unsupported devices receive actionable errors. Browser preparation requires the page to remain open and has not been verified on every phone/browser.
- Both name fields, breed, and an explicit gender choice are required. Unknown gender remains allowed. No Thai-script restriction or automatic name translation. Personality and vaccine details remain optional.
- Save notices distinguish pending, success, and partial/error states. Individual selected-file removal was intentionally deferred.

## Database
Applied and recorded only migrations 20260924062041 and 20260925055328 using the linked Supabase project. Both functions are service-role-only. Transaction rollback tests passed against the linked database and left no test dogs behind.

The earlier seven-missing-fields indicator was care-passport completeness, not matching tags. Missing care tables now produce a care-unavailable indicator. This work does not provision the outstanding care schema or invent missing tag values. Existing saved tags were not rewritten.

## Verification
- npm run verify: 224 tests passed, typecheck passed, lint had 15 existing image warnings and no errors, dependency audit clean.
- Production build passed before final required-label/selection-lock refinements; deployment build verifies the final commit.
- SQL tests: matching-tag replacement, rollback, audit snapshots and client denial; media cover/order, stale saves and failure rollback.
- Security advisor: existing leaked-password-protection warning remains; no new database warnings.
- Actual large-video encoding on mobile devices still needs device-level QA; tests cover limits, unsupported browsers and rejected-selection behavior.
