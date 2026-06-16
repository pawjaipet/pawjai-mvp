# Session: Worktree — Figma MCP setup + long-running UX/UI polish

- **Session ID:** `26138611-8087-4cbb-9e19-91a09b1ea996`
- **Date range:** 2026-05-17 → 2026-06-08 (1907 events, ~53 user prompts)
- **Working dir:** `.claude/worktrees/vigilant-bhaskara-eb96de` (git worktree off `main`)
- **Branches used:** `claude/vigilant-bhaskara-eb96de`, `ui-polish-1`, `ui-polish-2`, then cherry-picked onto `main`
- **Transcript location:** `~/.claude/projects/-Users-sudlabha-Desktop-paw--claude-worktrees-vigilant-bhaskara-eb96de/26138611-8087-4cbb-9e19-91a09b1ea996.jsonl`

## What it was working on
The single longest-running PAWJAI session — ran inside a **git worktree** rather than the main checkout, which is why it lives in a *different* `~/.claude/projects/` directory than every other session in this handoff. It started as a continuation of the previous month's Figma MCP setup and grew into the bulk of the UX/UI polish for the live site. Work landed as ~25 commits cherry-picked from the worktree onto `main` (the user's standard "worktree → cherry-pick → push" flow).

Major themes:

- **Figma MCP + Supabase MCP wiring** verified against `pawjaipet/pawjai-mvp` so design-to-code and DB introspection both worked from this session.
- **Logo + hero proportions on home/swipe** — cropped the source PNG from a 500×500 square to a ~489×392 landscape (the original had transparent padding that wasted horizontal space at `object-contain`), then re-tuned the SwipeFeed card height, gradient header, and tag-row collapse to match the Figma MVP.
- **Header logo overlap fixes** across Messages, About, More, Schedule — four pages each rendered the logo as a `fixed/sticky top-0 z-20` overlay that collided with the page title (`P[AWJAI]sages`, etc.). Overlays were removed or converted to inline static headers.
- **Appointment detail polish** — replaced the decorative QR grid with a real scannable QR (server-rendered via `qrcode`), pulled shelter name/Thai name/address/phone/email through to "Meeting At" and "Shelter Contact" sections, added a status box (pending / accepted / denied / cancelled / completed) between the time row and Meeting At, added a Cancel Appointment button + confirmation dialog + `cancelAppointmentAction` server action below the QR, removed the unclear share/upload icon from the header.
- **Chat attachments** — added a "+" attachment trigger on both `/messages/[id]` (standalone chat) and the appointment Messages tab. First pass used a custom in-app action sheet (Take Photo / Library / Files); later collapsed it to a single native `<input type="file" accept="image/*,video/*,application/pdf">` after the user reported a duplicated picker on iOS.
- **Settings cleanup** — removed Notifications + Language rows (and the APP section header) from `/settings`. Renamed Privacy → "Subscription & Payment Methods" with a credit-card icon, wired it to a new `/settings/subscription` page.
- **Subscription page (new route)** — `/settings/subscription` with a Current Plan card (Free Tier hardcoded — `TODO(backend)`) and three tier cards (Free / Standard / Premium) showing the feature matrix from the spec, "Most Popular" badge on Standard, "Upgrade Now" → "Coming soon" placeholder modal.
- **More tab cleanup** — removed the profile header + entire Adopt section (Browse dogs, My preferences, My wishlist, Appointments, My documents); kept Messages, About PawJai section, Sign out.
- **Filter wizard** — root-caused the persistence bug (`finishAndSave` read only 5 of 12 question indices, and `adopter_preferences` had no columns for breed/age/special needs/etc.). Frontend fix: persist full state to `localStorage` (key `pawjai.filter.v1`), merge with server prefs on load. Renamed final CTA "Save & Finish" → "Show Dogs". Added a Reset button. After first completion the wizard switches to a single scrolling all-questions-on-one-page view (`ScrollFilter` component) to remove friction for repeat tunings.
- **Verification flow** — fixed legacy `/onboarding` redirect (was sending all adopters to `/admin`, which presented as "this page couldn't load" because they hit the admin passphrase gate). Now redirects to `/documents`. Also dropped the "ID or passport number" + "Upload your ID or passport" question + uploader from Section A (server validation relaxed accordingly — the column + `id_copy` document_type kept for post-adoption use).
- **Dog detail page** — replaced the PawJai-logo-as-back-link top-left with a proper rose-pink back-arrow button matching the existing Save bookmark style; moved the logo to a non-interactive watermark at the bottom-right of the hero photo (`aria-hidden`, `pointer-events: none`, 100% opacity per follow-up).
- **Profile typo** — "Top Donater" → "Top Donor" badge label.
- **"Leave documents?" modal** — centered vertically and bumped above the bottom nav so both action buttons stayed tappable.

