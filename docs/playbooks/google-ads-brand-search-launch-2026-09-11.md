# PawJai Pet Google Ads Brand Search Launch - 2026-09-11

Production domain: `https://www.pawjaipet.com`

## Status

Draft only. No campaign was published and no spend was approved.

Google Ads account check:

- Account opened under `pawjaipet@gmail.com`.
- Google Ads is in first-campaign onboarding, not an existing campaign dashboard.
- The visible onboarding page is "Tell us about your business."
- Business name field currently shows `PAWjaiPet`.
- Destination selection is currently set to "Your Business Profile page (optimised for ads)."
- Recommendation: switch destination to "Your website" and use `https://www.pawjaipet.com/` before publishing.
- Google Ads showed an ad blocker warning. Disable the ad blocker for Google Ads during setup.

Manual steps still required:

- User must handle Google login, billing, business verification, payment method, and final publish approval.
- Do not publish or spend from Codex without explicit user approval at the final submit step.
- Final URL verification is still blocked from the current network because HTTPS requests to `pawjaipet.com`, `www.pawjaipet.com`, and `media.pawjaipet.com` reset during TLS. Verify the final URLs from an unrestricted network or Vercel dashboard before publishing.

## Campaign Setup

Campaign name:

```text
PAWJAI | Brand + Adoption Search | Thailand | 2026-09
```

Goal:

```text
Website traffic
```

Campaign type:

```text
Search
```

Initial status:

```text
Paused or draft until founder approval
```

Networks:

- Google Search Network: on
- Search partners: off for week 1, then test later if quality is good
- Display Network: off

Location:

- Thailand
- Optional separate test campaign or ad group for Bangkok

Location option:

```text
Presence: People in or regularly in your targeted locations
```

Languages:

- English
- Thai

Bidding:

- Start with clicks or manual CPC if the UI allows it.
- Use a strict daily cap.
- Do not use broad match until conversions and negatives are stable.

Suggested starting budget:

- THB 150-300/day for brand/search validation.
- Raise only after search terms and destination approval look clean.

## Final URLs

Brand/adopter:

```text
https://www.pawjaipet.com/
```

Dog browsing:

```text
https://www.pawjaipet.com/dogs
```

Shelter partners:

```text
https://www.pawjaipet.com/shelter
```

## Ad Groups And Keywords

Use exact and phrase match first. Google Ads documentation says exact match gives the most control, while phrase match can reach more related searches. Avoid broad match until there is enough conversion and search-term data.

### 1. Brand

Final URL: `https://www.pawjaipet.com/`

Keywords:

```text
[pawjai pet]
"pawjai pet"
[pawjaipet]
"pawjaipet"
[pawjai]
"pawjai thailand"
"pawjai dog adoption"
"pawjai shelter"
```

### 2. Adoption Intent - English

Final URL: `https://www.pawjaipet.com/dogs`

Keywords:

```text
"dog adoption bangkok"
"dog adoption thailand"
"adopt dog bangkok"
"adopt dog thailand"
"adopt a dog bangkok"
"dogs for adoption bangkok"
"dogs for adoption thailand"
"rescue dogs thailand"
"rescue dogs for adoption thailand"
"shelter dogs for adoption thailand"
"thai rescue dog adoption"
"stray dog adoption thailand"
"book dog adoption visit bangkok"
```

### 3. Adoption Intent - Thai

Final URL: `https://www.pawjaipet.com/dogs`

Keywords:

```text
"รับเลี้ยงสุนัข"
"รับเลี้ยงหมา"
"รับเลี้ยงสุนัข กรุงเทพ"
"รับเลี้ยงหมา กรุงเทพ"
"สุนัขหาบ้าน"
"หมาหาบ้าน"
"น้องหมาหาบ้าน"
"สุนัขจรจัด หาบ้าน"
"รับเลี้ยงสุนัขจรจัด"
"ศูนย์พักพิงสุนัข"
"บ้านพักพิงสุนัข"
"หาบ้านให้น้องหมา"
```

### 4. Shelter Partners

Final URL: `https://www.pawjaipet.com/shelter`

Keywords:

```text
"dog shelter portal"
"dog adoption platform thailand"
"shelter dog listing thailand"
"rescue dog listing platform"
"shelter adoption appointments"
"pawjai shelter"
"pawjai pet shelter"
"pawjai pet shelter portal"
```

### 5. Defensive Typo/Mishearing

Final URL: `https://www.pawjaipet.com/`

Keep this ad group paused at launch or cap it very low. Use only if Search Console, Google Ads search terms, or user interviews show people are typing these.

Keywords:

```text
"project pet"
"project pet thailand"
"project pet shelter"
"porjai pet"
"por jai pet"
"paw jai pet"
"pawjai pets"
```

## Campaign Negative Keywords

Add as campaign-level phrase or broad negatives depending on Google Ads UI support:

