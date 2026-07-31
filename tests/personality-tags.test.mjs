import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Script } from "node:vm";
import ts from "typescript";

function loadPersonalityTags() {
  const source = readFileSync(new URL("../utils/personality-tags.ts", import.meta.url), "utf8");
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

test("personality tags collapse case and whitespace duplicates", () => {
  const { dedupePersonalityTags } = loadPersonalityTags();

  assert.deepEqual(
    Array.from(dedupePersonalityTags(["Funny", " funny ", "FUNNY", "Very   calm", "very calm"])),
    ["Funny", "Very calm"],
  );
});

test("personality tag catalog keeps one canonical option", () => {
  const { mergePersonalityTags } = loadPersonalityTags();
  const tags = Array.from(mergePersonalityTags(["funny", "New tag", " new   tag "]));

  assert.equal(tags.filter((tag) => tag.toLowerCase() === "funny").length, 1);
  assert.equal(tags.includes("New tag"), true);
  assert.equal(tags.includes("new tag"), false);
});
