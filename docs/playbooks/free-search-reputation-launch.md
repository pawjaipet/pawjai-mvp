# PawJai Free Search And Reputation Launch

Last updated: 2026-09-11

Production domain: `https://www.pawjaipet.com`

## Purpose

Use this playbook before spending on ads. The goal is to make PawJai Pet easier for search engines and network filters to understand without paying for Google Ads.

## Current Snapshot

Checks from the current network on 2026-09-11:

- DNS resolves for `pawjaipet.com` and `www.pawjaipet.com`.
- `pawjaipet.com` has a Google Search Console verification TXT record:
  - `google-site-verification=EniB1TpqnZz6OHx39yKMrP50YFYUVRwVCqIGMLaviGg`
- The Vercel default hostname loads successfully.
- The current network resets HTTPS connections to:
  - `https://www.pawjaipet.com/`
  - `https://www.pawjaipet.com/sitemap.xml`
  - `https://www.pawjaipet.com/robots.txt`
  - `https://www.pawjaipet.com/shelter`
- This still points to network filtering or reputation blocking rather than the app being down.
- Web search currently finds PawJai for domain-specific searches, but `PawJai Pet` still has competition from unrelated app/store/clinic results.

## Free Priority Order

1. Google Search Console
2. Web filter reclassification
3. Free business/profile citations
4. Social profiles and backlinks
5. Bing Webmaster Tools
6. Ongoing Search Console monitoring

## Google Search Console

Google says sitemap submission is a hint, not a guarantee, but it helps discovery and lets the owner see sitemap errors. Google also provides URL Inspection to test indexability and request indexing for owned URLs.

Do this from an unrestricted network if the current Wi-Fi blocks `pawjaipet.com`:

1. Open Search Console.
2. Select the domain property `pawjaipet.com`.
3. Go to **Sitemaps**.
4. Submit:

```txt
https://www.pawjaipet.com/sitemap.xml
```

5. Use URL Inspection and request indexing for:

```txt
https://www.pawjaipet.com/
https://www.pawjaipet.com/dogs
https://www.pawjaipet.com/shelter
https://www.pawjaipet.com/about
https://www.pawjaipet.com/privacy
https://www.pawjaipet.com/terms
https://www.pawjaipet.com/safety
```

6. Inspect at least three real available dog profile URLs from the sitemap.
7. Confirm private/admin/auth routes are excluded and not accidentally submitted.

## Web Filter Reclassification

This is the most important free fix for company Wi-Fi blocks.

Follow `docs/playbooks/web-filter-reclassification.md` and submit reclassification requests to:

- Palo Alto Networks Test A Site
- FortiGuard Web Filter Lookup
- Cisco Talos Content Categorization
- Google Safe Browsing Site Status

Use the exact blocked evidence:

```txt
URL: pawjaipet.com/shelter
Wrong category: adult
Correct category: Pets, Charitable Organizations, Society, Non-Profit / Advocacy, or Business and Economy
```

Retest after 24-72 hours.

## Free Business/Profile Citations

Create official profiles that consistently use the same name, URL, description, and contact details:

```txt
Name: PawJai Pet
Website: https://www.pawjaipet.com
Short description: PawJai Pet is a Thai dog adoption and shelter-matching platform.
Long description: PawJai Pet helps people browse adoptable dogs from Thai shelter partners, learn about each dog, and book adoption appointments. Partner shelters can manage dog listings and adoption visits.
```

Free profiles to prioritize:

- Google Business Profile, if PawJai has a real eligible business or service-area presence.
- Instagram profile link.
- Facebook page link.
- LinkedIn company page.
- Partner shelter pages linking back to PawJai.
- Any Thai startup/social-impact/community directories that allow free listings.

Do not claim nonprofit, charity, or foundation status unless the legal status is confirmed.

## Social And Backlink Tasks

Ask each partner shelter to link to PawJai using plain, descriptive text:

```txt
PawJai Pet dog adoption platform: https://www.pawjaipet.com
```

Best free backlinks:

- Shelter partner website pages.
- Shelter partner Facebook/Instagram bios.
- Rescue community posts.
- University/social-enterprise pages if applicable.
- Founder/company LinkedIn announcement.

The link text should naturally include `PawJai Pet`, `dog adoption Thailand`, or `dog adoption Bangkok`.

## Bing Webmaster Tools

Bing is free and can import verified sites from Google Search Console.

Submit:

```txt
https://www.pawjaipet.com/sitemap.xml
```

Then submit the same core URLs listed in the Search Console section.

## Weekly Free Monitoring

Every week until launch:

1. Search Google for:
   - `PawJai Pet`
   - `pawjaipet`
   - `pawjaipet.com`
   - `dog adoption bangkok pawjai`
   - `dog adoption thailand pawjai`
2. Search with `site:pawjaipet.com`.
3. Check Search Console:
   - Pages indexed
   - Sitemap status
   - Queries
   - Clicks
   - Impressions
   - Manual actions
   - Security issues
4. Retest blocked Wi-Fi networks.
5. Add vendor reclassification confirmations to `docs/playbooks/web-filter-reclassification-log-2026-09-11.md`.

## Sources

- Google sitemap guidance: `https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap`
- Google URL Inspection guidance: `https://support.google.com/webmasters/answer/9012289`
- Google recrawl guidance: `https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl`
- Google Business Profile: `https://business.google.com/en-all/business-profile/`
- Google Business Profile help: `https://support.google.com/business/answer/2911778`
- Bing URL submission guidance: `https://www.bing.com/webmasters/help/url-submission-62f2860b`
