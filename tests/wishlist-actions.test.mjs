import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadAction(path, dependencies) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const module = { exports: {} };
  new Script(outputText).runInNewContext({
    module, exports: module.exports, FormData, process: { env: {} }, console: { error() {} },
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return module.exports;
}

function fixture({ guest = false, saved = true, limitReached = false, rpcError = null } = {}) {
  const calls = [];
  const revalidated = [];
  const events = [];
  const user = guest ? null : { id: "signed-in-user" };
  const adopter = { id: "owned-adopter", verification_status: "unverified" };
  const dependencies = {
    "next/cache": { revalidatePath: path => revalidated.push(path) },
    "@/utils/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) } }) },
    "@/utils/adopter": {
      ensureAdopterForUser: async () => adopter,
      getAdopterVerificationSnapshot: async () => { throw new Error("Saving must not check booking verification"); },
      canBookAppointment: () => { throw new Error("Saving must not require documents"); },
    },
    "@/utils/supabase/admin": { createAdminClient: () => ({ rpc: async (name, args) => {
      calls.push({ name, args });
      return { data: rpcError ? null : [{ saved, limit_reached: limitReached }], error: rpcError };
    } }) },
    "@/utils/subscription-limits": { getSubscriptionLimits: () => ({ wishlistLimit: 5 }) },
    "@/utils/subscription-entitlements": { resolveSubscriptionEntitlementForUser: async () => ({ tier: "free" }) },
    "@/utils/product-analytics": { recordProductAnalyticsEvent: async event => events.push(event) },
  };
  return { dependencies, calls, revalidated, events };
}

for (const surface of ["swipe_feed", "dog_detail"]) {
  test(`unverified adopters can save from ${surface} using server-owned identity and tier`, async () => {
    const context = fixture();
    const action = loadAction("../app/actions/wishlist.ts", context.dependencies);
    const result = await action.toggleWishlistAction("dog-id", surface);
    assert.equal(result.saved, true);
    assert.equal(result.error, undefined);
    assert.equal(context.calls[0].name, "toggle_subscription_wishlist_for_user");
    assert.equal(context.calls[0].args.p_adopter_id, "owned-adopter");
    assert.equal(context.calls[0].args.p_user_id, "signed-in-user");
    assert.equal(context.calls[0].args.p_tier, "free");
    assert.ok(context.revalidated.includes("/profile"));
    assert.ok(context.revalidated.includes("/dogs/dog-id"));
  });
}

test("guests cannot mutate a wishlist", async () => {
  const context = fixture({ guest: true });
  const action = loadAction("../app/actions/wishlist.ts", context.dependencies);
  assert.equal((await action.toggleWishlistAction("dog-id")).error, "not_authenticated");
  assert.equal(context.calls.length, 0);
});

test("subscription limit failures stay failures and preserve the atomic RPC rule", async () => {
  const context = fixture({ saved: false, limitReached: true });
  const action = loadAction("../app/actions/wishlist.ts", context.dependencies);
  const result = await action.toggleWishlistAction("dog-id", "dog_detail");
  assert.equal(result.error, "wishlist_limit_reached");
  assert.equal(result.limit, 5);
  assert.equal(context.revalidated.length, 0);
  assert.equal(context.events[0].eventName, "subscription_limit_prompt");
});

test("unverified adopters can remove an existing save without a client-side cap check", async () => {
  const context = fixture({ saved: false });
  const action = loadAction("../app/actions/wishlist.ts", context.dependencies);
  const result = await action.toggleWishlistAction("dog-id");
  assert.equal(result.saved, false);
  assert.equal(result.error, undefined);
});

test("RPC failures return an actionable error rather than false success", async () => {
  const context = fixture({ rpcError: { code: "42501", message: "private database detail" } });
  const action = loadAction("../app/actions/wishlist.ts", context.dependencies);
  const result = await action.toggleWishlistAction("dog-id");
  assert.equal(result.error, "save_failed");
  assert.equal(JSON.stringify(result).includes("private database detail"), false);
});

test("booking still rejects unverified adopters before availability checks or insertion", async () => {
  const context = fixture();
  context.dependencies["@/utils/adopter"].getAdopterVerificationSnapshot = async () => ({ status: "unverified" });
  context.dependencies["@/utils/adopter"].canBookAppointment = () => false;
  Object.assign(context.dependencies, {
    "next/navigation": { redirect: path => { throw new Error(`REDIRECT:${path}`); } },
    "next/headers": { cookies: async () => ({ set() {}, get() {} }) },
    "node:crypto": {},
    "@/utils/account-model": { optionalString: () => null },
    "@/utils/booking": {},
    "@/utils/booking-email": {},
    "@/utils/appointments-model": {},
    "@/utils/rate-limit": {},
    "@/utils/shelter-availability": {},
    "@/utils/booking-recovery": {},
  });
  const action = loadAction("../app/dogs/[id]/actions.ts", context.dependencies);
  const form = new FormData();
  form.set("dogId", "dog-id");
  await assert.rejects(action.bookAppointment(form), /REDIRECT:\/documents\?next=/);
  assert.equal(context.calls.length, 0);
  assert.equal(context.events[0].reason, undefined);
  assert.equal(context.events[0].metadata.reason, "verification_required");
});
