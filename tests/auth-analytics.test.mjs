import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadAuthAnalytics() {
  const source = readFileSync(new URL("../utils/auth-analytics.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  new Script(outputText).runInNewContext({
    decodeURIComponent,
    exports: module.exports,
    module,
  });
  return module.exports;
}

test("successful code and email-link verification emit verification before completed login", async () => {
  const { completeVerifiedEmailProfile } = loadAuthAnalytics();

  for (const stage of ["code_entry", "email_link"]) {
    const events = [];
    const result = await completeVerifiedEmailProfile({
      emit: (event) => events.push(event),
      ensureProfile: async () => ({ ok: true }),
      stage,
    });

    assert.equal(result.ok, true);
    assert.deepEqual(
      events.map(({ event, method, mode, stage: eventStage }) => ({ event, method, mode, stage: eventStage })),
      [
        { event: "email_verified", method: "email", mode: "verify", stage },
        { event: "login", method: "email", mode: "verify", stage: "profile_setup" },
      ],
    );
  }
});

test("verified email followed by profile failure remains a verification success without login", async () => {
  const { completeVerifiedEmailProfile } = loadAuthAnalytics();
  const events = [];
  const result = await completeVerifiedEmailProfile({
    emit: (event) => events.push(event),
    ensureProfile: async () => ({ ok: false, error: "Profile unavailable" }),
    stage: "email_link",
  });

  assert.equal(result.ok, false);
  assert.deepEqual(events.map(({ event, reason, stage }) => ({ event, reason, stage })), [
    { event: "email_verified", reason: "confirmed", stage: "email_link" },
    { event: "auth_failed", reason: "profile_setup", stage: "profile_setup" },
  ]);
});

test("invalid and expired verification outcomes stay coarse and low-cardinality", () => {
  const { authAnalyticsReceipt, authErrorReason } = loadAuthAnalytics();
  assert.equal(authErrorReason({ code: "otp_expired", message: "private provider detail" }), "otp_expired");
  assert.equal(authErrorReason({ message: "The email link has expired" }), "otp_expired");
  assert.equal(authErrorReason({ code: "unexpected", message: "user@example.com token=secret" }), "auth_error");
  assert.equal(authAnalyticsReceipt({
    event: "auth_failed",
    method: "email",
    mode: "verify",
    reason: "invalid_code_format",
    stage: "code_entry",
  }).reason, "invalid_code_format");
});

test("redirect receipts are short, allowlisted, and consumed once", () => {
  const {
    AUTH_ANALYTICS_COOKIE,
    authAnalyticsReceipt,
    consumeAuthAnalyticsReceipts,
    parseAuthAnalyticsReceipts,
    serializeAuthAnalyticsReceipts,
  } = loadAuthAnalytics();
  const encoded = serializeAuthAnalyticsReceipts([
    authAnalyticsReceipt({ event: "email_verified", method: "email", mode: "verify", reason: "confirmed", stage: "email_link" }),
    authAnalyticsReceipt({ event: "auth_failed", method: "email", mode: "verify", reason: "profile_setup", stage: "profile_setup" }),
  ]);
  const cookies = new Map([[AUTH_ANALYTICS_COOKIE, encoded]]);
  const store = {
    read: (name) => cookies.get(name) ?? null,
    remove: (name) => cookies.delete(name),
  };

  assert.equal(consumeAuthAnalyticsReceipts(store).length, 2);
  assert.equal(consumeAuthAnalyticsReceipts(store).length, 0);
  assert.equal(parseAuthAnalyticsReceipts("v1!auth_failed.email.verify.email_link.user@example.com").length, 0);
});

test("receipt serialization cannot include email addresses, codes, tokens, or arbitrary provider errors", () => {
  const { authAnalyticsReceipt, serializeAuthAnalyticsReceipts } = loadAuthAnalytics();
  const encoded = serializeAuthAnalyticsReceipts([authAnalyticsReceipt({
    email: "private@example.com",
    event: "auth_failed",
    method: "email",
    mode: "verify",
    reason: "private@example.com token_hash=secret code=123456",
    stage: "email_link",
    token: "secret",
  })]);

  assert.doesNotMatch(encoded, /private|@|secret|123456|token/i);
  assert.match(encoded, /auth_error/);
});

test("auth surfaces wire stage, method, resend, and email-link failure context", () => {
  const form = readFileSync(new URL("../components/auth/AuthForm.tsx", import.meta.url), "utf8");
  const confirm = readFileSync(new URL("../app/auth/confirm/route.ts", import.meta.url), "utf8");

  assert.match(form, /verification_submit[\s\S]*method: "email", mode: "verify", stage: "code_entry"/);
  assert.match(form, /verification_resent[\s\S]*method: "email", mode: "verify", stage: "resend"/);
  assert.match(form, /reason: authErrorReason\(error\), stage: "resend"/);
  assert.match(confirm, /reason: "missing_link_params"[\s\S]*stage: "email_link"/);
  assert.match(confirm, /completeVerifiedEmailProfile[\s\S]*stage: "email_link"/);
});
