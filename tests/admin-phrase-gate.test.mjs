import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("temporary admin gate uses the shared phrase form instead of account login", () => {
  const formSource = readFileSync(new URL("../app/admin/dogs/new/AdminGateForm.tsx", import.meta.url), "utf8");
  const actionSource = readFileSync(new URL("../app/admin/dogs/new/actions.ts", import.meta.url), "utf8");
  const authSource = readFileSync(new URL("../utils/admin-auth.ts", import.meta.url), "utf8");
  const cookieScopeSource = readFileSync(new URL("../utils/admin-cookie-scope.ts", import.meta.url), "utf8");

  assert.equal(formSource.includes("Admin phrase"), true);
  assert.equal(formSource.includes('name="adminPhrase"'), true);
  assert.equal(formSource.includes("Admin email"), false);
  assert.equal(formSource.includes('name="email"'), false);
  assert.equal(formSource.includes('name="password"'), false);
  assert.equal(actionSource.includes("openAdminGate"), true);
  assert.equal(actionSource.includes("signInWithPassword"), false);
  assert.equal(authSource.includes("pawjaiadmin"), true);
  assert.equal(authSource.includes("pawjaiadmin!"), true);
  assert.equal(authSource.includes("pawjai_admin_gate_unlocked"), true);
  assert.equal(authSource.includes('const ADMIN_GATE_COOKIE_PATHS = ["/", "/admin", "/booking"]'), true);
  assert.equal(authSource.includes('const ADMIN_DRAFT_COOKIE_PATHS = ["/", "/admindraft", "/booking"]'), true);
  assert.equal(authSource.includes("cookieStore.getAll(ADMIN_GATE_COOKIE)"), true);
  assert.equal(authSource.includes("cookieStore.getAll(ADMIN_DRAFT_COOKIE)"), true);
  assert.equal(authSource.includes("name: ADMIN_DRAFT_COOKIE"), true);
  assert.equal(authSource.includes("getAdminCookieDomains"), true);
  assert.equal(cookieScopeSource.includes("pawjaipet.com"), true);
  assert.equal(cookieScopeSource.includes("pawjai.co.th"), true);
  assert.equal(cookieScopeSource.includes("x-forwarded-host"), true);
});

test("legacy admin login page is retired in favor of the admin draft gate", () => {
  const loginSource = readFileSync(new URL("../app/admin/login/page.tsx", import.meta.url), "utf8");
  const authSource = readFileSync(new URL("../utils/admin-auth.ts", import.meta.url), "utf8");
  const draftSource = readFileSync(new URL("../app/admindraft/page.tsx", import.meta.url), "utf8");

  assert.equal(loginSource.includes('redirect("/admindraft")'), true);
  assert.equal(loginSource.includes("AdminGateForm"), false);
  assert.equal(loginSource.includes("Unlock the dog onboarding workspace"), false);
  assert.equal(authSource.includes("/admin/login"), false);
  assert.equal(authSource.includes("/admindraft"), true);
  assert.equal(draftSource.includes("initialMainTab={resolvedSearchParams?.view}"), true);
});
