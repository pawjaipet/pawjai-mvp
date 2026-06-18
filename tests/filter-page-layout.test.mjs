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
