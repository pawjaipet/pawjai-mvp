# Authentication and email-verification analytics

PAWJAI measures authentication only for visitors who grant analytics consent, on the production hosts `pawjaipet.com` and `www.pawjaipet.com`. The implementation intentionally excludes email addresses, passwords, verification codes, link tokens, provider messages, profile contents, and arbitrary metadata.

## Event contract

| Event | Meaning | Required parameters |
|---|---|---|
| `auth_view` | Authentication UI became visible after consent. | `mode`, `surface` |
| `auth_submit` | A credential or provider submission was attempted. | `method`, `mode` |
| `signup_request_accepted` | Supabase accepted the signup request. This does not prove verification or account completion. | `method=email`, `mode=signup`, `stage=credentials` |
| `verification_required` | The flow requires email verification. | `method=email`, `mode`, `stage=email_link` |
| `verification_submit` | A user submitted the six-digit verification code. | `method=email`, `mode=verify`, `stage=code_entry` |
| `verification_resent` | Supabase accepted a verification-email resend. | `method=email`, `mode=verify`, `stage=resend` |
| `email_verified` | Supabase verified the email code or link. This is emitted before profile preparation. | `method=email`, `mode=verify`, `stage=code_entry|email_link`, `reason=confirmed` |
| `login` | Authentication and required PawJai profile preparation both completed. | `method`, `mode`, `stage=profile_setup` |
| `auth_failed` | A coarse, allowlisted failure occurred. | `method`, `mode`, `stage`, `reason` |

Allowed `method` values are `email` and `google`. Allowed `mode` values are `login`, `signup`, and `verify`. Verification-related `stage` values are `credentials`, `code_entry`, `email_link`, `resend`, and `profile_setup`; Google callbacks also use `oauth_callback`.

Failure `reason` is deliberately low-cardinality. Examples include `validation`, `browser_validation`, `invalid_code_format`, `otp_expired`, `auth_error`, rate-limit codes, and `profile_setup`. Unknown provider errors become `auth_error`.

## Redirect receipts

Email-link verification completes in a server route, then redirects to a public page. The route stores up to three allowlisted outcomes in the `pawjai_ga_auth` cookie for 60 seconds. The browser consumes and removes that receipt once, only after analytics consent is granted and only on an allowed production route.

A verified email followed by failed profile preparation produces two ordered events:

1. `email_verified` with `stage=email_link`
2. `auth_failed` with `stage=profile_setup` and `reason=profile_setup`

It does not produce `login`. Malformed receipts are removed without affecting authentication or navigation.

## GA4 custom dimensions

Authenticated GA4 administration was not available during this implementation. In GA4 property `556758283`, verify or create these event-scoped custom dimensions under **Admin → Data display → Custom definitions → Create custom dimension**:

| Dimension name | Scope | Event parameter |
|---|---|---|
| Auth mode | Event | `mode` |
| Auth method | Event | `method` |
| Auth reason | Event | `reason` |
| Auth surface | Event | `surface` |
| Auth stage | Event | `stage` |

Use one dimension per row, with Event scope and the exact lowercase parameter name. Do not create user-scoped dimensions for these values. GA4 custom dimensions are prospective: registration does not recover parameter breakdowns for historical events, and this application does not backfill them.

## Analysis cautions

- `signup_request_accepted` is an API outcome, not proof of a newly retained account.
- `email_verified` is the verification fact; `login` additionally requires PawJai profile readiness.
- Consent rejection, blockers, cross-browser email opening, and a receipt expiring before a consented public page loads can undercount the funnel.
- Operational Supabase data remains the source of truth for account state; GA4 is an aggregated behavior signal.
