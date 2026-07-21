import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Script } from "node:vm";
import ts from "typescript";

function loadAdClickUrlModule() {
  const source = readFileSync(new URL("../utils/ad-click-url.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };

  new Script(outputText).runInNewContext({
    exports: module.exports,
    FormDataEntryValue: String,
    module,
    URL,
  });

  return module.exports;
}

test("normalizes ad click URLs without requiring a protocol", () => {
  const { normalizeAdClickUrl } = loadAdClickUrlModule();

  assert.equal(normalizeAdClickUrl("pawjaipet.com/ads"), "https://pawjaipet.com/ads");
  assert.equal(normalizeAdClickUrl("www.instagram.com/pawjai"), "https://www.instagram.com/pawjai");
  assert.equal(normalizeAdClickUrl("https://pawjaipet.com/ads"), "https://pawjaipet.com/ads");
  assert.equal(normalizeAdClickUrl("http://example.com/path"), "http://example.com/path");
});

test("rejects blank or unsafe ad click URLs", () => {
  const { normalizeAdClickUrl } = loadAdClickUrlModule();

  assert.equal(normalizeAdClickUrl(""), "");
  assert.throws(() => normalizeAdClickUrl("javascript:alert(1)"), /website link/);
  assert.throws(() => normalizeAdClickUrl("https://"), /valid click URL/);
});
