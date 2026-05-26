import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadBookingEmail() {
  const source = readFileSync(new URL("../utils/booking-email.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };

  function require(name) {
    if (name === "@/lib/resend") return { getResendClient() {} };
    throw new Error(`Unexpected require: ${name}`);
  }

  new Script(outputText).runInNewContext({
    exports: module.exports,
    module,
    process: { env: {} },
    require,
  });
  return module.exports;
}

const details = {
  appointment: {
    bookingCode: "APT-5F1A2",
    status: "requested",
  },
  dogName: "Mali",
  recipientEmail: "adopter@example.com",
  shelter: {
    addressLine: "123 Happy Road",
    district: "Watthana",
    email: "shelter@example.com",
    name: "Bangkok Dog Shelter",
    phoneNumber: "02-123-4567",
    postalCode: "10110",
    province: "Bangkok",
    subdistrict: "Khlong Tan Nuea",
  },
};

test("builds a pending booking email with booking number, contact, and location only", () => {
  const { buildBookingNotificationEmail } = loadBookingEmail();
  const email = buildBookingNotificationEmail(details);

  assert.equal(email.to, "adopter@example.com");
  assert.equal(email.subject, "PawJai booking APT-5F1A2 is pending");
  assert.match(email.text, /Booking number: APT-5F1A2/);
  assert.match(email.text, /Status: Pending/);
  assert.match(email.text, /Shelter contact: Bangkok Dog Shelter, shelter@example.com, 02-123-4567/);
  assert.match(email.text, /Shelter location: 123 Happy Road, Khlong Tan Nuea, Watthana, Bangkok, 10110/);
  assert.doesNotMatch(email.text, /Mali/);
  assert.doesNotMatch(email.text, /appointment date/i);
});

test("builds accepted and denied booking subjects from appointment status", () => {
  const { buildBookingNotificationEmail } = loadBookingEmail();

  assert.equal(
    buildBookingNotificationEmail({
      ...details,
      appointment: { ...details.appointment, status: "confirmed" },
    }).subject,
    "PawJai booking APT-5F1A2 was accepted",
  );
  assert.equal(
    buildBookingNotificationEmail({
      ...details,
      appointment: { ...details.appointment, status: "cancelled" },
    }).subject,
    "PawJai booking APT-5F1A2 was denied",
  );
});

test("can route booking notifications to the PawJai test inbox", () => {
  const { getBookingNotificationRecipient } = loadBookingEmail();

  assert.equal(
    getBookingNotificationRecipient({
      overrideEmail: "pawjaipet@gmail.com",
      recipientEmail: "adopter@example.com",
    }),
    "pawjaipet@gmail.com",
  );
  assert.equal(
    getBookingNotificationRecipient({
      overrideEmail: "",
      recipientEmail: "adopter@example.com",
    }),
    "adopter@example.com",
  );
});
