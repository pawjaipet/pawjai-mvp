import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadBookingModel() {
  const source = readFileSync(new URL("../utils/booking.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  const crypto = {
    createHash() {
      return {
        value: "",
        update(input) {
          this.value += String(input);
          return this;
        },
        digest() {
          return `hash:${this.value}`;
        },
      };
    },
    createHmac(_algorithm, secret) {
      return {
        value: String(secret),
        update(input) {
          this.value += `:${String(input)}`;
          return this;
        },
        digest() {
          return Buffer.from(`sig:${this.value}`).toString("base64url");
        },
      };
    },
    randomBytes(size) {
      return Buffer.from(Array.from({ length: size }, (_, index) => index + 1));
    },
  };

  function require(name) {
    if (name === "node:crypto") return crypto;
    throw new Error(`Unexpected require: ${name}`);
  }

  new Script(outputText).runInNewContext({
    Buffer,
    URL,
    URLSearchParams,
    exports: module.exports,
    module,
    require,
  });
  return module.exports;
}

test("creates human-readable booking codes from appointment ids", () => {
  const { formatBookingCode, normalizeBookingCodeSearch } = loadBookingModel();

  assert.equal(
    formatBookingCode("5f1a2b3c-9988-7766-5544-33221100aabb"),
    "APT-5F1A2",
  );
  assert.equal(normalizeBookingCodeSearch(" apt-5f1a2 "), "APT-5F1A2");
  assert.equal(normalizeBookingCodeSearch("5f1a2"), "APT-5F1A2");
  assert.equal(normalizeBookingCodeSearch(""), "");
});

test("generates scan tokens and stores only their hashes", () => {
  const { createCheckInToken, hashCheckInToken } = loadBookingModel();
  const token = createCheckInToken();

  assert.equal(token, "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA");
  assert.equal(hashCheckInToken(token), `hash:${token}`);
});

test("creates stable signed check-in tokens for appointment QR codes", () => {
  const { createSignedCheckInToken, verifySignedCheckInToken } = loadBookingModel();
  const appointmentId = "5f1a2b3c-9988-7766-5544-33221100aabb";
  const token = createSignedCheckInToken({
    appointmentId,
    secret: "test-secret",
  });

  assert.equal(
    token,
    "NWYxYTJiM2MtOTk4OC03NzY2LTU1NDQtMzMyMjExMDBhYWJi.c2lnOnRlc3Qtc2VjcmV0OjVmMWEyYjNjLTk5ODgtNzc2Ni01NTQ0LTMzMjIxMTAwYWFiYg",
  );
  assert.equal(verifySignedCheckInToken({ token, secret: "test-secret" }), appointmentId);
  assert.equal(verifySignedCheckInToken({ token, secret: "wrong-secret" }), null);
});

test("builds shared check-in URLs with the opaque scan token", () => {
  const { buildAdminBookingDetailPath, buildCheckInUrl } = loadBookingModel();

  assert.equal(
    buildCheckInUrl({
      origin: "https://pawjai.co.th",
      token: "scan-token",
    }),
    "https://pawjai.co.th/booking/check-in?token=scan-token",
  );
  assert.equal(
    buildAdminBookingDetailPath({
      appointmentId: "5f1a2b3c-9988-7766-5544-33221100aabb",
      token: "scan-token",
    }),
    "/admin/bookings/5f1a2b3c-9988-7766-5544-33221100aabb?token=scan-token",
  );
});
