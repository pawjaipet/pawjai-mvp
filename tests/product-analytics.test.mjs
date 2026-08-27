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

function loadAnalyticsInsights() {
  const source = readFileSync(new URL("../utils/product-analytics-insights.ts", import.meta.url), "utf8");
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

function loadAnalyticsClient() {
  const source = readFileSync(new URL("../utils/product-analytics-client.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  const storage = new Map();
  const timers = new Map();
  const beaconCalls = [];
  let timerId = 0;
  const document = {
    addEventListener() {},
    visibilityState: "visible",
  };
  const window = {
    addEventListener() {},
    crypto: { randomUUID: () => "79cfcd26-7dfa-4870-b4ea-d1c42a390b17" },
    location: { pathname: "/dogs/79cfcd26-7dfa-4870-b4ea-d1c42a390b17" },
    sessionStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  };
  const context = {
    Blob,
    clearTimeout: (id) => timers.delete(id),
    document,
    exports: module.exports,
    fetch: () => Promise.resolve(),
    module,
    navigator: {
      sendBeacon: (url, body) => {
        beaconCalls.push({ body, url });
        return true;
      },
    },
    setTimeout: (callback) => {
      timerId += 1;
      timers.set(timerId, callback);
      return timerId;
    },
    window,
  };
  new Script(outputText).runInNewContext(context);
  return { beaconCalls, document, exports: module.exports, timers };
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

test("product analytics accepts deeper feed and share events", () => {
  const { isProductAnalyticsEventName } = loadAnalyticsModel();

  assert.equal(isProductAnalyticsEventName("dog_feed_impression"), true);
  assert.equal(isProductAnalyticsEventName("dog_shared"), true);
  assert.equal(isProductAnalyticsEventName("feed_session_summary"), true);
  assert.equal(isProductAnalyticsEventName("user_fingerprinted"), false);
});

test("client analytics batches events without waiting on the page", async () => {
  const client = loadAnalyticsClient();

  assert.equal(client.exports.sendProductAnalyticsEvent({ eventName: "page_view" }), true);
  assert.equal(client.exports.sendProductAnalyticsEvent({
    dogId: "79cfcd26-7dfa-4870-b4ea-d1c42a390b17",
    eventName: "dog_profile_view",
  }), true);
  assert.equal(client.beaconCalls.length, 0);
  assert.equal(client.timers.size, 1);

  client.exports.flushProductAnalyticsEvents();
  assert.equal(client.beaconCalls.length, 1);
  assert.equal(client.timers.size, 0);
  const payload = JSON.parse(await client.beaconCalls[0].body.text());
  assert.equal(payload.events.length, 2);
  assert.deepEqual(payload.events.map((event) => event.eventName), ["page_view", "dog_profile_view"]);
});

test("feed summaries use the latest checkpoint and report honest exit proxies", () => {
  const { summarizeFeedSessions } = loadAnalyticsInsights();
  const base = {
    event_name: "feed_session_summary",
    session_id: "session-a",
    user_id: null,
    visitor_id: "visitor-a",
  };
  const summary = summarizeFeedSessions([
    {
      ...base,
      created_at: "2026-08-27T10:00:00.000Z",
      id: "event-1",
      metadata: { dogsViewed: 2, feedVisitId: "visit-a", forwardFeedSwipes: 1, reachedEnd: false, totalFeedSwipes: 1, totalDogs: 10 },
    },
    {
      ...base,
      created_at: "2026-08-27T10:01:00.000Z",
      id: "event-2",
      metadata: { dogsViewed: 5, durationSeconds: 60, feedVisitId: "visit-a", forwardFeedSwipes: 4, reachedEnd: false, totalFeedSwipes: 4, totalDogs: 10 },
    },
    {
      ...base,
      created_at: "2026-08-27T11:00:00.000Z",
      id: "event-3",
      metadata: { dogsViewed: 2, durationSeconds: 20, feedVisitId: "visit-b", forwardFeedSwipes: 1, reachedEnd: false, totalFeedSwipes: 1, totalDogs: 10 },
    },
  ]);

  assert.equal(summary.sessions.length, 2);
  assert.equal(summary.sessions[1].dogsViewed, 5);
  assert.equal(summary.averageDogsViewed, 3.5);
  assert.equal(summary.averageFeedSwipes, 2.5);
  assert.equal(summary.medianDogsViewed, 3.5);
  assert.equal(summary.earlyExitRate, 50);
});

test("legacy noisy scroll counts fall back to profiles actually reached", () => {
  const { summarizeFeedSessions } = loadAnalyticsInsights();
  const summary = summarizeFeedSessions([{
    created_at: "2026-08-27T12:00:00.000Z",
    event_name: "feed_session_summary",
    id: "legacy-event",
    metadata: { dogsViewed: 4, feedVisitId: "legacy-visit", totalCardSwipes: 99, totalDogs: 10 },
    session_id: "session-a",
    user_id: null,
    visitor_id: "visitor-a",
  }]);

  assert.equal(summary.averageFeedSwipes, 3);
});

test("analytics storage is server-only and the dashboard is PawJai-only", () => {
  const migration = readFileSync(new URL("../supabase/migrations/20260810040949_launch_product_analytics.sql", import.meta.url), "utf8");
  const deeperMigration = readFileSync(new URL("../supabase/migrations/20260827051617_deepen_product_analytics.sql", import.meta.url), "utf8");
  const dashboard = readFileSync(new URL("../components/admin/AdminUserAnalyticsPageContent.tsx", import.meta.url), "utf8");
  const bookingAction = readFileSync(new URL("../app/dogs/[id]/actions.ts", import.meta.url), "utf8");
  const analyticsClient = readFileSync(new URL("../utils/product-analytics-client.ts", import.meta.url), "utf8");
  const analyticsRoute = readFileSync(new URL("../app/api/analytics/events/route.ts", import.meta.url), "utf8");

  assert.equal(migration.includes("enable row level security"), true);
  assert.equal(migration.includes("revoke all on table public.product_analytics_events from anon, authenticated"), true);
  assert.equal(deeperMigration.includes("dog_feed_impression"), true);
  assert.equal(deeperMigration.includes("dog_shared"), true);
  assert.equal(deeperMigration.includes("feed_session_summary"), true);
  assert.equal(deeperMigration.includes("grant "), false);
  assert.equal(analyticsClient.includes("JSON.stringify({ events })"), true);
  assert.equal(analyticsClient.includes("setTimeout(flushProductAnalyticsEvents"), true);
  assert.equal(analyticsRoute.includes("recordProductAnalyticsEvents"), true);
  assert.equal(analyticsRoute.includes("hasSupabaseAuthCookies"), true);
  assert.equal(dashboard.includes("!adminContext.isGlobalAdmin"), true);
  assert.equal(bookingAction.includes('eventName: "booking_failed"'), true);
  assert.equal(bookingAction.includes('eventName: "booking_succeeded"'), true);
});
