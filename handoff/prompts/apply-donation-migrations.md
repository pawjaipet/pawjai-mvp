# Codex Prompt — Apply donation migrations to remote Supabase

> Extracted verbatim from a Claude Code session (`1f669b51`) before that session was deleted. This is the ready-to-paste prompt for open thread #2 in [HANDOFF.md](../HANDOFF.md) (donation backend migrations not yet applied to the live DB). Verify migration filenames against `supabase/migrations/` before running.

---

**Codex Task — Apply donation migrations to remote Supabase**

The donation backend migration files exist in `supabase/migrations/` but were never applied to the live database (project ref `bdnyvcvkyepipdcygkvn`, "BACKEND ATTEMPT1"). Verification confirms the remote DB is missing everything:

- `shelters.promptpay_id`, `shelters.bank_name`, `shelters.bank_account_number`, `shelters.bank_account_name` — columns do not exist
- `public.donation_intents` table — does not exist (`to_regclass('public.donation_intents')` returns null)

**Files to apply (in order):**
1. `supabase/migrations/20260608223521_extend_shelter_donation_details.sql` — adds the 4 shelter columns + `shelters_promptpay_id_format` check constraint
2. `supabase/migrations/20260608223522_create_donation_intents.sql` — creates `donation_intents` table, indexes, RLS policies (owner insert/select)

**Steps:**
1. Run `supabase db push` (or apply both migrations via the MCP `apply_migration`). Push only — do **not** reset; there is production data in `shelters`/`dogs`.
2. After applying, verify:
   ```sql
   select column_name from information_schema.columns
   where table_name='shelters'
   and column_name in ('promptpay_id','bank_name','bank_account_number','bank_account_name');

   select to_regclass('public.donation_intents');

   select polname from pg_policies where tablename='donation_intents';
   ```
   Expect: 4 columns, non-null table, 2 policies (`donation_intents_owner_insert`, `donation_intents_owner_select`).
3. Regenerate types if your workflow does so: confirm `types/database.ts` already has `donation_intents` Row/Insert + the 4 shelter columns. It does — don't overwrite unless out of sync.

**Out of bounds:**
- Don't touch the frontend (`app/dogs/[id]/donate/`, `components/donations/`) — that's the front-end's domain, already built.
- Don't change the migration SQL contents — just apply them.
- Don't `supabase db reset`.

---

Once applied + dev server up, the donate screen at `/dogs/<dogId>/donate?intent=<intentId>` will render live.
