import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadTs(path, extra = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const module = { exports: {} };
  new Script(outputText).runInNewContext({ exports: module.exports, module, Math, JSON, Date, ...extra });
  return module.exports;
}

const model = () => loadTs("../utils/studio-experiment-model.ts");
const report = () => loadTs("../utils/studio-experiment-report.ts");
const visitor = () => loadTs("../utils/analytics-visitor.ts", { process: { env: { NODE_ENV: "production" } } });
const manifest = () => loadTs("../utils/studio-experiment-manifest.ts");
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const UNIT = "0b6f2a8e-5c1d-4f3a-9e7b-2d4c6a8e0f12";
const DOG = "065d6a6c-0029-4339-b39b-1bfa679e6e5d";
const entry = {
  cohort: "c1",
  coverItemId: "item-1",
  derivativeBytes: 180000,
  derivativeSha1: "0123456789abcdef0123456789abcdef01234567",
  derivativeUrl: `https://media.pawjaipet.com/file/pawjai/experiments/studio-background-v1/${DOG}/327e68ae9c32.webp`,
  dogId: DOG,
  height: 2400,
  sourceSha1: "327e68ae9c3213f1b7df31580d049dd6ccc3b293",
  sourceUrl: "https://media.pawjaipet.com/file/pawjai/pawjaidogs/x/daniel.jpg",
  width: 1350,
};
const cover = { id: "item-1", publicUrl: entry.sourceUrl, type: "photo" };
const config = { enabled: true, enabledCohorts: ["c1"], version: "studio-bg-v1" };

test("assignment is stable per visitor and dog, balanced, and version-scoped", () => {
  const { assignStudioVariant } = model();
  assert.equal(assignStudioVariant(UNIT, DOG, "studio-bg-v1"), assignStudioVariant(UNIT, DOG, "studio-bg-v1"));
  assert.equal(assignStudioVariant(UNIT.toUpperCase(), DOG, "studio-bg-v1"), assignStudioVariant(UNIT, DOG, "studio-bg-v1"));
  let studio = 0;
  let changedWithVersion = 0;
  for (let index = 0; index < 4000; index += 1) {
    const unit = `${index.toString(16).padStart(8, "0")}-5c1d-4f3a-9e7b-2d4c6a8e0f12`;
    if (assignStudioVariant(unit, DOG, "studio-bg-v1") === "studio") studio += 1;
    if (assignStudioVariant(unit, DOG, "studio-bg-v1") !== assignStudioVariant(unit, DOG, "studio-bg-v2")) changedWithVersion += 1;
  }
  assert.ok(studio > 1850 && studio < 2150, `roughly 50/50, got ${studio}/4000`);
  assert.ok(changedWithVersion > 1500, "a new version re-randomises independently");
});

test("both variants keep the same listing and only swap the cover image", () => {
  const { resolveStudioPhotoAssignment, assignStudioVariant } = model();
  const assignment = resolveStudioPhotoAssignment({ config, cover, entry, unitId: UNIT });
  assert.equal(assignment.variant, assignStudioVariant(UNIT, DOG, "studio-bg-v1"));
  assert.equal(assignment.originalUrl, entry.sourceUrl);
  assert.equal(assignment.studioUrl, entry.derivativeUrl);
  assert.equal(assignment.measured, true);
  assert.equal(assignment.source, "327e68ae9c32");
  // Both arms exist across visitors for the same dog.
  const seen = new Set();
  for (let index = 0; index < 50; index += 1) {
    const unit = `${index.toString(16).padStart(8, "0")}-5c1d-4f3a-9e7b-2d4c6a8e0f12`;
    seen.add(resolveStudioPhotoAssignment({ config, cover, entry, unitId: unit }).variant);
  }
  assert.deepEqual([...seen].sort(), ["control", "studio"]);
});

