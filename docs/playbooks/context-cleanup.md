# PAWJAI Context Cleanup Playbook

Use this when duplicate files, stale generated files, or confusing parallel implementations make agents slower or less reliable.

## Current Cleanup Targets

- Files with suffixes like ` 2.ts`, ` 2.tsx`, ` 3.tsx`, or ` 2.mjs`
- Duplicate test files
- Duplicate Supabase client folders: `lib/supabase/*` and `utils/supabase/*`
- Stale docs that contradict migrations or current routes

## Process

1. Run `git status --short`.
2. Compare duplicates before deleting: `diff -u "file" "file 2"`.
3. Keep the version imported by app routes unless the duplicate has newer intentional behavior.
4. Update imports only after choosing a single owner.
5. Run focused tests, then `npm run verify`.

## Do Not Do

- Do not delete untracked duplicate files without comparing them.
- Do not merge two files by guessing from filenames.
- Do not consolidate Supabase clients until all imports are mapped.
- Do not rewrite migrations just to make filenames prettier.
