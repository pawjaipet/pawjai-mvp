import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function transpile(url) {
  return ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
}

function loadAuthAnalytics() {
  const module = { exports: {} };
  new Script(transpile(new URL("../utils/auth-analytics.ts", import.meta.url))).runInNewContext({
    decodeURIComponent,
    exports: module.exports,
    module,
  });
  return module.exports;
}

function loadConfirmRoute({ profileFails = false, user = { id: "controlled-test-user" }, verifyError = null } = {}) {
  const authAnalytics = loadAuthAnalytics();
  const cookieJar = new Map();
  const supabase = {
    auth: {
      getUser: async () => ({ data: { user } }),
      verifyOtp: async () => ({ error: verifyError }),
    },
  };

  class ResponseMock {
    static redirect(url) {
      return new ResponseMock(url);
    }

    constructor(url) {
      this.url = url.toString();
      this.cookies = {
        set: (name, value, options) => cookieJar.set(name, { options, value }),
      };
    }
  }

  const module = { exports: {} };
  new Script(transpile(new URL("../app/auth/confirm/route.ts", import.meta.url))).runInNewContext({
    URL,
    console: { error() {}, log() {}, warn() {} },
    exports: module.exports,
    module,
    process: { env: { NODE_ENV: "production" } },
    require: (id) => {
      if (id === "next/server") return { NextResponse: ResponseMock };
      if (id === "@/utils/adopter") return {
        ensureAdopterForUser: async () => {
          if (profileFails) throw new Error("controlled profile failure");
        },
      };
      if (id === "@/utils/account-model") return {
        friendlyAuthMessage: (message) => message,
        sanitizeNextPath: (path) => path?.startsWith("/") ? path : "/swipe",
      };
      if (id === "@/utils/auth-analytics") return authAnalytics;
      if (id === "@/utils/supabase/server") return { createClient: async () => supabase };
      throw new Error(`Unexpected import: ${id}`);
    },
  });

  return { authAnalytics, cookieJar, route: module.exports };
}

function receiptsFrom(result) {
  const cookie = result.cookieJar.get(result.authAnalytics.AUTH_ANALYTICS_COOKIE);
  return {
    cookie,
    receipts: result.authAnalytics.parseAuthAnalyticsReceipts(cookie?.value ?? ""),
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("email-link verification redirects with verified then completed-login receipts", async () => {
  const result = loadConfirmRoute();
  const response = await result.route.GET({
    url: "https://www.pawjaipet.com/auth/confirm?token_hash=opaque&type=signup&next=%2Ffilter",
  });
  const { cookie, receipts } = receiptsFrom(result);

  assert.equal(response.url, "https://www.pawjaipet.com/filter");
  assert.equal(cookie.options.maxAge, 60);
  assert.equal(cookie.options.sameSite, "lax");
  assert.equal(cookie.options.secure, true);
  assert.deepEqual(plain(receipts.map(({ event, stage }) => ({ event, stage }))), [
    { event: "email_verified", stage: "email_link" },
    { event: "login", stage: "profile_setup" },
  ]);
});

test("email-link profile failure keeps verification success and omits login", async () => {
  const result = loadConfirmRoute({ profileFails: true });
  const response = await result.route.GET({
    url: "https://www.pawjaipet.com/auth/confirm?token_hash=opaque&type=email&next=%2Fswipe",
  });
  const { receipts } = receiptsFrom(result);

  assert.match(response.url, /^https:\/\/www\.pawjaipet\.com\/auth\?/);
  assert.deepEqual(plain(receipts.map(({ event, reason, stage }) => ({ event, reason, stage }))), [
    { event: "email_verified", reason: "confirmed", stage: "email_link" },
    { event: "auth_failed", reason: "profile_setup", stage: "profile_setup" },
  ]);
});

test("expired and malformed email links redirect with coarse failure receipts", async () => {
  const expired = loadConfirmRoute({ verifyError: { code: "otp_expired", message: "private provider detail" } });
  await expired.route.GET({
    url: "https://www.pawjaipet.com/auth/confirm?token_hash=opaque&type=signup",
  });
  assert.deepEqual(plain(receiptsFrom(expired).receipts.map(({ event, reason, stage }) => ({ event, reason, stage }))), [
    { event: "auth_failed", reason: "otp_expired", stage: "email_link" },
  ]);

  const malformed = loadConfirmRoute();
  await malformed.route.GET({ url: "https://www.pawjaipet.com/auth/confirm?next=%2Fswipe" });
  assert.deepEqual(plain(receiptsFrom(malformed).receipts.map(({ event, reason, stage }) => ({ event, reason, stage }))), [
    { event: "auth_failed", reason: "missing_link_params", stage: "email_link" },
  ]);
});
