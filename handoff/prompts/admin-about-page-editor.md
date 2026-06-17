# Codex Prompt — PawJai Admin: About Page Editor

> Extracted verbatim from a Claude Code session (`19ea920d`) before that session was deleted. This is the ready-to-paste prompt to fix the admin About-page editor bug (open thread #3 in [HANDOFF.md](../HANDOFF.md)). Verify file paths against the current code before running.

---

## Codex Prompt: PawJai Admin — About Page Editor

### Context

Next.js 16 app (App Router, server actions, Turbopack). Stack: TypeScript, Tailwind, Supabase (via `@supabase/ssr`).

**Data flow:**
- Public about page: `app/about/page.tsx` — server component, reads from `pawjai_profile` table (single row, `id = 'default'`) via `utils/pawjai-profile.ts → loadPawjaiProfileContent()`
- Admin edit page: `app/admin/pawjaiprofile/page.tsx` + `app/admin/pawjaiprofile/actions.ts`
- Supabase table `public.pawjai_profile` columns: `id text PK`, `hero_slogan text`, `mission_title text`, `mission_body text`, `partner_shelters jsonb`, `contact_items jsonb`
- `partner_shelters` JSONB shape: `[{ name, detail, logo_url }]` where `detail` is e.g. `"Bangkok · 200+ dogs"`
- `contact_items` JSONB shape: `[{ type, label, href }]` where type ∈ `"email" | "phone" | "social" | "website" | "custom"`

**Admin auth:** cookie-based passphrase gate. `utils/admin-auth.ts` exports `isAdminGateOpen()`, `openAdminGate()`, `closeAdminGate()`, `validateAdminPassphrase()`. Default passphrase: `pawjaiadmin` (overrideable via `PAWJAI_ADMIN_PASSPHRASE` env var). Gate is locked on first visit; admin enters passphrase to unlock for 12 hours.

**Supabase clients:**
- Server (RLS-respecting): `utils/supabase/server.ts → createClient()`
- Admin (bypasses RLS): `utils/supabase/admin.ts → createAdminClient()`

---

### Problem

`app/admin/pawjaiprofile/actions.ts` has `"use server"` at the top but exports `initialAdminGateState` as a plain object. Next.js 16 requires `"use server"` files to **only** export async functions. This causes a runtime error: `A "use server" file can only export async functions, found object`.

---

### Tasks

**1. Fix the `"use server"` export error**

Move `initialAdminGateState` out of `actions.ts`. Two options — pick whichever is cleaner:
- Move it to a separate non-server file (e.g. `app/admin/pawjaiprofile/constants.ts`) and import from there in `page.tsx`
- Or inline `{ message: "", status: "idle" }` directly in `page.tsx` where it's used

**2. Rebuild `app/admin/pawjaiprofile/page.tsx`**

Server component. Layout should be clean desktop admin UI (warm beige/brown palette matching existing admin pages — check `app/admin/dogs/` for reference). The page:

- If gate locked → show passphrase form (reuse `AdminGateForm` from `app/admin/dogs/new/AdminGateForm`)
- If gate open → show the full editor form

The form must have these sections, each in a card:

**Hero Copy**
- Single text input: `hero_slogan`

**Our Mission**
- Text input: `mission_title`
- Textarea: `mission_body` (multiline, resizable)

**Partner Shelters**
- Up to 8 rows. Each row has 3 fields: `shelter_name_{i}`, `shelter_detail_{i}` (e.g. `Bangkok · 200+ dogs`), `shelter_logo_url_{i}` (optional URL)
- Leave blank rows empty — they're skipped on save

**Contact Us**
- Up to 6 rows. Each row: type select (`email/phone/social/website/custom`), label input, href input (optional)
- Named: `contact_type_{i}`, `contact_label_{i}`, `contact_href_{i}`

**Save button** → calls `savePawjaiProfileAction`. On success, show a green success banner. On error, show red banner. After save, the public `/about` page must immediately reflect changes (use `revalidatePath("/about")` in the action).

**3. Rebuild `app/admin/pawjaiprofile/actions.ts`**

All exports must be `async function`. No exported objects/constants.

- `unlockAdminGateAction(prevState, formData)` — validates passphrase via `validateAdminPassphrase()`, calls `openAdminGate()`, returns `{ status: "success" | "error", message: string }`
- `lockAdminGateAction()` — calls `closeAdminGate()`, redirects to `/admin/pawjaiprofile`
- `savePawjaiProfileAction(formData)` — collects all fields, upserts to `pawjai_profile` where `id = 'default'` using `createAdminClient()`, then calls `revalidatePath("/about")` and `revalidatePath("/admin/pawjaiprofile")`, redirects back with success message. Also collect `logo_url` per shelter row (`shelter_logo_url_{i}`).

**4. Update `utils/pawjai-profile.ts`**

`normalizePartnerShelters` already handles `logo_url` — verify it passes the value through and the `PawjaiPartnerShelter` type includes `logo_url?: string | null`.

**5. Verify end-to-end**

1. Visit `/admin/pawjaiprofile` — should show passphrase gate
2. Enter `pawjaiadmin` → unlocks, shows editor pre-filled with current DB values
3. Edit "Mission copy" text → save
4. Visit `/about` → confirm new text appears (fetched live from Supabase, not cached stale)
5. No TypeScript errors (`npx tsc --noEmit` passes)

---

### Key files

| File | Purpose |
|------|---------|
| `app/about/page.tsx` | Public page — reads from DB, do not break |
| `app/admin/pawjaiprofile/page.tsx` | Admin editor UI |
| `app/admin/pawjaiprofile/actions.ts` | Server actions only |
| `utils/pawjai-profile.ts` | Types + normalizers + `loadPawjaiProfileContent` |
| `utils/admin-auth.ts` | Cookie gate helpers |
| `utils/supabase/admin.ts` | Admin Supabase client (bypasses RLS) |
