import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("treat modal renders through a body portal so swipe cards cannot constrain it", () => {
  const source = readFileSync(new URL("../components/donations/TreatButton.tsx", import.meta.url), "utf8");

  assert.match(source, /createPortal/);
  assert.match(source, /document\.body/);
});
