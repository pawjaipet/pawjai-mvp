# Domain Email Trust

Last checked: 2026-09-11.

This is the current PawJai email architecture for `pawjaipet.com`.

## Chosen Setup

- Human receiving: Cloudflare Email Routing for `@pawjaipet.com` aliases forwarded to `pawjaipet@gmail.com`.
- Recommended next alias: `hello@pawjaipet.com` forwarded to `pawjaipet@gmail.com`.
- Transactional sending: Resend using the root sender `PawJai <notifications@pawjaipet.com>` until a dedicated Resend sending subdomain is fully verified.
- Paid inboxes: Google Workspace remains the future upgrade path when PawJai needs true company mailboxes, calendars, Drive ownership, and separate employee logins.

Do not change `PAWJAI_EMAIL_FROM` to `notifications@mail.pawjaipet.com` or another subdomain sender until Resend shows that exact sending domain as verified.

## Public DNS Snapshot

Read-only DNS lookups on 2026-09-11 showed:

```txt
MX pawjaipet.com
56 route1.mx.cloudflare.net.
56 route2.mx.cloudflare.net.
91 route3.mx.cloudflare.net.

TXT pawjaipet.com
"google-site-verification=EniB1TpqnZz6OHx39yKMrP50YFYUVRwVCqIGMLaviGg"
"v=spf1 include:_spf.mx.cloudflare.net ~all"

TXT cf2024-1._domainkey.pawjaipet.com
"v=DKIM1; h=sha256; k=rsa; p=..."

TXT _dmarc.pawjaipet.com
"v=DMARC1; p=none;"

TXT resend._domainkey.pawjaipet.com
"p=..."

TXT send.pawjaipet.com
"v=spf1 include:amazonses.com ~all"

MX send.pawjaipet.com
10 feedback-smtp.ap-northeast-1.amazonses.com.
```

No public records were found for:

```txt
TXT mail.pawjaipet.com
MX mail.pawjaipet.com
TXT notifications.pawjaipet.com
MX notifications.pawjaipet.com
TXT resend._domainkey.notifications.pawjaipet.com
TXT _dmarc.mail.pawjaipet.com
```

`resend._domainkey.mail.pawjaipet.com` exists, but `mail.pawjaipet.com` does not have the matching visible SPF/MX return-path records from the DNS checks above. Treat `mail.pawjaipet.com` as not verified until the Resend dashboard says otherwise.

## What This Means

- Receiving mail is configured through Cloudflare Email Routing at the root domain.
- Root SPF currently authorizes Cloudflare forwarding only. Do not add a second root SPF TXT record.
- Resend root-domain sending appears partially or fully configured from public DNS because `resend._domainkey.pawjaipet.com`, `send.pawjaipet.com` SPF, and `send.pawjaipet.com` MX exist. Final verification still must be confirmed inside the Resend dashboard.
- DMARC is correctly in monitor mode, but it is missing the aggregate report mailbox requested by the trust plan.

## Pending Dashboard Tasks

Cloudflare:

1. Confirm or create `hello@pawjaipet.com` as an Email Routing rule to `pawjaipet@gmail.com`.
2. Confirm or create `support@pawjaipet.com` if app pages continue linking to support.
3. Create `dmarc@pawjaipet.com` as a forwarding alias to `pawjaipet@gmail.com`.
4. Update `_dmarc.pawjaipet.com` TXT to:

```txt
v=DMARC1; p=none; rua=mailto:dmarc@pawjaipet.com
```

Resend:

1. Open the Domains dashboard.
2. Confirm whether `pawjaipet.com` is verified.
3. If moving to a subdomain sender, create and verify exactly one dedicated sending domain, preferably `notifications.pawjaipet.com`.
4. Add the SPF, DKIM, MX, CNAME, or TXT records exactly as Resend provides.
5. Only after that exact domain verifies, update `PAWJAI_EMAIL_FROM` in Vercel.

## App Sender Policy

Current code defaults transactional mail to:

```txt
PawJai <notifications@pawjaipet.com>
```

Keep that sender unless Resend confirms a better sending domain. The app blocks `mail.pawjaipet.com` as a sender fallback because that subdomain was not verified when the sender guard was added.

Internal fallbacks such as `pawjaipet@gmail.com` are still acceptable for missing recipient fallback and account ownership. User-facing support/contact links should use `hello@pawjaipet.com` or `support@pawjaipet.com` only after the Cloudflare routing rule exists.

## Verification Commands

```sh
dig +short MX pawjaipet.com
dig +short TXT pawjaipet.com
dig +short TXT cf2024-1._domainkey.pawjaipet.com
dig +short TXT _dmarc.pawjaipet.com
dig +short TXT resend._domainkey.pawjaipet.com
dig +short TXT send.pawjaipet.com
dig +short MX send.pawjaipet.com
```

After dashboard changes, test receiving from an address that is not `pawjaipet@gmail.com`, then send an app test email only if `RESEND_API_KEY` and sender verification are confirmed.
