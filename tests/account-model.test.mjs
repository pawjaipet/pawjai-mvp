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
  new Script(outputText).runInNewContext({
    exports: module.exports,
    module,
    URL,
    URLSearchParams,
  });
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

test("rejects mismatched sign up passwords", () => {
  const { parseAccountCredentials } = loadAccountModel();
  assert.throws(
    () =>
      parseAccountCredentials({
        email: "user@example.com",
        password: "password123",
        confirmPassword: "password456",
      }),
    /Passwords do not match/i,
  );
});

test("builds readable appointment dates for saved bookings", () => {
  const { formatAppointmentDateTime } = loadAccountModel();
  assert.equal(formatAppointmentDateTime("2026-05-12", "14:30:00"), "May 12, 2026 at 2:30 PM");
});

test("classifies protected adopter routes", () => {
  const { isAuthProtectedPath } = loadAccountModel();
  assert.equal(isAuthProtectedPath("/swipe"), false);
  assert.equal(isAuthProtectedPath("/dogs/abc"), false);
  assert.equal(isAuthProtectedPath("/filter"), true);
  assert.equal(isAuthProtectedPath("/messages/123"), true);
  assert.equal(isAuthProtectedPath("/admin/dogs/new"), false);
});

test("sanitizes next paths for auth redirects", () => {
  const { sanitizeNextPath, buildAuthPath } = loadAccountModel();
  assert.equal(sanitizeNextPath("/appointments?message=hello"), "/appointments?message=hello");
  assert.equal(sanitizeNextPath("https://evil.test/profile"), "/swipe");
  assert.equal(sanitizeNextPath("//evil.test"), "/swipe");
  assert.equal(
    buildAuthPath({ nextPath: "/schedule?dogId=123", reason: "Sign in first" }),
    "/auth?next=%2Fschedule%3FdogId%3D123&message=Sign+in+first",
  );
});

test("maps auth provider errors to customer-friendly messages", () => {
  const { friendlyAuthMessage } = loadAccountModel();
  assert.match(
    friendlyAuthMessage("email rate limit exceeded"),
    /Too many signup or verification emails/i,
  );
  assert.match(
    friendlyAuthMessage("invalid login credentials"),
    /Email or password did not match/i,
  );
  assert.match(
    friendlyAuthMessage("invalid_grant: code verifier should match"),
    /verification link is expired/i,
  );
});
