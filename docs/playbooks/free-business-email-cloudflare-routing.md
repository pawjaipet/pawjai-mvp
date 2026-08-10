# Free Business Email: Cloudflare Email Routing

Last updated: 2026-08-10.

This is the active no-cost PawJai business email setup. It creates `@pawjaipet.com` addresses in Cloudflare and forwards incoming mail to Gmail.

## Current Setup

- DNS source of truth: Cloudflare
- Domain: `pawjaipet.com`
- Email provider: Cloudflare Email Routing
- Destination inbox: `pawjaipet@gmail.com`
- Active routes:
  - `polchaya.s@pawjaipet.com` -> `pawjaipet@gmail.com`
  - `pakaphol.j@pawjaipet.com` -> `pawjaipet@gmail.com`
  - `kittipat.w@pawjaipet.com` -> `pawjaipet@gmail.com`

This is forwarding, not a separate mailbox. Replies still come from the Gmail account unless Gmail is separately configured to send mail as the custom address.

## DNS Records

Cloudflare added and locked the routing records:

```txt
MX pawjaipet.com 56 route1.mx.cloudflare.net.
MX pawjaipet.com 56 route2.mx.cloudflare.net.
MX pawjaipet.com 91 route3.mx.cloudflare.net.
TXT pawjaipet.com "v=spf1 include:_spf.mx.cloudflare.net ~all"
TXT cf2024-1._domainkey.pawjaipet.com "v=DKIM1; h=sha256; k=rsa; p=..."
```

Verified publicly on 2026-07-31 with:

```sh
dig +short MX pawjaipet.com
dig +short TXT pawjaipet.com
dig +short TXT cf2024-1._domainkey.pawjaipet.com
```

## Add Another Address

In Cloudflare:

1. Go to `Email Service` -> `Email Routing` -> `pawjaipet.com`.
2. Open `Routing rules`.
3. Select `Create routing rule`.
4. Fill:
   - Email pattern: the local part, for example `hello`
   - Domain: `pawjaipet.com`
   - Action: `Send to an email`
   - Destination: `pawjaipet@gmail.com`
5. Save.

Good starter aliases:

```txt
hello@pawjaipet.com
adoptions@pawjaipet.com
support@pawjaipet.com
donations@pawjaipet.com
partners@pawjaipet.com
```

Avoid using `admin@pawjaipet.com` as a public daily address. It attracts attacks and is vague for audit/account ownership.

## Limitations

- No separate employee inboxes.
- No native Gmail login for `@pawjaipet.com`.
- No independent mailbox storage per employee.
- Sending as `@pawjaipet.com` requires extra Gmail/send-as configuration or a real mailbox provider.

For real employee mailboxes later, use Zoho Mail free/paid if available or paid Google Workspace.

## Testing

Do not test forwarding by sending from `pawjaipet@gmail.com` to an alias that forwards back to `pawjaipet@gmail.com`.

Gmail deduplicates same-account loops, and Cloudflare sends a warning email like:

```txt
Cloudflare Email Routing: Missing email from pawjaipet@gmail.com to <alias>@pawjaipet.com?
```

That warning means the route exists, but Gmail suppressed the self-sent forwarded copy. Test from an external sender instead, such as another Gmail account, phone email app, or a co-founder account.

Recommended test:

```txt
From: any address other than pawjaipet@gmail.com
To:
  polchaya.s@pawjaipet.com
  pakaphol.j@pawjaipet.com
  kittipat.w@pawjaipet.com
Expected inbox: pawjaipet@gmail.com
```