## Files / areas touched (selection)
- `components/SwipeFeed.tsx`, `components/SwipeDogCard.tsx`, `components/PageHeader.tsx`
- `components/appointments/AppointmentDetailClient.tsx`, `app/appointments/[id]/page.tsx`, `app/appointments/[id]/actions.ts` (new), `app/appointments/page.tsx`
- `components/BookingQRCode.tsx`, `app/appointments/check-in/[bookingId]/page.tsx` (superseded by Codex's `/admin/bookings/check-in`)
- `app/messages/page.tsx`, `app/messages/[id]/page.tsx`
- `app/settings/page.tsx`, `app/settings/subscription/page.tsx` (new), `components/settings/SubscriptionPageClient.tsx` (new)
- `app/more/page.tsx`, `app/about/page.tsx`, `app/schedule/page.tsx`
- `app/filter/page.tsx` (heaviest refactor — quiz + scroll modes)
- `app/documents/page.tsx`, `components/documents/DocumentsPageClient.tsx`, `app/documents/actions.ts`, `app/onboarding/page.tsx`
- `app/dogs/[id]/page.tsx`, `components/profile/EditableProfileHeader.tsx`
- `public/pawjai-logo.png` (cropped) + `public/pawjai-logo-square.png` (original backup); `assets/branding/pawjai-logo.png` uploaded to Supabase Storage

## Current state
**All work shipped to `main`** and live on Vercel. Cherry-picked commits include (chronological excerpt):
- `416cc0d` Crop logo PNG to landscape + fix home feed proportions
- `5b2b032` Replace decorative QR with real QR + check-in page (later superseded by Codex's admin QR workflow)
- `4817a62`, `83a2295` Chat attachment "+" action sheets (later collapsed)
- `5bff9cc` `feat(shelter): render Thai name + lat/lng Maps link`
- `11b226d` `fix(ui): header logo overlap on messages, about, more, schedule`
- `a7f0c05` `ui: PawJai UI polish batch (modal, cancel, share icon, picker, logo, status)`
- `b24fa83` `fix(verification): redirect legacy /onboarding to /documents`
- `bcc6a2b` `ui: PawJai UI polish #2 (settings, subscription page, more cleanup, typo)`
- `8a9d0ea` `fix(filter): persist all wizard answers via localStorage, rename CTA to "Show Dogs"`
- `7d5b3b4` `fix(verification): drop ID/passport question + upload from Section A`
- `c3aaf64` `feat(filter): add reset button + scrolling all-in-one view after first completion`
- `3b02534` `ui(dogs): replace logo-as-home with back arrow, move logo to watermark`
- `d7451d5` `ui(dogs): keep PawJai watermark at 100% opacity`

## Unfinished threads / TODOs
1. **Subscription page is visual-only.** `currentTier` is hardcoded to `"free"` with a `TODO(backend)` marker in `app/settings/subscription/page.tsx`. Tier enforcement (wishlist cap, dogs-viewed/day rate limit, gating Advanced Matching), wiring of the Profile "Premium User" badge to real state, and the payment integration behind "Upgrade Now" are all out of scope and not started.
2. **Filter wizard persistence is half-server, half-localStorage.** `adopter_preferences` still lacks columns for breed (Q2), age range (Q1), protectiveness (Q4), affection (Q5), training (Q6), people friendliness (Q7), and special needs (Q11). They live only in browser `localStorage` (`pawjai.filter.v1`) and so don't follow the user across devices. `TODO(codex)` markers in `app/filter/page.tsx` and `app/actions/preferences.ts` flag this. Server-side filtering of the dog list by the seven currently-client-only fields is also pending.
3. **Status enum on appointments** is mapped UI-side (`normalizeStatus` in `AppointmentDetailClient.tsx`) — DB still uses `requested|confirmed|completed|cancelled|no_show`; the spec called for adding `pending` + `denied` as a non-destructive enum extension. Not yet done in the DB; the UI is forward-compatible.
4. **Worktree branch `claude/vigilant-bhaskara-eb96de`** lives only on this machine. Everything useful has been cherry-picked to `main`; the branch itself can be discarded on the new machine.

## External systems depended on
- **GitHub** (`pawjaipet/pawjai-mvp`, branch `main`)
- **Vercel** (production deploys auto-trigger on push to `main`)
- **Supabase** (project `bdnyvcvkyepipdcygkvn`) — introspected via the Supabase MCP for the shelters / appointments / adopter_preferences tables
- **Supabase Storage** — `assets` bucket, public, 5 MB limit, `branding/pawjai-logo.png` uploaded as a backup
- **Figma MCP** — design reference for every Figma-driven layout fix above
