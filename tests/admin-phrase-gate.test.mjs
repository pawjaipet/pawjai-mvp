import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("temporary admin gate uses the shared phrase form instead of account login", () => {
  const formSource = readFileSync(new URL("../app/admin/dogs/new/AdminGateForm.tsx", import.meta.url), "utf8");
  const actionSource = readFileSync(new URL("../app/admin/dogs/new/actions.ts", import.meta.url), "utf8");
  const authSource = readFileSync(new URL("../utils/admin-auth.ts", import.meta.url), "utf8");

  assert.equal(formSource.includes("Admin phrase"), true);
  assert.equal(formSource.includes('name="adminPhrase"'), true);
  assert.equal(formSource.includes("Admin email"), false);
  assert.equal(formSource.includes('name="email"'), false);
  assert.equal(formSource.includes('name="password"'), false);
  assert.equal(actionSource.includes("openAdminGate"), true);
  assert.equal(actionSource.includes("signInWithPassword"), false);
  assert.equal(authSource.includes("pawjaiadmin!"), true);
  assert.equal(authSource.includes("pawjai_admin_gate_unlocked"), true);
});