test("a replaced or mismatched source photo stops its stale derivative", () => {
  const { resolveStudioPhotoAssignment } = model();
  assert.equal(resolveStudioPhotoAssignment({ config, cover: { ...cover, publicUrl: `${entry.sourceUrl}?v=2` }, entry, unitId: UNIT }), null);
  assert.equal(resolveStudioPhotoAssignment({ config, cover: { ...cover, id: "item-2" }, entry, unitId: UNIT }), null);
  assert.equal(resolveStudioPhotoAssignment({ config, cover, entry: undefined, unitId: UNIT }), null);
});

test("video covers are preserved and never treated", () => {
  const { resolveStudioPhotoAssignment } = model();
  assert.equal(resolveStudioPhotoAssignment({ config, cover: { ...cover, type: "video" }, entry, unitId: UNIT }), null);
  assert.equal(resolveStudioPhotoAssignment({ config, cover: null, entry, unitId: UNIT }), null);
});

test("kill switch and cohorts: off disables everything, cohorts are explicit", () => {
  const { resolveStudioExperimentConfig, resolveStudioPhotoAssignment } = model();
  const off = resolveStudioExperimentConfig(config, "off");
  assert.equal(off.enabled, false);
  assert.equal(resolveStudioPhotoAssignment({ config: off, cover, entry, unitId: UNIT }), null);
  assert.deepEqual([...resolveStudioExperimentConfig(config, "c1,c2").enabledCohorts], ["c1", "c2"]);
  assert.deepEqual(resolveStudioExperimentConfig(config, undefined), config);
  assert.deepEqual(resolveStudioExperimentConfig(config, "!!"), config);
  const c2Only = resolveStudioExperimentConfig(config, "c2");
  assert.equal(resolveStudioPhotoAssignment({ config: c2Only, cover, entry, unitId: UNIT }), null, "c1 dog not in an enabled cohort");
});

test("no stable visitor id means no experiment (original photo, nothing measured)", () => {
  const { resolveStudioPhotoAssignment } = model();
  assert.equal(resolveStudioPhotoAssignment({ config, cover, entry, unitId: null }), null);
  assert.equal(resolveStudioPhotoAssignment({ config, cover, entry, unitId: "not-a-uuid" }), null);
});

test("rollout shows the reviewed studio photo to every visitor and measures nothing", () => {
  const { resolveStudioPhotoAssignment, resolveStudioExperimentConfig } = model();
  const rollout = { ...config, mode: "rollout", version: "studio-bg-v2" };
  for (const unitId of [UNIT, null, "not-a-uuid"]) {
    const assignment = resolveStudioPhotoAssignment({ config: rollout, cover, entry, unitId });
    assert.equal(assignment.variant, "studio", "no randomisation and no visitor id needed");
    assert.equal(assignment.measured, false, "nothing is recorded as an experiment exposure");
    assert.equal(assignment.studioUrl, entry.derivativeUrl);
    assert.equal(assignment.originalUrl, entry.sourceUrl);
  }
  assert.equal(resolveStudioExperimentConfig(rollout, "c1").mode, "rollout", "env cohort override keeps the mode");
  assert.equal(resolveStudioPhotoAssignment({ config: resolveStudioExperimentConfig(rollout, "off"), cover, entry, unitId: UNIT }), null, "kill switch wins");
  assert.equal(resolveStudioPhotoAssignment({ config: { ...rollout, enabledCohorts: ["c2"] }, cover, entry, unitId: UNIT }), null, "only enabled cohorts");
  const replacedCover = { ...cover, publicUrl: "https://media.pawjaipet.com/file/pawjai/pawjaidogs/new-photo.jpg" };
  assert.equal(resolveStudioPhotoAssignment({ config: rollout, cover: replacedCover, entry, unitId: UNIT }), null, "a replaced cover drops the stale edit");
  assert.equal(resolveStudioPhotoAssignment({ config: rollout, cover: { ...cover, type: "video" }, entry, unitId: UNIT }), null);
  assert.equal(resolveStudioPhotoAssignment({ config: rollout, cover, entry, preview: "control", unitId: UNIT }).variant, "control", "QA can still compare");
});

