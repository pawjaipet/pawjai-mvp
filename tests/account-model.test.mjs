import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadAccountModel() {
  const source = readFileSync(new URL("../utils/account-model.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  new Script(outputText).runInNewContext({ exports: module.exports, module });
  return module.exports;
}

test("normalizes email/password account credentials", () => {
  const { parseAccountCredentials } = loadAccountModel();
  assert.equal(
    JSON.stringify(parseAccountCredentials({
      email: "  USER@Example.COM ",
      password: "correct horse battery staple",
      fullName: "  Sud Labha  ",
    })),
    JSON.stringify({
      email: "user@example.com",
      password: "correct horse battery staple",
      fullName: "Sud Labha",
    }),
  );
});

test("rejects weak credentials before auth calls", () => {
  const { parseAccountCredentials } = loadAccountModel();
  assert.throws(
    () => parseAccountCredentials({ email: "not-an-email", password: "short" }),
    /valid email/i,
  );
  assert.throws(
    () => parseAccountCredentials({ email: "user@example.com", password: "short" }),
    /at least 8/i,
  );
});

test("builds readable appointment dates for saved bookings", () => {
  const { formatAppointmentDateTime } = loadAccountModel();
  assert.equal(formatAppointmentDateTime("2026-05-12", "14:30:00"), "May 12, 2026 at 2:30 PM");
});
