# Prompt: Improve Public Trust Signals And Structured Data

You are continuing PAWJAI launch-readiness work in `/Users/sudlabha/Desktop/paw`.

Goal:

Make `https://www.pawjaipet.com` look official, clear, and low-risk to people, search engines, ad reviewers, OAuth reviewers, and URL categorization vendors.

Context:

- PAWJAI is a Thai dog adoption and shelter-matching platform.
- Some company Wi-Fi filters have miscategorized the shelter URL as `adult`.
- We need stronger public proof that this is a legitimate pet adoption/shelter platform.
- Preserve the existing visual design. Do not turn the app into a marketing landing page.

Read first:

1. `AGENTS.md`
2. `handoff/START-HERE.md`
3. `handoff/HANDOFF.md`
4. `docs/marketing-search-launch-plan.md`
5. `docs/playbooks/web-filter-reclassification.md`
6. `utils/pawjai-profile.ts`
7. `utils/json-ld.ts`
8. `app/about/page.tsx`
9. `app/shelter/page.tsx`
10. Relevant Next.js 16 metadata docs under `node_modules/next/dist/docs/`.

Audit:

1. About page clarity:
   - Does the first viewport clearly say dog adoption / shelter matching?
   - Does it mention Thai shelters and adoption appointments?
   - Does it avoid vague wording that could look like gaming, dating, adult, or unrelated social networking?
2. Shelter page clarity:
   - Does `/shelter` clearly say partner shelter portal before any login form?
   - Does it explain dog listings, adoption appointments, and shelter operations?
3. Contact and ownership:
   - Is there a public contact method?
   - Is there a domain email if available?
   - Are official social profiles linked if available?
4. Shelter partner proof:
   - Are real partner shelters shown only if confirmed?
   - Are placeholders avoided on public pages?
5. Structured data:
   - Organization JSON-LD uses `PawJai Pet`.
   - WebSite JSON-LD uses `PawJai Pet`.
   - About/contact/social fields are added only if factual.
   - Animal shelter partner pages use appropriate schema only if the data exists.

Allowed improvements:

- Clearer copy in existing sections.
- Better metadata titles/descriptions.
- JSON-LD additions using factual data.
- Links to privacy/terms/safety/contact pages if they exist.
- Small trust badges or text labels only if true, not decorative claims.

Avoid:

- Fake partner names.
- Fake nonprofit/social-enterprise registration claims.
- Keyword stuffing.
- Redesigning the app.
- Adding hidden text for SEO.

Verification:

- `npm run typecheck`
- `node --test tests/seo.test.mjs`
- `npm run lint`
- `npm run build`
- Browser-check:
  - `/`
  - `/about`
  - `/shelter`
  - `/dogs`

Final answer:

- What trust signals were improved.
- Which facts still need founder confirmation.
- What should be submitted to web-filter vendors after deploy.
- Commit/push status.
