# PawJai subscription billing

PawJai has Stripe Checkout and Customer Portal integration available for a
future paid launch. Billing is currently disabled unless the server-only
`PAWJAI_BILLING_ENABLED=true` flag is explicitly set.

Effective authorization comes from trusted Supabase Auth app metadata. Paid
tier state uses `user.app_metadata.pawjai_subscription_tier` (`free`,
`standard`, or `premium`), while the founding promotion uses
`pawjai_launch_premium`. Browser-provided metadata and `user_metadata` are
never used for authorization.

## Founding Premium: first 200 adopters

- `subscription_launch_grants` permanently numbers eligible adopter accounts
  from 1 through 200. Shelter and PawJai admin accounts do not consume slots.
- `ensure_launch_premium_grant_for_user` is service-role only and uses a
  transaction advisory lock so concurrent signups cannot exceed 200.
- The grant table is authoritative. Trusted Auth app metadata caches the grant
  so normal feed requests do not add another database lookup.
- Founding Premium includes unlimited dog browsing, unlimited wishlist saves,
  advanced matching, priority visits, and no ads.
- Premium feed impressions bypass the dog-view entitlement API, keeping the
  swipe path free from per-card subscription checks.
- A paid-tier change must never remove `pawjai_launch_premium`; paid billing and
  launch grants are intentionally separate entitlements.

## Production configuration

Create monthly recurring THB prices in Stripe for Standard (THB 199) and
Premium (THB 399), then set these Vercel Production variables:

- `PAWJAI_BILLING_ENABLED=true`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STANDARD_PRICE_ID`
- `STRIPE_PREMIUM_PRICE_ID`
- `NEXT_PUBLIC_SITE_URL=https://www.pawjaipet.com`

Create a Stripe webhook endpoint at:

`https://www.pawjaipet.com/api/billing/webhook`

Subscribe it to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

In Customer Portal settings, enable plan switching between the two configured
prices and subscription cancellation. PawJai keeps access through the paid
period when `cancel_at_period_end` is true, and returns the Auth tier to `free`
when Stripe reports cancellation or a failed payment.

## Data and security

- `billing_subscriptions` is a service-only projection of Stripe state.
- `subscription_audit_events` makes webhook processing idempotent and records
  subscription changes without payment-card data.
- `subscription_dog_views` stores unique-view evidence for the rolling 24-hour
  limit. RLS restricts rows to the owner.
- `record_subscription_dog_view_for_user` is callable only by `service_role`.
  The authenticated API route gets the current Auth user before invoking it,
  so stale browser JWT metadata cannot preserve Premium access after a failed
  payment.

Never write subscription tiers directly from a client or a settings form.
Checkout, Portal, and signed Stripe webhooks are the only billing mutation
paths.

## Launch smoke test

Use Stripe test mode first:

1. Buy Standard and confirm Auth app metadata becomes `standard`.
2. Switch to Premium in Portal and confirm metadata becomes `premium`.
3. Confirm Premium has no ads and ranks the full available dog pool.
4. Confirm Free/Standard rolling dog and wishlist limits show upgrade prompts.
5. Create a booking on Standard/Premium and confirm the shelter sees `Priority visit`.
6. Send `invoice.payment_failed` and confirm metadata immediately becomes `free`.
7. Renew successfully and confirm the paid tier is restored.
8. Cancel at period end, confirm access remains until deletion/end, then becomes `free`.

After the matching application deployment is live, remove the transitional
`record_subscription_dog_view(uuid)` RPC. It remains temporarily so the schema
rollout is additive and cannot break an older deployment mid-release.