test("QA preview shows either version for any reviewed dog and is never measured", () => {
  const { resolveStudioPhotoAssignment, parseStudioPreview, exposureConditionsMet } = model();
  assert.equal(parseStudioPreview("studio"), "studio");
  assert.equal(parseStudioPreview("control"), "control");
  assert.equal(parseStudioPreview("1"), null);
  const off = { ...config, enabled: false, enabledCohorts: [] };
  const preview = resolveStudioPhotoAssignment({ config: off, cover, entry: { ...entry, cohort: "c9" }, preview: "studio", unitId: null });
  assert.equal(preview.variant, "studio");
  assert.equal(preview.measured, false);
  assert.equal(resolveStudioPhotoAssignment({ config, cover, entry, preview: "control", unitId: UNIT }).variant, "control");
  assert.equal(exposureConditionsMet({ active: true, coverShowing: true, loaded: true, measured: false, obstructed: false, pageVisible: true, visibleRatio: 1 }), false);
});

test("qualified exposure needs a loaded, active, visible, unobstructed cover", () => {
  const { exposureConditionsMet, QUALIFIED_EXPOSURE_DWELL_MS, QUALIFIED_EXPOSURE_MIN_RATIO } = model();
  const ok = { active: true, coverShowing: true, loaded: true, measured: true, obstructed: false, pageVisible: true, visibleRatio: 0.9 };
  assert.equal(exposureConditionsMet(ok), true);
  for (const [key, value] of [["active", false], ["coverShowing", false], ["loaded", false], ["obstructed", true], ["pageVisible", false], ["visibleRatio", 0.4]]) {
    assert.equal(exposureConditionsMet({ ...ok, [key]: value }), false, `${key}=${value} must not qualify`);
  }
  assert.equal(QUALIFIED_EXPOSURE_DWELL_MS, 1000);
  assert.equal(QUALIFIED_EXPOSURE_MIN_RATIO, 0.6);
});

test("exposure payload carries only experiment fields, dedupe key is per version and dog", () => {
  const { studioExposureMetadata, studioExposureDedupeKey, resolveStudioPhotoAssignment } = model();
  const assignment = resolveStudioPhotoAssignment({ config, cover, entry, unitId: UNIT });
  const metadata = studioExposureMetadata({ assignment, cardPosition: 3, dogPosition: 2, feedVisitId: "f", loadMs: 412.6, rendered: "studio" });
  assert.deepEqual(Object.keys(metadata).sort(), ["cardPosition", "cohort", "dogPosition", "experiment", "feedVisitId", "loadMs", "rendered", "source", "surface", "variant"]);
  assert.ok(Object.keys(metadata).length <= 12, "route keeps at most 12 metadata keys");
  assert.equal(metadata.loadMs, 413);
  assert.equal(studioExposureDedupeKey("studio-bg-v1", DOG), `photo-exposure:studio-bg-v1:${DOG}`);
});

test("visitor cookie is issued only for feed page loads without a valid id", () => {
  const { shouldIssueVisitorCookie, analyticsVisitorCookie } = visitor();
  assert.equal(shouldIssueVisitorCookie("GET", "/", undefined), true);
  assert.equal(shouldIssueVisitorCookie("GET", "/dogs", "garbage"), true);
  assert.equal(shouldIssueVisitorCookie("GET", "/", UNIT), false);
  assert.equal(shouldIssueVisitorCookie("POST", "/", undefined), false);
  assert.equal(shouldIssueVisitorCookie("GET", "/settings", undefined), false);
  const cookie = analyticsVisitorCookie(UNIT);
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.name, "pawjai_analytics_visitor");
  assert.equal(cookie.maxAge, 60 * 60 * 24 * 180);
});

