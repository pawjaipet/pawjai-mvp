import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/20260831134841_launch_premium_first_200.sql", import.meta.url),
  "utf8",
);
const entitlements = readFileSync(new URL("../utils/subscription-entitlements.ts", import.meta.url), "utf8");
const adopter = readFileSync(new URL("../utils/adopter.ts", import.meta.url), "utf8");
const stripe = readFileSync(new URL("../utils/stripe.ts", import.meta.url), "utf8");
const swipeFeed = readFileSync(new URL("../components/SwipeFeed.tsx", import.meta.url), "utf8");
const subscriptionPage = readFileSync(
  new URL("../components/settings/SubscriptionPageClient.tsx", import.meta.url),
  "utf8",
);

test("launch Premium grants are permanent, adopter-only, and capped at 200", () => {
  assert.match(migration, /create table if not exists public\.subscription_launch_grants/);
  assert.match(migration, /grant_number between 1 and 200/);
  assert.match(migration, /from public\.adopters as adopters/);
  assert.match(migration, /row_number\(\) over \(order by users\.created_at, users\.id\)/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /coalesce\(v_next_grant_number, 0\) >= 200/);
  assert.match(migration, /on delete cascade/);
});

test("launch grant authorization is service-only and cached in trusted app metadata", () => {
  assert.match(migration, /revoke all on table public\.subscription_launch_grants from anon, authenticated/);
  assert.match(migration, /revoke all on function public\.ensure_launch_premium_grant_for_user\(uuid\)/);
  assert.match(migration, /to service_role/);
  assert.match(migration, /raw_app_meta_data/);
  assert.match(entitlements, /admin\.rpc\("ensure_launch_premium_grant_for_user"/);
  assert.match(entitlements, /auth\.admin\.updateUserById/);
  assert.match(entitlements, /pawjai_launch_premium: true/);
  assert.match(adopter, /await resolveSubscriptionEntitlementForUser\(user\)/);
});

test("paid billing is opt-in and launch Premium adds no per-swipe entitlement request", () => {
  assert.match(stripe, /PAWJAI_BILLING_ENABLED === "true"/);
  assert.match(swipeFeed, /isLoggedIn && subscriptionTier !== "premium"/);
  assert.match(subscriptionPage, /Founding Premium/);
  assert.match(subscriptionPage, /unlimited dog browsing, unlimited wishlist saves/);
});
