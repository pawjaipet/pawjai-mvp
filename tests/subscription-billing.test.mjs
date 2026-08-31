import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/20260830092847_subscription_billing_and_entitlements.sql", import.meta.url), "utf8");
const billing = readFileSync(new URL("../utils/subscription-billing.ts", import.meta.url), "utf8");
const webhook = readFileSync(new URL("../app/api/billing/webhook/route.ts", import.meta.url), "utf8");
const hardeningMigration = readFileSync(new URL("../supabase/migrations/20260830093920_harden_subscription_view_authorization.sql", import.meta.url), "utf8");
const wishlistMigration = readFileSync(new URL("../supabase/migrations/20260830094255_atomic_subscription_wishlist_limit.sql", import.meta.url), "utf8");

test("subscription authorization uses app metadata and server-only billing state", () => {
  assert.match(billing, /auth\.admin\.updateUserById/);
  assert.match(billing, /pawjai_subscription_tier/);
  assert.doesNotMatch(billing, /user_metadata/);
  assert.match(migration, /revoke all on table public\.billing_subscriptions from anon, authenticated/);
});

test("wishlist caps are serialized and service-only", () => {
  assert.match(wishlistMigration, /pg_advisory_xact_lock/);
  assert.match(wishlistMigration, /when p_tier = 'standard' then 20/);
  assert.match(wishlistMigration, /else 5/);
  assert.match(wishlistMigration, /to service_role/);
});

test("rolling dog views are atomic and user-scoped", () => {
  assert.match(hardeningMigration, /pg_advisory_xact_lock/);
  assert.match(migration, /interval '24 hours'/);
  assert.match(migration, /subscription_dog_views_owner_select/);
  assert.match(hardeningMigration, /when 'standard' then 100/);
  assert.match(hardeningMigration, /when 'premium' then null/);
  assert.match(hardeningMigration, /from public, anon, authenticated/);
  assert.match(hardeningMigration, /to service_role/);
});

test("Stripe webhooks verify the raw signed request", () => {
  assert.match(webhook, /await request\.text\(\)/);
  assert.match(webhook, /webhooks\.constructEvent/);
  assert.match(webhook, /stripe-signature/);
});
