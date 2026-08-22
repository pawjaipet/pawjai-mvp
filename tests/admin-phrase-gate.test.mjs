import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("admin access uses the PawJai Google account instead of a phrase gate", () => {
  const loginPageSource = readFileSync(new URL("../app/admin/login/page.tsx", import.meta.url), "utf8");
  const loginComponentSource = readFileSync(new URL("../components/admin/AdminGoogleLogin.tsx", import.meta.url), "utf8");
  const loginActionSource = readFileSync(new URL("../app/admin/login/actions.ts", import.meta.url), "utf8");
  const actionSource = readFileSync(new URL("../app/admin/dogs/new/actions.ts", import.meta.url), "utf8");
  const authSource = readFileSync(new URL("../utils/admin-auth.ts", import.meta.url), "utf8");
  const cookieScopeSource = readFileSync(new URL("../utils/admin-cookie-scope.ts", import.meta.url), "utf8");

  assert.equal(loginPageSource.includes("AdminGoogleLogin"), true);
  assert.equal(loginComponentSource.includes("signInWithIdToken"), true);
  assert.equal(loginComponentSource.includes("https://accounts.google.com/gsi/client"), true);
  assert.equal(loginComponentSource.includes("Log in with Google"), true);
  assert.equal(loginComponentSource.includes('href="/shelter"'), true);
  assert.equal(loginActionSource.includes("completeAdminGoogleLogin"), true);
  assert.equal(loginActionSource.includes("isPawjaiGoogleAdminUser"), true);
  assert.equal(actionSource.includes("Admin access now requires the PawJai Google account."), true);
  assert.equal(actionSource.includes("openAdminGate"), false);
  assert.equal(actionSource.includes("signInWithPassword"), false);
  assert.equal(authSource.includes("DEFAULT_PAWJAI_ADMIN_GOOGLE_EMAIL"), true);
  assert.equal(authSource.includes("pawjaipet@gmail.com"), true);
  assert.equal(authSource.includes("isPawjaiGoogleAdminUser"), true);
  assert.equal(authSource.includes('appProvider === "google"'), true);
  assert.equal(authSource.includes("appProviders.includes(\"google\")"), true);
  assert.equal(authSource.includes("return false;"), true);
  assert.equal(authSource.includes("pawjaiadmin"), false);
  assert.equal(authSource.includes("pawjai_admin_gate_unlocked"), true);
  assert.equal(authSource.includes('const ADMIN_GATE_COOKIE_PATHS = ["/", "/admin", "/booking"]'), true);
  assert.equal(authSource.includes('const ADMIN_DRAFT_COOKIE_PATHS = ["/", "/admindraft", "/booking"]'), true);
  assert.equal(authSource.includes("cookieStore.getAll(ADMIN_GATE_COOKIE)"), false);
  assert.equal(authSource.includes("cookieStore.getAll(ADMIN_DRAFT_COOKIE)"), false);
  assert.equal(authSource.includes("name: ADMIN_DRAFT_COOKIE"), true);
  assert.equal(authSource.includes("getAdminCookieDomains"), true);
  assert.equal(cookieScopeSource.includes("pawjaipet.com"), true);
  assert.equal(cookieScopeSource.includes("pawjai.co.th"), true);
  assert.equal(cookieScopeSource.includes("x-forwarded-host"), true);
});

test("admin login page is the Google-only entrypoint", () => {
  const loginSource = readFileSync(new URL("../app/admin/login/page.tsx", import.meta.url), "utf8");
  const authSource = readFileSync(new URL("../utils/admin-auth.ts", import.meta.url), "utf8");
  const adminSource = readFileSync(new URL("../app/admin/AdminWorkspacePage.tsx", import.meta.url), "utf8");
  const redirectsSource = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");

  assert.equal(loginSource.includes("AdminGoogleLogin"), true);
  assert.equal(loginSource.includes("sanitizeAdminNextPath"), true);
  assert.equal(loginSource.includes("AdminGateForm"), false);
  assert.equal(loginSource.includes("Unlock the dog onboarding workspace"), false);
  assert.equal(authSource.includes("/admin/login"), true);
  assert.equal(authSource.includes("buildAdminLoginPath"), true);
  assert.equal(authSource.includes("/admindraft"), true);
  assert.equal(authSource.includes('replace(/^\\/admindraft/, "/admin")'), true);
  assert.equal(adminSource.includes("requireGlobalAdmin"), true);
  assert.equal(adminSource.includes("initialMainTab={resolvedSearchParams?.view}"), true);
  assert.equal(redirectsSource.includes('source: "/admindraft/:path*"'), true);
  assert.equal(redirectsSource.includes('destination: "/admin/:path*"'), true);
});
