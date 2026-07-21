# Production Domain Outage Playbook

Last incident check: 2026-07-21.

## New Production Domain

As of 2026-07-21, PawJai production has been moved to `pawjaipet.com`.

- Canonical app URL: `https://www.pawjaipet.com`
- Apex behavior: `https://pawjaipet.com` redirects to `https://www.pawjaipet.com`
- Media CDN URL: `https://media.pawjaipet.com/file/pawjai`
- DNS source of truth: Cloudflare DNS in the `pawjaipet@gmail.com` controlled Cloudflare account
- Vercel project: `pawjai-mvp`
- Supabase project: `bdnyvcvkyepipdcygkvn`

Required DNS records:

- `pawjaipet.com` `CNAME` `c46106c73fbaa3b7.vercel-dns-017.com` with Cloudflare proxy disabled
- `www.pawjaipet.com` `CNAME` `c46106c73fbaa3b7.vercel-dns-017.com` with Cloudflare proxy disabled
- `media.pawjaipet.com` `CNAME` `f006.backblazeb2.com` with Cloudflare proxy enabled

Required auth settings:

- Supabase Site URL: `https://www.pawjaipet.com`
- Supabase Redirect URLs:
  - `http://localhost:3001/auth/callback`
  - `https://www.pawjaipet.com/auth/callback`
  - `https://www.pawjaipet.com/auth/confirm`
- Google OAuth JavaScript origins:
  - `http://localhost:3001`
  - `https://pawjaipet.com`
  - `https://www.pawjaipet.com`
- Google OAuth redirect URI remains the Supabase callback URL:
  - `https://bdnyvcvkyepipdcygkvn.supabase.co/auth/v1/callback`

Required Vercel env vars:

- `NEXT_PUBLIC_SITE_URL=https://www.pawjaipet.com`
- `PAWJAI_SITE_ORIGIN=https://www.pawjaipet.com`
- `PAWJAI_B2_PUBLIC_BASE_URL=https://media.pawjaipet.com/file/pawjai`

Do not change `PAWJAI_EMAIL_FROM` to a `pawjaipet.com` sender until `pawjaipet.com` has been verified in Resend.

## Current 2026-07-20 Finding

`pawjai.co.th`, `www.pawjai.co.th`, and `media.pawjai.co.th` fail public DNS lookup with `NXDOMAIN` / `ENOTFOUND`.

THNIC WHOIS reported:

- Domain: `PAWJAI.CO.TH`
- Registrar: `THNIC`
- Name servers: `NS1.EXPIRED-BKK1.CLOUD.Z.COM`, `NS2.EXPIRED-BKK1.CLOUD.Z.COM`
- Status: `HOLD`
- Expiry date: `10 Jul 2026`
- Updated date: `16 Jul 2026`

The Vercel app still answers when DNS is bypassed and the request is forced to Vercel's edge IP. This means the outage is domain registration/DNS delegation, not a Next.js, Supabase, or Codex runtime problem.

## Immediate Recovery

1. Log in to the domain registrar account for `pawjai.co.th`. WHOIS points to THNIC, with expired Z.com nameservers, so start with the Z.com / THNIC account used to buy the domain.
2. Renew `pawjai.co.th` and clear the registry `HOLD` status.
3. Restore DNS delegation.
   - Preferred: point the registrar nameservers back to the active Cloudflare zone for `pawjai.co.th`.
   - If Cloudflare access is unavailable, temporarily use registrar DNS:
     - `pawjai.co.th` `A` `76.76.21.21`
     - `www.pawjai.co.th` `CNAME` `cname.vercel-dns.com`
     - Restore `media.pawjai.co.th` from the Cloudflare/Backblaze CDN settings before relying on media-heavy pages.
4. Confirm Vercel still has the custom domains attached to the production project.
5. Verify:
   - `dig pawjai.co.th A`
   - `dig www.pawjai.co.th A`
   - `dig media.pawjai.co.th A`
   - `npm run health:production`
   - Browser check: `https://www.pawjai.co.th`, `/admin`, and a dog detail page with images.

## Prevention

- Keep registrar access independent from any AI tool account.
- Add at least two human owners/admins to the registrar, Cloudflare, Vercel, Supabase, GitHub, Backblaze, and Resend.
- Turn on auto-renew for `pawjai.co.th`.
- Add a calendar reminder at 60, 30, 14, and 7 days before renewal.
- Keep `.github/workflows/production-health.yml` enabled. It runs `scripts/check-production-health.mjs` every 30 minutes and fails if DNS or HTTP is broken.

## Important Note

Codex/ChatGPT availability does not host the PawJai production app. PawJai production depends on:

- Domain registrar/THNIC registration
- DNS delegation, preferably Cloudflare
- Vercel project and custom-domain binding
- Supabase, Backblaze, and Resend service accounts

If Codex is down, PawJai should stay online as long as these service accounts and renewals are healthy.
