# Prompt: Submit PawJai For Web Filter Reclassification

You are continuing PAWJAI launch-readiness work for `https://www.pawjaipet.com`.

Problem:

- Some managed Wi-Fi networks block `pawjaipet.com/shelter`.
- The observed block page showed category `adult`.
- This is a third-party network filter classification problem, not an app outage.
- We cannot control each company's allowlist, but we can request vendor recategorization.

Read first:

1. `AGENTS.md`
2. `docs/playbooks/web-filter-reclassification.md`
3. `docs/marketing-search-launch-plan.md`
4. `docs/playbooks/production-domain-outage.md`

Important evidence to preserve:

- Blocked URL shown in screenshot: `pawjaipet.com/shelter`
- Block category shown: `adult`
- The page is a shelter login/portal for managing dog listings and adoption appointments.
- PAWJAI is a Thai dog adoption and shelter-matching platform.
- The site uses HTTPS, canonical metadata, structured data, and a public sitemap.

Submission targets:

1. Palo Alto Networks Test A Site:
   - `https://urlfiltering.paloaltonetworks.com/`
2. FortiGuard Web Filter Lookup:
   - `https://www.fortiguard.com/webfilter`
3. Cisco Talos Web Categorization:
   - `https://talosintelligence.com/reputation_center/web_categorization`
4. Google Safe Browsing Site Status:
   - `https://transparencyreport.google.com/safe-browsing/search`

URLs to submit/check:

- `https://www.pawjaipet.com/`
- `https://www.pawjaipet.com/shelter`
- `https://www.pawjaipet.com/dogs`
- `https://pawjaipet.com/`
- `pawjaipet.com`
- `media.pawjaipet.com` if the vendor accepts subdomains

Requested category:

- Pets
- Charitable Organizations
- Society / Lifestyle
- Non-Profit / Advocacy
- Business and Economy

Do not request generic risky categories. Do not submit false claims.

Suggested message:

Subject: Request to reclassify pawjaipet.com from Adult to Pet Adoption / Shelter Platform

Hello,

Our website `https://www.pawjaipet.com` is being incorrectly blocked as `adult` on a managed Wi-Fi network. PawJai Pet is a Thai dog adoption and shelter-matching platform. The `/shelter` page is a partner shelter login page used to manage dog listings and adoption appointments.

Please reclassify the following URLs away from `adult`:

- `https://www.pawjaipet.com/`
- `https://www.pawjaipet.com/shelter`
- `https://www.pawjaipet.com/dogs`
- `https://pawjaipet.com/`
- `pawjaipet.com`

Suggested category: Pets, Charitable Organizations, Society, Non-Profit, or Business and Economy, depending on your taxonomy.

The site serves normal HTTPS responses, canonical metadata, structured data, and a public sitemap at `https://www.pawjaipet.com/sitemap.xml`. It does not contain adult content.

Thank you.

Workflow:

1. Use a browser session only when the user is present for logins/captchas.
2. Do not enter passwords, payment info, or private personal data yourself.
3. Record each vendor checked, current category, submitted category, confirmation number, and expected review time in a new docs file or in `docs/playbooks/web-filter-reclassification.md`.
4. If a vendor says the URL is already correctly categorized, screenshot or copy the result and mark it.
5. Retest after 24-72 hours.

Final answer:

- Which vendors were checked.
- Current category for each, if visible.
- Which reclassification requests were submitted.
- Any confirmation IDs.
- Which items still require user/captcha/login.
