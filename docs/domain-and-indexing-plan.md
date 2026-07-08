# PawJai Domain and Indexing Plan

Last updated: 2026-07-05

## Recommendation

Yes, PawJai should do this now, but as a structure and SEO cleanup rather than a full domain migration.

The current production domain remains:

```txt
https://www.pawjai.co.th
```

Auth also stays on the current domain:

```txt
https://www.pawjai.co.th/auth/callback
https://www.pawjai.co.th/auth/confirm
```

This keeps the production app stable while making the public surface easier for Google to understand. A future split can then be planned cleanly:

```txt
www.pawjai.co.th -> public website and SEO pages
app.pawjai.co.th -> logged-in app, auth, account, bookings, documents
```

## Route Visibility Map

### Public and Indexable

These routes are intended to be crawlable and appear in the sitemap.

| Route | Purpose | Current handling |
| --- | --- | --- |
| `/` | Main public PawJai entry point | Canonical to `https://www.pawjai.co.th/` |
| `/about` | Mission, shelters, contact, how adoption works | Canonical to `/about` |
| `/dogs` | Public available dog browsing entry | Canonical to `/dogs` |
| `/dogs/[id]` | Public dog profile | Included in sitemap only when `adoption_status = available` |

### Public but Noindex

These can be reached publicly but should not be search results.

| Route | Reason |
| --- | --- |
| `/adopted` | App/utility surface, not a primary SEO page |
| `/auth` | Sign-in/sign-up utility page |
| `/auth/callback` | Supabase auth callback |
| `/auth/confirm` | Supabase email confirmation |
| `/dogs/[id]/donate` | Transactional donation/payment helper page |
| `/home` | Redirect alias for `/` |
| `/more` | App menu surface |
| `/swipe` | Duplicate app feed surface; `/` and `/dogs` are the canonical public entries |

### Private and Noindex

These are adopter app surfaces, not SEO pages.

| Route | Reason |
| --- | --- |
| `/appointments/**` | User booking data |
| `/documents/**` | Verification flow and private documents |
| `/donations/**` | Donation actions and history surfaces |
| `/filter` | User preference state |
| `/messages/**` | User/shelter conversation surfaces |
| `/onboarding/**` | Setup flow |
| `/profile` | User profile |
| `/schedule/**` | Booking flow |
| `/settings/**` | Account settings |

### Admin and Internal Noindex

| Route | Reason |
| --- | --- |
| `/admin/**` | Admin workspace |
| `/admindraft` | Internal admin draft |
| `/ads` | Admin/internal ads gate |
| `/booking/**` | Shared internal booking workspace for PawJai admin and shelter staff |
| `/doglistings` | Internal listing surface |
| `/shelter/**` | Shelter staff portal and shelter-only workflows |

## Implemented SEO Rules

- Canonical production domain is centralized in `utils/seo.ts` as `https://www.pawjai.co.th`.
- Global metadata in `app/layout.tsx` uses that domain as `metadataBase`.
- Public pages have route-level canonical metadata:
  - `/`
  - `/about`
  - `/dogs`
  - `/dogs/[id]`
- `app/robots.ts` generates `/robots.txt`.
- `app/sitemap.ts` generates `/sitemap.xml`.
- Sitemap includes:
  - Home
  - About
  - Dogs listing
  - Available dog profiles from Supabase, up to the current query limit
- Robots disallows auth, private, admin, onboarding, scheduling, document, message, donation, and internal routes.
- Private route branches have noindex metadata layouts.

## Future App Domain Split Plan

Do not switch this yet unless the production app is ready for a dedicated app domain.

When PawJai is ready, plan the change in this order:

1. Add `app.pawjai.co.th` in Vercel and point Cloudflare DNS to Vercel.
2. Keep `www.pawjai.co.th` as the public SEO property.
3. Move logged-in app entry points to `app.pawjai.co.th`.
4. Update Supabase Auth:
   - Site URL
   - Additional redirect URLs
   - Email templates if they hard-code auth links
5. Update Google OAuth authorized redirect URIs:
   - `https://app.pawjai.co.th/auth/callback`
   - Keep `https://www.pawjai.co.th/auth/callback` during transition if users may still have old links.
6. Confirm Supabase cookie/session behavior across subdomains.
7. Add redirects from old app routes on `www` to the matching `app` route only after auth and cookies are tested.
8. Keep public canonical URLs on `www`, not `app`.

## Google Search Console Checklist

1. Add a Domain property for:

```txt
pawjai.co.th
```

2. Verify ownership using the DNS TXT record in Cloudflare.
3. Submit the sitemap:

```txt
https://www.pawjai.co.th/sitemap.xml
```

4. Inspect and request indexing for:

```txt
https://www.pawjai.co.th/
https://www.pawjai.co.th/about
https://www.pawjai.co.th/dogs
```

5. Inspect a few real available dog profile URLs from the sitemap.
6. Confirm excluded/private routes are not submitted for indexing.

## Operational Notes

- Do not add private, admin, auth, document, message, appointment, schedule, settings, or donation pages to the sitemap.
- Do not canonicalize to Vercel preview URLs, localhost, Supabase URLs, or the non-www domain.
- Do not move auth callbacks to `app.pawjai.co.th` until Supabase, Google OAuth, cookies, Vercel, and Cloudflare are changed together.
