# Prompt: Verify Search Console And Improve PawJai Brand Search Presence

You are continuing PAWJAI search launch work in `/Users/sudlabha/Desktop/paw`.

Goal:

Make `PawJai Pet`, `pawjaipet`, and adoption-intent searches more likely to surface `https://www.pawjaipet.com`, especially before marketing push.

Context:

- Brand is `PawJai Pet`, not `Project Pet`.
- Production canonical URL is `https://www.pawjaipet.com`.
- Some search results may still show competitors or similarly named pet clinics.
- Organic ranking is not instant. Search Console helps discovery and diagnostics, but does not guarantee ranking.

Read first:

1. `AGENTS.md`
2. `docs/marketing-search-launch-plan.md`
3. `docs/domain-and-indexing-plan.md`
4. `utils/seo.ts`
5. `utils/json-ld.ts`
6. `app/sitemap.ts`
7. `app/robots.ts`
8. Relevant Next.js 16 metadata docs under `node_modules/next/dist/docs/`.

Manual account steps:

- The user must be present for Google login, account selection, 2FA, and ownership verification.
- Do not click account-changing buttons without explicit user confirmation.

Search Console workflow:

1. Go to Google Search Console.
2. Add/verify a Domain property for `pawjaipet.com` if not already verified.
3. If DNS verification is required, guide the user to add the TXT record in Cloudflare.
4. Submit sitemap:
   - `https://www.pawjaipet.com/sitemap.xml`
5. Request indexing for:
   - `https://www.pawjaipet.com/`
   - `https://www.pawjaipet.com/dogs`
   - `https://www.pawjaipet.com/shelter`
   - `https://www.pawjaipet.com/about`
   - a few live dog profile URLs from the sitemap
6. Inspect coverage/indexing status and document errors.

Repo checks:

1. Confirm titles/descriptions prioritize `PawJai Pet`.
2. Confirm canonical URLs use `https://www.pawjaipet.com`.
3. Confirm private/admin/auth/transactional pages are noindex.
4. Confirm sitemap only includes public pages and available dog profiles.
5. Confirm `robots.txt` allows crawl of public pages.
6. Add or update tests if SEO behavior changes.

Brand keyword tracking:

Check and record search visibility for:

- `PawJai Pet`
- `pawjaipet`
- `pawjaipet.com`
- `pawjai dog adoption`
- `dog adoption bangkok`
- `dog adoption thailand`
- `PawJai Pet shelter`

Important:

- Do not overuse `Project Pet`. Treat it only as a defensive misspelling/mishearing keyword.
- Do not add hidden keyword stuffing.
- Google does not use the old meta keywords tag for ranking; prioritize visible content, titles, descriptions, structured data, links, and Search Console.

Verification:

- `npm run typecheck`
- `node --test tests/seo.test.mjs` if SEO code changes
- `npm run lint`
- `npm run build`
- Live checks after deploy:
  - `https://www.pawjaipet.com/robots.txt`
  - `https://www.pawjaipet.com/sitemap.xml`
  - `https://www.pawjaipet.com/`
  - `https://www.pawjaipet.com/shelter`

Final answer:

- Search Console property status.
- Sitemap submission status.
- Indexing request status.
- Current brand query observations.
- Any remaining Google-side waiting period.
