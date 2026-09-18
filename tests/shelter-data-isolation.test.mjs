import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadWorkspace() {
  const calls = [];
  const shelters = ["a", "b", "c"].map((id) => ({ id, name: id, bank_account_name: `Bank ${id}` }));
  const dogs = shelters.flatMap((s) => Array.from({ length: 250 }, (_, i) => ({
    id: `${s.id}-${i}`, name: `${s.id} dog ${i}`, shelter_id: s.id, adoption_status: "draft", updated_at: "2026-09-18", created_at: "2026-09-18",
  })));
  const rows = { shelters, dogs, dog_photos: dogs.map((d) => ({ dog_id: d.id, public_url: `${d.id}.jpg`, is_cover: true })) };
  const client = { from(table) {
    const filters = [];
    let limit = Infinity;
    const query = {
      select() { return query; },
      in(key, values) { filters.push([key, values]); return query; },
      eq(key, value) { return query.in(key, [value]); },
      order() { return query; },
      limit(value) { limit = value; return query; },
      maybeSingle() { return query; },
      then(resolve) {
        calls.push({ table, filters });
        resolve({ data: (rows[table] ?? []).filter((row) => filters.every(([key, values]) => values.includes(row[key]))).slice(0, limit), error: null });
      },
    };
    return query;
  } };
  const source = readFileSync(new URL("../utils/admin-draft-data.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Script(compiled).runInNewContext({ console, module, exports: module.exports, require: (id) => {
    if (id === "server-only") return {};
    if (id.endsWith("supabase/admin")) return { createAdminClient: () => client };
    if (id.endsWith("ad-creative-settings")) return { DEFAULT_AD_CREATIVE_SETTINGS: {}, normalizeAdCreativeSettings: () => ({}) };
    if (id.endsWith("dog-media")) return { normalizeDogMediaUrl: (url) => url };
    if (id.endsWith("message-threads")) return { loadAppointmentMessageThreads: async () => ({ threads: [], messagesUnavailable: false }) };
    if (id.endsWith("dog-care-passport")) return { buildDogCareCompleteness: () => ({ percent: 0, missing: [] }), formatDogVaccinationStatus: () => "Unknown" };
    throw new Error(`Unexpected import ${id}`);
  } });
  return { load: module.exports.loadAdminDraftData, calls };
}

test("three concurrent shelter workspaces keep independent data with 750 dogs", async () => {
  const { load, calls } = loadWorkspace();
  const results = await Promise.all(["a", "b", "c"].map((shelter) => load({ shelterIds: [shelter] })));
  results.forEach((result, index) => {
    const shelter = ["a", "b", "c"][index];
    assert.equal(result.error, null);
    assert.equal(result.dogs.length, 200, "Each shelter receives its own page, even beyond the global limit");
    assert.ok(result.dogs.every((dog) => dog.shelterId === shelter));
    assert.equal(result.shelters.length, 1);
    assert.equal(result.shelters[0].bankAccountName, `Bank ${shelter}`);
    assert.equal(result.ads.length, 0);
    assert.equal(result.adClicks.length, 0);
  });
  assert.ok(calls.every((call) => call.filters.length > 0), "All shelter workspace reads must be scoped at the database");
  assert.ok(!calls.some((call) => ["ads", "ad_clicks", "site_settings", "pawjai_profile"].includes(call.table)));
});

test("empty shelter access returns no partner records", async () => {
  const { load } = loadWorkspace();
  const result = await load({ shelterIds: [] });
  assert.equal(result.dogs.length, 0);
  assert.equal(result.shelters.length, 0);
  assert.equal(result.donations.length, 0);
});

test("global admin keeps the existing cross-shelter workspace", async () => {
  const { load, calls } = loadWorkspace();
  const result = await load();
  assert.equal(result.error, null);
  assert.equal(result.shelters.length, 3);
  assert.ok(calls.some((call) => call.table === "ads"));
  assert.ok(calls.some((call) => call.table === "ad_clicks"));
  assert.ok(calls.filter((call) => call.table === "dogs").every((call) => call.filters.length === 0));
});