test("report attributes outcomes to the version actually exposed, within the window", () => {
  const { buildPairs, armSummary } = report();
  const t = (minutes) => new Date(Date.UTC(2026, 10, 18, 10, 0) + minutes * 60000).toISOString();
  const exp = (visitor_id, dog_id, variant, rendered, minutes, user_id = null) => ({
    created_at: t(minutes), dog_id, metadata: { experiment: "studio-bg-v1", rendered, variant, cohort: "c1" }, session_id: "s", user_id, visitor_id,
  });
  const exposures = [
    exp("v1", "d1", "studio", "studio", 0, "u1"),
    exp("v1", "d1", "studio", "studio", 30, "u1"), // repeat: first exposure wins
    exp("v1", "d2", "control", "original", 5),
    exp("v2", "d1", "control", "original", 0),
    exp("v3", "d1", "studio", "original_fallback", 0), // failed derivative: excluded
    exp("v4", "d1", "studio", "studio", 0),
    exp("v4", "d1", "control", "original", 10), // conflicting: excluded
    { ...exp("v5", "d1", "studio", "studio", 0), metadata: { experiment: "other-test", rendered: "studio", variant: "studio" } },
  ];
  const outcomes = [
    { created_at: t(-5), dog_id: "d2", event_name: "dog_profile_view", session_id: "s", visitor_id: "v1" }, // before exposure
    { created_at: t(2), dog_id: "d1", event_name: "dog_profile_view", session_id: "s", visitor_id: "v1" },
    { created_at: t(3), dog_id: "d1", event_name: "booking_started", session_id: "s", visitor_id: "v1" },
    { created_at: t(26 * 60), dog_id: "d1", event_name: "dog_profile_view", session_id: "s", visitor_id: "v2" }, // outside 24h
    { created_at: t(1), dog_id: "d1", event_name: "dog_profile_view", session_id: "s", visitor_id: "v9" }, // never exposed
    { created_at: t(1), dog_id: "d1", event_name: "dog_profile_view", session_id: "s", visitor_id: "v3" }, // fallback pair
  ];
  const saves = [{ created_at: t(4), dog_id: "d1", user_id: "u1" }];
  const { pairs, exclusions } = buildPairs({ exposures, outcomes, saves, version: "studio-bg-v1" });
  assert.equal(exclusions.studioFallback, 1);
  assert.equal(exclusions.conflictingVariant, 1);
  const studio = armSummary(pairs, "studio");
  const control = armSummary(pairs, "control");
  assert.equal(studio.pairs, 1);
  assert.equal(studio.detailOpens, 1);
  assert.equal(studio.bookingStarts, 1);
  assert.equal(studio.signedInPairs, 1);
  assert.equal(studio.saves, 1);
  assert.equal(control.pairs, 2);
  assert.equal(control.detailOpens, 0, "views before exposure or after the window are not attributed");
  assert.equal(control.signedInPairs, 0);
});

test("report says insufficient data until both arms are large enough", () => {
  const { armSummary, clusteredDifference, evidenceStatus, wilson } = report();
  const pairs = [
    { arm: "control", outcomes: { dog_profile_view: true }, saved: null, unit: "v:1" },
    { arm: "studio", outcomes: { dog_profile_view: false }, saved: null, unit: "v:1" },
  ].map((pair) => ({ cohort: "c1", dogId: "d", firstExposureAt: 0, loadMs: null, ...pair, outcomes: { booking_started: false, booking_succeeded: false, dog_shared: false, ...pair.outcomes } }));
  const status = evidenceStatus(armSummary(pairs, "control"), armSummary(pairs, "studio"), clusteredDifference(pairs, (pair) => pair.outcomes.dog_profile_view));
  assert.match(status, /^Insufficient data/);
  const interval = wilson(7, 100);
  assert.ok(interval.low < 0.07 && interval.high > 0.07);
  assert.equal(wilson(0, 0), null);
});

