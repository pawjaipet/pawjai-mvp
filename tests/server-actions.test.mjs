import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("documents server action file only exports async server actions", () => {
  const source = readFileSync(new URL("../app/documents/actions.ts", import.meta.url), "utf8");
  const exportedValues = [
    ...source.matchAll(/^export\s+(?!async\s+function|type\s+)(?:const|let|var|function|class)\s+([A-Za-z0-9_]+)/gm),
  ].map((match) => match[1]);

  assert.deepEqual(exportedValues, []);
});
