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

function loadBookingEmailWithSentMessages(sentMessages) {
  const source = readFileSync(new URL("../utils/booking-email.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };

  function require(name) {
    if (name === "@/lib/resend") {
      return {
        getResendClient() {
          return {
            emails: {
              async send(message) {
                sentMessages.push(message);
                return { data: { id: "email-id" }, error: null };
              },
            },
          };
        },
      };
    }
    throw new Error(`Unexpected require: ${name}`);
  }

  new Script(outputText).runInNewContext({
    console,
    exports: module.exports,
    module,
    process: { env: {} },
    require,
  });
  return module.exports;
}

function createFakeAdmin({ firstAppointmentError = null } = {}) {
  const calls = [];
  const rows = {
    appointments: {
      id: "6bfc0abc-1111-2222-3333-444455556666",
      adopter_id: "adopter-1",
      dog_id: "dog-1",
      shelter_id: "shelter-1",
      status: "confirmed",
    },
    adopters: {
      email: "proudxd@gmail.com",
    },
    dogs: {
      name: "Yala",
    },
    shelters: {
      address_line: "b, c",
      district: null,
      email: "test@test.com",
      name: "The Voice Foundation",
      phone_number: "1111111111",
      postal_code: null,
      province: null,
      subdistrict: null,
    },
  };
  let appointmentAttempts = 0;

  return {
    calls,
    from(table) {
      const query = {
        select(columns) {
          calls.push({ columns, table });
          return query;
        },
        eq() {
          return query;
        },
        async maybeSingle() {
          if (table === "appointments") {
            appointmentAttempts += 1;
            const selectedColumns = calls.findLast((call) => call.table === "appointments")?.columns ?? "";
            if (appointmentAttempts === 1 && firstAppointmentError && selectedColumns.includes("booking_code")) {
              return { data: null, error: firstAppointmentError };
            }
          }
          return { data: rows[table], error: null };
        },
      };
      return query;
    },
  };
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

test("falls back to the PawJai inbox only when the adopter email is missing", () => {
  const { getBookingNotificationRecipient } = loadBookingEmail();

  assert.equal(
    getBookingNotificationRecipient({
      recipientEmail: "adopter@example.com",
    }),
    "adopter@example.com",
  );
  assert.equal(
    getBookingNotificationRecipient({
      recipientEmail: "",
    }),
    "pawjaipet@gmail.com",
  );
});

test("sends to adopter email without requiring the booking_code column", async () => {
  const sentMessages = [];
  const { sendBookingNotificationForAppointment } = loadBookingEmailWithSentMessages(sentMessages);
  const admin = createFakeAdmin({
    firstAppointmentError: {
      message: "column appointments.booking_code does not exist",
    },
  });

  await sendBookingNotificationForAppointment({
    admin,
    appointmentId: "6bfc0abc-1111-2222-3333-444455556666",
  });

  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].to, "proudxd@gmail.com");
  assert.equal(sentMessages[0].subject, "PawJai booking APT-6BFC0 was accepted");
  assert.equal(admin.calls[0].columns.includes("booking_code"), false);
  assert.match(sentMessages[0].text, /Shelter contact: The Voice Foundation, test@test.com, 1111111111/);
  assert.match(sentMessages[0].text, /Shelter location: b, c/);
});