test("reviewed manifest only lists CDN derivatives bound to their source and safe to serve", () => {
  const { STUDIO_EXPERIMENT_DEFAULTS, STUDIO_EXPERIMENT_ENTRIES, STUDIO_EXPERIMENT_RETAINED_ORIGINALS } = manifest();
  assert.match(STUDIO_EXPERIMENT_DEFAULTS.version, /^studio-bg-v\d+$/);
  assert.ok(["experiment", "rollout"].includes(STUDIO_EXPERIMENT_DEFAULTS.mode ?? "experiment"));
  assert.ok(STUDIO_EXPERIMENT_ENTRIES.length > 0, "at least one reviewed derivative");
  const ids = new Set();
  for (const item of STUDIO_EXPERIMENT_ENTRIES) {
    assert.ok(!ids.has(item.dogId), "one derivative per dog");
    ids.add(item.dogId);
    // Additive B2 objects under the owner-named versioned prefix, on the same CDN as the originals.
    // v2 derivatives carry a "-v2" suffix so no existing object is ever overwritten.
    assert.match(item.derivativeUrl, /^https:\/\/media\.pawjaipet\.com\/file\/pawjai\/experiments\/studio-background-v1\/[0-9a-f-]{36}\/[0-9a-f]{12}(-v2)?\.webp$/);
    assert.ok(item.derivativeUrl.includes(item.dogId) && item.derivativeUrl.includes(`/${item.sourceSha1.slice(0, 12)}`));
    assert.match(item.derivativeSha1, /^[0-9a-f]{40}$/);
    assert.ok(item.derivativeBytes > 0 && item.derivativeBytes < 450 * 1024, `${item.derivativeUrl} is too heavy for mobile`);
    assert.match(item.sourceUrl, /^https:\/\/media\.pawjaipet\.com\/file\/pawjai\//);
    assert.ok(STUDIO_EXPERIMENT_DEFAULTS.enabledCohorts.length > 0);
  }
  for (const retained of STUDIO_EXPERIMENT_RETAINED_ORIGINALS) {
    assert.ok(!ids.has(retained.dogId), `existing studio photo ${retained.dogId} must not be a treatment`);
  }
});

test("migration keeps every existing event name and adds only the exposure event", () => {
  const sql = read("../supabase/migrations/20261117160000_photo_experiment_exposure_event.sql");
  for (const name of ["page_view", "dog_profile_view", "dog_feed_impression", "dog_shared", "feed_session_summary", "booking_started", "booking_succeeded", "booking_failed", "subscription_limit_prompt", "subscription_changed", "dog_photo_exposure"]) {
    assert.ok(sql.includes(`'${name}'`), `${name} must stay valid`);
  }
  assert.doesNotMatch(sql, /\b(drop table|delete from public\.product_analytics_events where event_name <>|truncate)\b/i);
});

test("feed wiring: assignment happens after limits; only the cover slide is swapped; originals stay reachable", () => {
  const feedPage = read("../components/dogs/DogFeedPage.tsx");
  assert.ok(feedPage.indexOf("const visibleDogs") < feedPage.indexOf("studioAssignmentsForDogs(visibleDogs"));
  const card = read("../components/SwipeDogCard.tsx");
  assert.match(card, /i === 0 && dog\.photo_experiment \?/);
  assert.match(card, /data-dog-card/);
  const studioCard = read("../components/dogs/StudioCardPhoto.tsx");
  assert.match(studioCard, /setRendered\("original_fallback"\)/);
  assert.match(studioCard, /Edited background/);
  const detail = read("../app/dogs/[id]/page.tsx");
  assert.doesNotMatch(detail, /studio/i, "dog profile gallery keeps the original photos for everyone");
  const privacy = read("../app/privacy/page.tsx");
  assert.match(privacy, /edited background/i);
});
