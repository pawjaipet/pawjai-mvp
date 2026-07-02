import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../app/filter/page.tsx", import.meta.url), "utf8");

test("filter preferences render as one scrolling save page", () => {
  assert.equal(source.includes("Continue"), false);
  assert.equal(source.includes("currentQuestion"), false);
  assert.equal(source.includes("mode"), false);
  assert.equal(source.includes("<ScrollFilter"), true);
  assert.equal(source.includes("Show Dogs"), true);
});

test("saved backend preferences win when returning to the filter page", () => {
  assert.equal(source.includes("const [hasLoadedInitialPreferences, setHasLoadedInitialPreferences] = useState(false);"), true);
  assert.equal(source.includes("if (!hasLoadedInitialPreferences) return;"), true);
  assert.equal(source.includes("setSelectedAnswers((current) => ({ ...current, ...saved }));"), true);
});
