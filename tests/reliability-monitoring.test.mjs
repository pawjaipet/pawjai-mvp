import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function load() {
  const source = readFileSync(new URL("../utils/reliability-schema.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const module = { exports: {} };
  new Script(outputText).runInNewContext({ exports: module.exports, module });
  return module.exports;
}

test("reliability reports allow only safe bounded fields", () => {
  const { sanitizeReliabilityReport } = load();
  const report = sanitizeReliabilityReport({ eventName: "form_outcome", route: "/shelter/voice/dogs/79cfcd26-7dfa-4870-b4ea-d1c42a390b17/edit?secret=x", stage: "persistence", correlationId: "79cfcd26-7dfa-4870-b4ea-d1c42a390b17", metadata: { fieldId: "email", retryCount: 2, password: "hidden", nested: { value: "hidden" }, long: "x".repeat(121) } });
  assert.equal(report.route, "/shelter/voice/dogs/[id]/edit");
  assert.equal(JSON.stringify(report.metadata), JSON.stringify({ fieldId: "email", retryCount: 2 }));
});

test("reliability rejects unknown events and unsafe routes", () => {
  const { sanitizeReliabilityReport } = load();
  assert.equal(sanitizeReliabilityReport({ eventName: "page_view", route: "/" }), null);
  assert.equal(sanitizeReliabilityReport({ eventName: "client_exception", route: "https://bad.example" }).route, "unknown");
});
