# Prompt: Strengthen PawJai Domain Email Trust

You are continuing PAWJAI domain trust work for `pawjaipet.com`.

Goal:

Make PAWJAI look more official and reduce spam/reputation risk by setting up domain email and sender authentication correctly.

Context:

- Production site: `https://www.pawjaipet.com`
- DNS is managed in Cloudflare.
- Transactional app email uses Resend.
- Existing docs mention Google Workspace and Cloudflare Email Routing options.
- Do not break app emails.

Read first:

1. `AGENTS.md`
2. `docs/playbooks/business-email-google-workspace.md`
3. `docs/playbooks/free-business-email-cloudflare-routing.md`
4. `docs/playbooks/production-domain-outage.md`
5. `docs/marketing-search-launch-plan.md`
6. `lib/resend.ts`
7. `utils/notification-email.ts`
8. `utils/booking-email.ts`

Decide with the user:

- Paid professional inbox: Google Workspace for `hello@pawjaipet.com`
- Free/simple forwarding: Cloudflare Email Routing for `hello@pawjaipet.com`
- Transactional sending: Resend on a sending subdomain such as `mail.pawjaipet.com` or `notifications.pawjaipet.com`

Important constraints:

- The user must handle account login, billing, and 2FA.
- Do not expose or commit API keys.
- Do not update `PAWJAI_EMAIL_FROM` to an unverified sender domain.
- Do not create duplicate root SPF records. Merge SPF sources into one TXT record if needed.

DNS/authentication tasks:

1. Confirm current Cloudflare DNS records.
2. Set up receiving email for `hello@pawjaipet.com`.
3. Configure SPF.
4. Configure DKIM for the inbox provider if available.
5. Configure DMARC initially as monitoring mode:
   - `v=DMARC1; p=none; rua=mailto:dmarc@pawjaipet.com`
6. Verify a Resend sending subdomain.
7. Add Resend SPF/DKIM/CNAME/TXT records exactly as Resend provides.
8. Only after Resend verification succeeds, update Vercel env if needed:
   - `PAWJAI_EMAIL_FROM`
9. Send test emails through existing scripts and confirm inbox delivery.

Repo/code tasks:

1. Search for Gmail fallback addresses and decide whether user-facing contact should move to `hello@pawjaipet.com`.
2. Keep operational/admin fallback emails if they are still needed internally.
3. Update docs to record current email architecture.
4. If code changes are made, add focused tests where relevant.

Verification:

- DNS lookups for MX, SPF, DKIM, DMARC.
- Resend domain status verified.
- `npm run email:test` if configured safely.
- `npm run typecheck`
- `npm run lint`
- `npm run build` if app code changed.

Final answer:

- Chosen email setup.
- DNS records added or still pending.
- Whether Resend is verified.
- Whether app sender was changed.
- Any manual follow-up needed.