```text
job
jobs
salary
career
careers
toys
food
grooming
clinic
vet
veterinary
breeder
breeders
puppy for sale
buy puppy
dog for sale
dogs for sale
game
gaming
adult
dating
escort
```

## Responsive Search Ads

Google responsive search ads allow up to 15 headlines and 4 descriptions. Headlines must be 30 characters or fewer, and descriptions must be 90 characters or fewer.

### Brand RSA

Final URL: `https://www.pawjaipet.com/`

Display path:

```text
adopt
dogs
```

Headlines:

```text
PawJai Pet Adoption
PawJai Pet Thailand
Adopt Dogs In Thailand
Find Your Dog Match
Browse Shelter Dogs
Thai Shelter Dogs
Book A Shelter Visit
Meet Adoptable Dogs
Rescue Dogs In Thailand
Dog Adoption Bangkok
```

Descriptions:

```text
Browse adoptable dogs from Thai shelter partners and book a shelter visit.
Meet rescue dogs and find a companion who fits your home.
PawJai Pet helps adopters discover dogs and connect with shelter partners.
Start with PawJai Pet, a dog adoption platform for Thailand.
```

### Shelter Partner RSA

Final URL: `https://www.pawjaipet.com/shelter`

Display path:

```text
shelter
portal
```

Headlines:

```text
PawJai Shelter Portal
PawJai Pet For Shelters
Manage Dog Listings
Adoption Appointment Tool
Shelter Partner Portal
List Adoptable Dogs
Thailand Shelter Platform
Dog Adoption Platform
```

Descriptions:

```text
Partner shelters can manage dog listings and adoption appointments.
PawJai Pet gives shelters a simple portal for adoption matching.
List adoptable dogs and help people book shelter visits.
Built for Thai shelter partners preparing dogs for adoption.
```

### Thai RSA

Final URL: `https://www.pawjaipet.com/dogs`

Display path:

```text
adopt
dogs
```

Headlines:

```text
PawJai Pet
รับเลี้ยงสุนัข
สุนัขหาบ้าน
หมาหาบ้าน
รับเลี้ยงหมา
หาน้องหมาที่ใช่
น้องหมาหาบ้าน
```

Descriptions:

```text
ค้นหาน้องหมาที่พร้อมหาบ้าน และนัดหมายกับศูนย์พักพิงผ่าน PawJai Pet
PawJai Pet ช่วยให้คนรักสุนัขค้นหาน้องหมาที่เหมาะกับบ้านของตัวเอง
ดูสุนัขที่พร้อมรับเลี้ยงจากพาร์ทเนอร์ศูนย์พักพิงในประเทศไทย
```

## Sitelink Assets

Use these only if Google Ads asks for assets:

| Sitelink | URL | Description 1 | Description 2 |
| --- | --- | --- | --- |
| Browse Dogs | `https://www.pawjaipet.com/dogs` | Meet adoptable dogs | Find a dog match |
| Shelter Portal | `https://www.pawjaipet.com/shelter` | Partner shelter login | Manage appointments |
| About PawJai Pet | `https://www.pawjaipet.com/about` | Dog adoption mission | Thai shelter partners |
| Book A Visit | `https://www.pawjaipet.com/dogs` | Choose a dog first | Schedule a shelter visit |

## Policy And Destination Checklist

Before publishing:

1. Final URL uses `https://www.pawjaipet.com`, not the Business Profile page.
2. Landing page loads on common browsers and devices from an unrestricted network.
3. Back button works normally.
4. Site clearly says dog adoption / shelter matching.
5. No adult, gaming, dating, or misleading claims appear in ad copy.
6. No claim of nonprofit/social-enterprise legal status unless confirmed.
7. Privacy and terms pages should be live before scaling, especially for account creation and Google/OAuth trust.
8. Web filter recategorization should be submitted, but it does not have to be completed before a tiny brand campaign draft exists.

## Conversion Tracking Plan

Do not optimize for conversions until events are intentionally tracked.

Initial low-risk conversions to consider:

- Click to `/dogs`
- Click to `/shelter`
- Booking flow started
- Appointment booked
- Shelter sign-in started
- Ad inquiry submitted

Do not import or create conversion tags without checking the existing analytics/events implementation first.

## Week One Review

Review daily for the first 7 days:

- Search terms
- Disapproved ads
- Destination warnings
- Spend
- Click-through rate
- Cost per click
- Click quality by route
- Any terms that imply adult/gaming/dating confusion

Add negatives aggressively before raising budget.

## Sources

- Google Ads Search campaign setup: `https://support.google.com/google-ads/answer/9510373`
- Google keyword match types: `https://support.google.com/google-ads/answer/7478529`
- Google responsive search ads: `https://support.google.com/google-ads/answer/7684791`
- Google destination requirements: `https://support.google.com/adspolicy/answer/6368661`
