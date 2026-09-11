# PawJai Search Launch Plan

Production domain: `https://www.pawjaipet.com`

## Current Search Visibility Snapshot

Checked on 2026-09-03.

- `pawjaipet`: PawJai Pet is discoverable, though business-directory results may appear too.
- `PawJai Pet`: PawJai Pet is not consistently first-page for every user yet because the phrase has clinic/business-profile competition and the new domain still needs recrawling.
- `PawJai`: PawJai appears, but the query has competition from other Pawjai/Paw Jai pet businesses and apps.
- `Project Pet`: Treat only as a possible mishearing or typo. PawJai Pet should not center this phrase unless users keep typing it.

Code-side search signals now include these brand aliases in metadata and JSON-LD:

- PawJai Pet
- PawJai
- pawjaipet
- pawjaipet.com
- PawJai Thailand
- PawJai shelter
- PawJai dog adoption
- Project Pet
- Project Pet Thailand
- Project Pet shelter

Organic ranking for `PawJai Pet` should improve once Google recrawls the brand-first metadata and Search Console requests. Ranking for `Project Pet` cannot be guaranteed because Google ranks by relevance, authority, history, and user behavior, and that phrase already belongs to other organizations.

Free launch path is now the default. Follow [`playbooks/free-search-reputation-launch.md`](playbooks/free-search-reputation-launch.md) before spending on ads. Use the paid Google Ads draft only if PawJai needs immediate paid visibility after the free indexing and reputation steps are in motion.

## Keyword Buckets

Primary brand keywords:

- pawjai pet
- pawjaipet
- pawjaipet.com
- pawjai
- paw jai pet
- paw jai
- pawjai thailand
- pawjai dog adoption
- pawjai shelter

Adopter intent keywords:

- dog adoption bangkok
- dog adoption thailand
- adopt dog bangkok
- adopt dog thailand
- adopt a dog bangkok
- adopt a dog thailand
- dogs for adoption bangkok
- dogs for adoption thailand
- rescue dogs for adoption thailand
- shelter dogs for adoption thailand
- Thai rescue dog adoption
- Thai street dog adoption
- stray dog adoption Thailand
- puppy adoption Bangkok
- puppy adoption Thailand
- small dog adoption Bangkok
- medium dog adoption Thailand
- senior dog adoption Thailand
- vaccinated dog adoption Thailand
- sterilized dog adoption Thailand
- book dog adoption visit Bangkok

Shelter partner keywords:

- shelter dog listing Thailand
- dog shelter management Thailand
- dog adoption platform Thailand
- shelter adoption appointments
- rescue dog listing platform
- dog shelter portal
- PawJai Pet shelter portal
- shelter partner PawJai

Donation/support keywords:

- donate to dog shelter Thailand
- sponsor rescue dog Thailand
- help shelter dogs Thailand
- support dog rescue Thailand
- donate to rescue dogs Bangkok

Defensive typo/mishearing keywords:

- paw jai pet
- pawj ai pet
- pawjai pets
- porjai pet
- por jai pet
- project pet
- project pet thailand
- project pet shelter

## Search Console

1. Verify the domain property for `pawjaipet.com`.
2. Submit `https://www.pawjaipet.com/sitemap.xml`.
3. Request indexing for:
   - `https://www.pawjaipet.com/`
   - `https://www.pawjaipet.com/dogs`
   - `https://www.pawjaipet.com/shelter`
   - `https://www.pawjaipet.com/about`
4. Inspect one or two live dog profile URLs from the sitemap.

## Reputation And Wi-Fi Filters

1. Check Google Safe Browsing for `https://www.pawjaipet.com/`.
2. If a network blocks the site, ask which filtering vendor is used.
3. Submit the domain for reclassification as a pet adoption / nonprofit / community platform.
4. Keep Cloudflare DNS, HTTPS, sitemap, robots, and canonical URLs stable while the domain builds reputation.

## Free Search Launch

Goal: make PawJai visible through search-engine discovery, trust pages, profile citations, backlinks, and filter recategorization before using paid traffic.

Priority actions:

1. Submit `https://www.pawjaipet.com/sitemap.xml` in Google Search Console.
2. Request indexing for `/`, `/dogs`, `/shelter`, `/about`, `/privacy`, `/terms`, and `/safety`.
3. Submit web-filter reclassification requests for the wrong `adult` category.
4. Create or complete free official profiles, starting with Google Business Profile if PawJai is eligible.
5. Ask partner shelters to link to PawJai with descriptive anchor text.
6. Submit the sitemap in Bing Webmaster Tools.
7. Review Search Console query and indexing data weekly.

Core URLs:

- `https://www.pawjaipet.com/`
- `https://www.pawjaipet.com/dogs`
- `https://www.pawjaipet.com/shelter`
- `https://www.pawjaipet.com/about`
- `https://www.pawjaipet.com/privacy`
- `https://www.pawjaipet.com/terms`
- `https://www.pawjaipet.com/safety`

Free profile description:

```text
PawJai Pet is a Thai dog adoption and shelter-matching platform. We help people browse adoptable dogs from Thai shelter partners, learn about each dog, and book adoption appointments. Partner shelters can manage dog listings and adoption visits.
```

## Optional Paid Google Ads Draft

This is optional and not free. Use it only after explicit spend approval.

Goal: make PawJai visible while organic search ranking catches up.

Campaign type: Search

Landing pages:

- Brand/adopter traffic: `https://www.pawjaipet.com/`
- Dog browsing: `https://www.pawjaipet.com/dogs`
- Shelter partners: `https://www.pawjaipet.com/shelter`

Starter exact/phrase keywords:

- `pawjai pet`
- `pawjaipet`
- `pawjai`
- `pawjai thailand`
- `pawjai dog adoption`
- `pawjai shelter`
- `adopt dog thailand`
- `dog adoption thailand`
- `dog adoption bangkok`
- `adopt dog bangkok`
- `dogs for adoption bangkok`
- `rescue dog thailand`
- `shelter dog adoption thailand`

Defensive exact/phrase keywords to test only if misheard searches appear:

- `project pet`
- `project pet shelter`
- `project pet thailand`
- `project pet dog adoption`

Suggested negative keywords:

- job
- jobs
- salary
- toys
- food
- grooming
- breeder
- puppy for sale
- buy puppy

Ad copy draft:

Headline options:

- PawJai Pet Adoption
- Adopt Dogs In Thailand
- Find Your Dog Match
- Browse Shelter Dogs
- PawJai Shelter Portal

Description options:

- Browse adoptable dogs from Thai shelter partners and book a shelter visit.
- Meet verified rescue dogs and find a companion who fits your home.
- Partner shelters can sign in to manage listings and appointments.

Launch checks:

- Use manual CPC or maximize clicks with a small daily cap at first.
- Start with Thailand targeting.
- Track clicks to `/`, `/dogs`, and `/shelter`.
- Review search terms daily during the first week and add negatives.
