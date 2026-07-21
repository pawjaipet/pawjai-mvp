import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadAdDateRange() {
  const source = readFileSync(new URL("../utils/ad-date-range.ts", import.meta.url), "utf8");
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

test("accepts valid ad date ranges", () => {
  const { parseAdDateRange } = loadAdDateRange();

  assert.equal(
    JSON.stringify(parseAdDateRange("2026-05-10", "2026-05-27")),
    JSON.stringify({
      endDate: "2026-05-27",
      startDate: "2026-05-10",
    }),
  );
});

test("supports open-ended partner ads and minimum start dates", () => {
  const { parseAdDateRange } = loadAdDateRange();

  assert.equal(
    JSON.stringify(parseAdDateRange("2026-07-21", "", {
      defaultEndDate: "2099-12-31",
      minStartDate: "2026-07-21",
    })),
    JSON.stringify({
      endDate: "2099-12-31",
      startDate: "2026-07-21",
    }),
  );
  assert.throws(() => parseAdDateRange("2026-07-20", "", {
    defaultEndDate: "2099-12-31",
    minStartDate: "2026-07-21",
  }), /start date/i);
});

test("rejects missing, malformed, and reversed ad date ranges", () => {
  const { parseAdDateRange } = loadAdDateRange();

  assert.throws(() => parseAdDateRange("", "2026-05-27"), /required/i);
  assert.throws(() => parseAdDateRange("05/10/2026", "2026-05-27"), /yyyy-mm-dd/i);
  assert.throws(() => parseAdDateRange("2026-05-28", "2026-05-27"), /end date/i);
});
