# Public trust pages

Implemented 11 September 2026. Authentication behaviour was not changed. The public About profile data was cleaned so only explicitly confirmed shelter partners can be published.

## Public surfaces

- `/privacy`: operational privacy notice, including account data, documents, product analytics, browser storage, providers, retention considerations, and requests.
- `/terms`: platform role, shelter decisions, responsible use, payments, and service expectations.
- `/safety`: visits, payment checks, safe information sharing, and adoption responsibility.
- `/about#contact`: support and partnership enquiries; no separate contact route needed.
- `/about#shelter-partners`: always-present partner explanation, including when no partner cards are configured.
- `/more` and the shared auth form link to policies. More and auth remain noindex.

New policy pages use canonical URLs on `https://www.pawjaipet.com`, WebPage structured data, and the public sitemap. Existing private-route indexing rules are preserved.

## Founder / legal follow-up

- Confirm the operator's registered legal name, address, and privacy contact/controller details. Do not invent company, nonprofit, or social-enterprise status.
- Confirm receiving and delivery for `hello@pawjaipet.com` or `support@pawjaipet.com` before replacing the documented mailbox `pawjaipet@gmail.com`.
- Confirm official social URLs before publishing them.
- Have Thai legal counsel review lawful bases, sensitive-document handling, retention periods, provider/international-transfer arrangements, children's use, rights handling, and payment terms against actual operations. The pages do not claim PDPA compliance or fixed retention/deletion deadlines.
- Official privacy reference reviewed: https://gppc.pdpc.or.th/privacy-policy/ . Its operator-specific terms and timelines were not copied into PawJai policies.

## Verification

Typecheck and all ten SEO tests passed. Lint has no errors (15 existing warnings). The default Turbopack build encounters a local process/port restriction; `npx next build --webpack` succeeds, including all public trust routes.

Browser checks covered `/`, `/about`, `/shelter`, `/dogs`, and `/privacy` on the local app. Migration `20260911130000` was applied directly to production and recorded in the migration ledger because the older migration history is incomplete. Check deployment separately: local verification does not establish that filtering vendors have recategorized the domain.
