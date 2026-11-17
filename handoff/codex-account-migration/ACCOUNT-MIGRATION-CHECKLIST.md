# PAWJAI Codex Account Cutover Checklist

Updated: 2026-11-17

This is the operational checklist for moving PAWJAI work from a personal Codex account to a company-owned PAWJAI account. The account move itself must be completed in the Codex/OpenAI product by an authorized company administrator; this repository cannot transfer billing, account ownership, or chat history on its own.

## 1. Before switching accounts

- [ ] Confirm the PAWJAI company account and billing owner are the intended legal entity.
- [ ] Confirm the company account has the appropriate OpenAI plan and invoice/billing details.
- [ ] Confirm the people who need access are company-authorized members, not shared credentials.
- [ ] Keep the current personal account available until the new account passes the verification checks below.
- [ ] Preserve this repository and the complete `handoff/` folder in company-controlled source storage.
- [ ] Do not copy `.env.local`, service-role keys, OAuth secrets, Resend keys, Backblaze keys, or Cloudflare tokens into chat or handoff files.

## 2. Repository handoff

- [ ] Give the PAWJAI company account access to the repository and its deployment branch.
- [ ] Confirm the new Codex task opens `/Users/sudlabha/Desktop/paw` or the company-controlled checkout.
- [ ] Read `AGENTS.md`.
- [ ] Read `handoff/codex-account-migration/START-HERE.md`.
- [ ] Run `git status --short` and preserve all existing dirty changes before editing.
- [ ] Confirm `handoff/`, `supabase/`, `app/`, `components/`, `utils/`, `lib/`, `scripts/`, `tests/`, and `docs/` are present.
- [ ] Confirm company-owned backup/version control contains the handoff folder and all relevant source files.

## 3. Reconnect services under company ownership

For each service, reconnect through the company-owned organization/project and verify access without recording credentials in the repository.

- [ ] GitHub repository and organization access
- [ ] Vercel project, production domain, and deployment permissions
- [ ] Supabase project `bdnyvcvkyepipdcygkvn`, including migration and dashboard access
- [ ] Cloudflare zone and DNS/CDN permissions
- [ ] Backblaze B2 bucket and least-privilege application key
- [ ] Resend sending domain and transactional email access
- [ ] Google Analytics/OAuth ownership and authorized redirect settings
- [ ] Domain registrar account and recovery contacts

## 4. New-account verification

- [ ] New account can read the migration pack and identify every survivor lane.
- [ ] New account can continue work from each prompt in `EXPORT-PROMPTS.md`.
- [ ] New account can identify archived source sessions from `SESSION-INDEX.md` and `MERGE-LEDGER-SNAPSHOT.md`.
- [ ] New account can run the repository's read-only checks without exposing secrets.
- [ ] New account can distinguish local-only, committed, deployed, and remote-database-verified work.
- [ ] New account can identify the remaining risks in `REMAINING-WORK.md`.
- [ ] One low-risk continuation task is completed and documented before the personal account is retired.

## 5. Do not declare cutover complete until

The company account has repository access, the required service permissions, the handoff folder, and a successfully verified continuation task. Until then, the personal account is a recovery path, not an obsolete copy.

## What the new account can do automatically after setup

Once the company account can open the repository, a new Codex task can read `AGENTS.md` and this migration pack, understand the project boundaries, identify the survivor lanes, and continue from the saved implementation context. It can also create new focused sessions when explicitly instructed to do so.

## What it cannot safely assume

- Old Codex transcripts and sidebar task history are not the same thing as repository files.
- A separate account may not inherit personal chats, Codex task history, local-folder permissions, connected apps, service credentials, saved memories, or workspace permissions.
- A repository handoff cannot transfer OpenAI billing or third-party account ownership.
- New sessions should be created from `EXPORT-PROMPTS.md` or a similarly explicit prompt, not guessed from filenames alone.

## Ownership note

This pack preserves project context and operational instructions. It does not itself establish legal ownership, transfer an OpenAI subscription, transfer billing records, or transfer third-party service accounts. Those are separate account-administration actions.
