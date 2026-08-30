import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadSubscriptionLimits() {
  const source = readFileSync(new URL("../utils/subscription-limits.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  new Script(outputText).runInNewContext({ exports: module.exports, module });
  return module.exports;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("subscription tiers match PawJai launch limits", () => {
  const { ANONYMOUS_DOG_VIEW_LIMIT, getSubscriptionLimits } = loadSubscriptionLimits();

  assert.equal(ANONYMOUS_DOG_VIEW_LIMIT, 10);
  assert.deepEqual(plain(getSubscriptionLimits("free")), {
    advancedMatching: false,
    adFree: false,
    dogViewLimit: 25,
    priorityVisits: false,
    wishlistLimit: 5,
  });
  assert.deepEqual(plain(getSubscriptionLimits("standard")), {
    advancedMatching: false,
    adFree: false,
    dogViewLimit: 100,
    priorityVisits: true,
    wishlistLimit: 20,
  });
  assert.deepEqual(plain(getSubscriptionLimits("premium")), {
    advancedMatching: true,
    adFree: true,
    dogViewLimit: null,
    priorityVisits: true,
    wishlistLimit: null,
  });
});

test("subscription tier defaults to free from missing or unknown auth metadata", () => {
  const { subscriptionTierFromAppMetadata } = loadSubscriptionLimits();

  assert.equal(subscriptionTierFromAppMetadata(null), "free");
  assert.equal(subscriptionTierFromAppMetadata({ pawjai_subscription_tier: "standard" }), "standard");
  assert.equal(subscriptionTierFromAppMetadata({ subscription_tier: "premium" }), "premium");
  assert.equal(subscriptionTierFromAppMetadata({ plan: "enterprise" }), "free");
});
