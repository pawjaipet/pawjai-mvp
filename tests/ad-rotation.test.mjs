import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadAdRotation() {
  const source = readFileSync(new URL("../utils/ad-rotation.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  new Script(outputText).runInNewContext({
    exports: module.exports,
    module,
  });
  return module.exports;
}

test("daily ad shuffle is deterministic and keeps all ads", () => {
  const { shuffleAdsForDate } = loadAdRotation();
  const ads = Array.from({ length: 9 }, (_, index) => ({ id: `ad-${index + 1}` }));

  const first = shuffleAdsForDate(ads, "2026-05-10");
  const second = shuffleAdsForDate(ads, "2026-05-10");

  assert.equal(JSON.stringify(first.map((ad) => ad.id)), JSON.stringify(second.map((ad) => ad.id)));
  assert.equal(new Set(first.map((ad) => ad.id)).size, 9);
  assert.equal(JSON.stringify(ads.map((ad) => ad.id)), JSON.stringify(Array.from({ length: 9 }, (_, index) => `ad-${index + 1}`)));
});

test("daily ad shuffle changes visible priority across dates", () => {
  const { shuffleAdsForDate } = loadAdRotation();
  const ads = Array.from({ length: 9 }, (_, index) => ({ id: `ad-${index + 1}` }));

  const todayVisible = shuffleAdsForDate(ads, "2026-05-10").slice(0, 3).map((ad) => ad.id);
  const tomorrowVisible = shuffleAdsForDate(ads, "2026-05-11").slice(0, 3).map((ad) => ad.id);

  assert.notEqual(JSON.stringify(todayVisible), JSON.stringify(tomorrowVisible));
});
