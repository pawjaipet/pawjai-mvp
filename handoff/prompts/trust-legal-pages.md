# Prompt: Build PawJai Trust, Privacy, And Terms Pages

You are continuing PAWJAI launch-readiness work in `/Users/sudlabha/Desktop/paw`.

Context:

- Production site: `https://www.pawjaipet.com`
- PAWJAI is a Thai dog adoption and shelter-matching platform.
- The current concern is domain trust/reputation: some company Wi-Fi filters have miscategorized `pawjaipet.com/shelter` as `adult`.
- The goal of this session is to make the public website look more official and trustworthy to users, search engines, ad reviewers, OAuth reviewers, and URL categorization vendors.
- Preserve the existing visual design and UX style. Do not redesign the app.
- Backend is stable. Do not change database behavior unless absolutely necessary.

Read first:

1. `AGENTS.md`
2. `handoff/START-HERE.md`
3. `handoff/HANDOFF.md`
4. `docs/marketing-search-launch-plan.md`
5. `docs/playbooks/web-filter-reclassification.md`
6. Relevant Next.js 16 metadata/routing docs under `node_modules/next/dist/docs/` before changing route metadata/layouts.

Work to do:

1. Audit whether PAWJAI already has public pages for:
   - Privacy Policy
   - Terms of Use
   - Contact / Support
   - Safety / Adoption responsibility
   - Shelter partner information
2. Add missing public routes, likely:
   - `/privacy`
   - `/terms`
   - optional `/safety` if it fits the existing navigation better than expanding `/about`
3. Keep copy accurate and cautious:
   - State that PAWJAI helps connect adopters and shelter partners.
   - Do not claim legal nonprofit/social-enterprise status unless a registration document or founder-provided fact is present.
   - Mark legal copy as operational website policy language, not legal advice.
   - Include contact email currently used by the app, but prefer `hello@pawjaipet.com` only if domain email exists or is being created in the same release.
4. Link these pages from existing low-friction surfaces:
   - `/about`
   - `/more`
   - auth/sign-up context if there is already a terms/privacy area
   - footer-like areas if the app has one
5. Add appropriate metadata/canonical URLs and JSON-LD where useful.
6. Make sure private/admin/auth pages remain noindex, while public trust pages are indexable.
7. Avoid collecting or displaying any sensitive real user data in these pages.

Verification:

- `npm run typecheck`
- relevant tests, especially SEO/noindex tests if changed
- `npm run lint`
- `npm run build`
- Browser-check mobile and desktop routes for:
  - `/privacy`
  - `/terms`
  - `/about`
  - `/more`

Final answer:

- List pages added/changed.
- List exact public URLs.
- Flag any founder/legal details still needed, such as registered company name, address, domain email, or official social links.
- Confirm whether the change was committed and pushed.
