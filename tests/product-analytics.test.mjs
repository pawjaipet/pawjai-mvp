import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadAnalyticsModel() {
  const source = readFileSync(new URL("../utils/product-analytics-model.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  new Script(outputText).runInNewContext({ exports: module.exports, module, URLSearchParams });
  return module.exports;
}

test("product analytics tracks public adopter routes but excludes protected workspaces", () => {
  const { isTrackablePublicPath } = loadAnalyticsModel();

  assert.equal(isTrackablePublicPath("/"), true);
  assert.equal(isTrackablePublicPath("/dogs/79cfcd26-7dfa-4870-b4ea-d1c42a390b17"), true);
  assert.equal(isTrackablePublicPath("/appointments"), true);
  assert.equal(isTrackablePublicPath("/admindraft/analytics"), false);
  assert.equal(isTrackablePublicPath("/shelter/thevoicefoundation"), false);
  assert.equal(isTrackablePublicPath("/booking/example"), false);
});

test("product analytics recognizes dog profile and booking funnel routes", () => {
  const { dogIdFromPublicPath, dogIdFromSchedulePath } = loadAnalyticsModel();
  const dogId = "79cfcd26-7dfa-4870-b4ea-d1c42a390b17";

  assert.equal(dogIdFromPublicPath(`/dogs/${dogId}`), dogId);
  assert.equal(dogIdFromPublicPath("/dogs/not-a-uuid"), null);
  assert.equal(dogIdFromSchedulePath(`/schedule/${dogId}`), dogId);
  assert.equal(dogIdFromSchedulePath("/schedule", `?dogId=${dogId}`), dogId);
});

test("analytics storage is server-only and the dashboard is PawJai-only", () => {
  const migration = readFileSync(new URL("../supabase/migrations/20260810040949_launch_product_analytics.sql", import.meta.url), "utf8");
  const dashboard = readFileSync(new URL("../components/admin/AdminUserAnalyticsPageContent.tsx", import.meta.url), "utf8");
  const bookingAction = readFileSync(new URL("../app/dogs/[id]/actions.ts", import.meta.url), "utf8");

  assert.equal(migration.includes("enable row level security"), true);
  assert.equal(migration.includes("revoke all on table public.product_analytics_events from anon, authenticated"), true);
  assert.equal(dashboard.includes("!adminContext.isGlobalAdmin"), true);
  assert.equal(bookingAction.includes('eventName: "booking_failed"'), true);
  assert.equal(bookingAction.includes('eventName: "booking_succeeded"'), true);
});
