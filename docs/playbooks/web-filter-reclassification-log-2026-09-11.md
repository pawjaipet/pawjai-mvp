# PawJai Web Filter Reclassification Log - 2026-09-11

Production domain: `https://www.pawjaipet.com`

## Summary

Some managed networks appear to block PawJai at the domain/SNI layer. The known mobile block page for `pawjaipet.com/shelter` labeled the site as `adult`, while the PawJai application itself is a dog adoption and shelter-matching platform.

The current local network check also resets TLS when the client uses `pawjaipet.com`, `www.pawjaipet.com`, or `media.pawjaipet.com` as the hostname. A control request to the Vercel project hostname succeeds, which means the app deployment can be reachable while the PawJai domain itself is filtered or reset by the network path.

## Evidence Checked

Date/time: 2026-09-11, Asia/Bangkok.

Observed historical block:

- URL: `pawjaipet.com/shelter`
- Category shown by network filter: `adult`
- Browser context: LINE in-app browser on mobile
- Purpose of blocked page: shelter login/portal for dog listings and adoption appointments

DNS:

- `www.pawjaipet.com` resolves through Vercel DNS.
- `media.pawjaipet.com` resolves through Cloudflare.

HTTP/TLS checks from current network:

- `https://pawjai-mvp.vercel.app/` returned `HTTP 307` from Vercel.
- `https://www.pawjaipet.com/` reset during HTTPS connection.
- `https://pawjaipet.com/` reset during HTTPS connection.
- `https://media.pawjaipet.com/.../dog4A.jpg` reset during HTTPS connection.
- TLS handshake to Vercel edge with SNI `pawjai-mvp.vercel.app` succeeded.
- TLS handshake to Vercel edge with SNI `www.pawjaipet.com` reset.
- TLS handshake to Cloudflare edge with SNI `media.pawjaipet.com` reset.

Interpretation:

- DNS is not the immediate failure.
- The Vercel project hostname is reachable.
- The shared failure across `pawjaipet.com`, `www.pawjaipet.com`, and `media.pawjaipet.com` points to hostname/domain filtering on the network path or a vendor category/reputation issue.
- This is separate from app uptime and separate from Codex/ChatGPT availability.

## Vendor Status

| Vendor | Status checked | Current result | Submission status | Notes |
| --- | --- | --- | --- | --- |
| Palo Alto Networks / PAN-DB | Public lookup page checked | Page says lookup supports category view and category-change requests below search results | Not submitted | Category change requests require login as of 2026-03-15. User/account action required. |
| FortiGuard | Lookup attempted | FortiGuard lookup page was itself blocked by the current network before lookup could complete | Not submitted | Retest from an unrestricted network, hotspot, or browser session. |
| Cisco Talos | Public categorization page checked | Page says content categorization tickets require Cisco login | Not submitted | User/account action required. |
| Google Safe Browsing | Exact shelter URL status endpoint checked | Returned a structured status payload with no visible true threat flags for the shelter URL | No false-positive request submitted | Keep Search Console verified for alerts and security review if Google ever flags the site. |

## Next Actions

1. Submit Palo Alto category-change request while logged in.
2. Retest FortiGuard from a network that does not block the FortiGuard lookup page.
3. Submit Cisco Talos content categorization ticket while logged in.
4. Keep Google Search Console verified and check Security Issues.
5. After each vendor request, record confirmation IDs and expected review time here.
6. Retest the same blocked Wi-Fi after 24-72 hours.

## Recommended Category Language

Requested categories, depending on vendor taxonomy:

- Pets
- Charitable Organizations
- Society / Lifestyle
- Non-Profit / Advocacy
- Business and Economy

Submission message:

```text
Subject: Request to reclassify pawjaipet.com from Adult to Pet Adoption / Shelter Platform

Hello,

Our website https://www.pawjaipet.com is being incorrectly blocked as adult on a managed Wi-Fi network. PawJai Pet is a Thai dog adoption and shelter-matching platform. The /shelter page is a partner shelter login page used to manage dog listings and adoption appointments.

Please reclassify the following URLs away from adult:

- https://www.pawjaipet.com/
- https://www.pawjaipet.com/shelter
- https://www.pawjaipet.com/dogs
- https://pawjaipet.com/
- pawjaipet.com

Suggested category: Pets, Charitable Organizations, Society, Non-Profit, or Business and Economy, depending on your taxonomy.

The site serves HTTPS, canonical metadata, structured data, and a public sitemap at https://www.pawjaipet.com/sitemap.xml. It does not contain adult content.

Thank you.
```

## Links

- Palo Alto Networks Test A Site: `https://urlfiltering.paloaltonetworks.com/query/`
- Palo Alto category-change page pattern: `https://urlfiltering.paloaltonetworks.com/single_cr/?url=pawjaipet.com`
- FortiGuard Web Filter Lookup: `https://www.fortiguard.com/webfilter`
- Cisco Talos Content Categorization: `https://talosintelligence.com/reputation_center/web_categorization`
- Google Safe Browsing Site Status: `https://transparencyreport.google.com/safe-browsing/search?url=pawjaipet.com`
