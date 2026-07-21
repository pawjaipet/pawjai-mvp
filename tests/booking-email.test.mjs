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
      appointment_date: "2026-05-30",
      appointment_time: "13:00",
      adopter_id: "adopter-1",
      dog_id: "dog-1",
      shelter_id: "shelter-1",
      status: "confirmed",
    },
    adopters: {
      email: "proudxd@gmail.com",
      first_name: "Polchaya",
      last_name: "Sudlabha",
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
    appointmentDate: "2026-05-30",
    appointmentTime: "13:00",
    bookingCode: "APT-5F1A2",
    status: "requested",
  },
  dogName: "Mali",
  recipientEmail: "adopter@pawjai.pet",
  shelter: {
    addressLine: "123 Happy Road",
    district: "Watthana",
    email: "shelter@pawjai.pet",
    name: "Bangkok Dog Shelter",
    phoneNumber: "02-123-4567",
    postalCode: "10110",
    province: "Bangkok",
    subdistrict: "Khlong Tan Nuea",
  },
};

test("builds a pending adopter email with booking number, contact, location, and visit time", () => {
  const { buildBookingNotificationEmail } = loadBookingEmail();
  const email = buildBookingNotificationEmail(details);

  assert.equal(email.to, "adopter@pawjai.pet");
  assert.equal(email.subject, "PawJai booking APT-5F1A2 is pending");
  assert.match(email.text, /Booking number: APT-5F1A2/);
  assert.match(email.text, /Status: Pending/);
  assert.match(email.text, /Visit: 2026-05-30 at 13:00/);
  assert.match(email.text, /Shelter contact: Bangkok Dog Shelter, shelter@pawjai.pet, 02-123-4567/);
  assert.match(email.text, /Shelter location: 123 Happy Road, Khlong Tan Nuea, Watthana, Bangkok, 10110/);
});

test("builds role-aware booking emails for the adopter and shelter", () => {
  const { buildBookingNotificationEmails } = loadBookingEmail();
  const emails = buildBookingNotificationEmails(details);

  assert.equal(emails.length, 2);
  assert.equal(emails[0].to, "adopter@pawjai.pet");
  assert.equal(emails[0].subject, "PawJai booking APT-5F1A2 is pending");
  assert.equal(emails[1].to, "shelter@pawjai.pet");
  assert.equal(emails[1].subject, "New PawJai booking APT-5F1A2 is pending");
  assert.match(emails[1].text, /Adopter: adopter@pawjai.pet/);
  assert.match(emails[1].text, /Dog: Mali/);
  assert.match(emails[1].text, /Visit: 2026-05-30 at 13:00/);
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

test("builds date change request emails for both parties", () => {
  const { buildBookingNotificationEmails } = loadBookingEmail();
  const emails = buildBookingNotificationEmails({
    ...details,
    event: "date_change_requested",
    appointment: {
      ...details.appointment,
      appointmentDate: "2026-06-01",
      appointmentTime: "14:00",
    },
  });

  assert.equal(emails[0].subject, "PawJai booking APT-5F1A2 has a date change request");
  assert.match(emails[0].text, /Status: Date change requested/);
  assert.match(emails[0].text, /Visit: 2026-06-01 at 14:00/);
  assert.equal(emails[1].subject, "PawJai booking APT-5F1A2 needs a date change review");
});

test("builds shelter-only return inquiry email", () => {
  const { buildReturnInquiryNotificationEmail } = loadBookingEmail();
  const email = buildReturnInquiryNotificationEmail({
    appointment: {
      appointmentDate: "2026-05-30",
      appointmentTime: "13:00",
      bookingCode: "APT-5F1A2",
    },
    adopterName: "Mali Visitor, adopter@pawjai.pet",
    dogName: "Yala",
    shelter: {
      email: "shelter@pawjai.pet",
      name: "Bangkok Dog Shelter",
    },
  });

  assert.equal(email.to, "shelter@pawjai.pet");
  assert.equal(email.subject, "PawJai return inquiry for booking APT-5F1A2");
  assert.match(email.text, /Status: Return inquiry/);
  assert.match(email.text, /Visit: 2026-05-30 at 13:00/);
  assert.match(email.text, /Adopter: Mali Visitor, adopter@pawjai.pet/);
  assert.match(email.text, /Dog: Yala/);
});

test("builds appointment message email for the opposite party", () => {
  const { buildAppointmentMessageNotificationEmail } = loadBookingEmail();
  const shelterEmail = buildAppointmentMessageNotificationEmail({
    appointment: {
      appointmentDate: "2026-05-30",
      appointmentId: "appointment-1",
      appointmentTime: "13:00",
      bookingCode: "APT-5F1A2",
    },
    adopter: {
      email: "adopter@pawjai.pet",
      name: "Mali Visitor",
    },
    attachmentName: "home-video.mov",
    body: "Here is the update from home.",
    dogName: "Yala",
    senderLabel: "Mali Visitor",
    senderRole: "adopter",
    shelter: {
      email: "shelter@pawjai.pet",
      name: "Bangkok Dog Shelter",
    },
  });
  const adopterEmail = buildAppointmentMessageNotificationEmail({
    appointment: {
      appointmentDate: "2026-05-30",
      appointmentId: "appointment-1",
      appointmentTime: "13:00",
      bookingCode: "APT-5F1A2",
    },
    adopter: {
      email: "adopter@pawjai.pet",
      name: "Mali Visitor",
    },
    attachmentName: null,
    body: "Thanks, please send more photos.",
    dogName: "Yala",
    senderLabel: "Shelter team",
    senderRole: "shelter",
    shelter: {
      email: "shelter@pawjai.pet",
      name: "Bangkok Dog Shelter",
    },
  });

  assert.equal(shelterEmail.to, "shelter@pawjai.pet");
  assert.equal(shelterEmail.subject, "New PawJai message for booking APT-5F1A2");
  assert.match(shelterEmail.text, /From: Mali Visitor/);
  assert.match(shelterEmail.text, /Attachment: home-video.mov/);
  assert.match(shelterEmail.text, /Open conversation: https:\/\/www.pawjaipet.com\/shelter\/bangkokdogshelter\?view=messages/);
  assert.equal(adopterEmail.to, "adopter@pawjai.pet");
  assert.match(adopterEmail.text, /From: Shelter team/);
  assert.match(adopterEmail.text, /Open conversation: https:\/\/www.pawjaipet.com\/appointments\/appointment-1\?tab=messages/);
});

test("skips the shelter email when the shelter profile has no email", () => {
  const { buildBookingNotificationEmails } = loadBookingEmail();
  const emails = buildBookingNotificationEmails({
    ...details,
    shelter: { ...details.shelter, email: "" },
  });

  assert.equal(emails.length, 1);
  assert.equal(emails[0].to, "adopter@pawjai.pet");
});

test("skips reserved example.com recipients so QA bookings do not bounce", () => {
  const { buildBookingNotificationEmails, buildReturnInquiryNotificationEmail, getBookingNotificationRecipient } = loadBookingEmail();
  const emails = buildBookingNotificationEmails({
    ...details,
    recipientEmail: "codex-pawjai-qa-1782895471164@example.com",
    shelter: {
      ...details.shelter,
      email: "qa-shelter-1782896841423@example.com",
    },
  });

  assert.equal(emails.length, 0);
  assert.equal(
    getBookingNotificationRecipient({
      recipientEmail: "codex-pawjai-qa-1782895471164@example.com",
    }),
    "",
  );
  assert.equal(
    buildReturnInquiryNotificationEmail({
      appointment: details.appointment,
      adopterName: "QA Visitor",
      dogName: "Yala",
      shelter: { email: "qa-shelter-1782896841423@example.com", name: "QA Shelter" },
    }),
    null,
  );
});

test("falls back to the PawJai inbox only when the adopter email is missing", () => {
  const { getBookingNotificationRecipient } = loadBookingEmail();

  assert.equal(
    getBookingNotificationRecipient({
      recipientEmail: "adopter@pawjai.pet",
    }),
    "adopter@pawjai.pet",
  );
  assert.equal(
    getBookingNotificationRecipient({
      recipientEmail: "",
    }),
    "pawjaipet@gmail.com",
  );
});

test("sends to adopter and shelter emails without requiring the booking_code column", async () => {
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

  assert.equal(sentMessages.length, 2);
  assert.equal(sentMessages[0].to, "proudxd@gmail.com");
  assert.equal(sentMessages[0].subject, "PawJai booking APT-6BFC0 was accepted");
  assert.equal(sentMessages[1].to, "test@test.com");
  assert.equal(sentMessages[1].subject, "PawJai booking APT-6BFC0 was accepted");
  assert.equal(admin.calls[0].columns.includes("booking_code"), false);
  assert.match(sentMessages[0].text, /Shelter contact: The Voice Foundation, test@test.com, 1111111111/);
  assert.match(sentMessages[0].text, /Shelter location: b, c/);
  assert.match(sentMessages[1].text, /Adopter: Polchaya Sudlabha, proudxd@gmail.com/);
});

test("sends return inquiry notification to shelter", async () => {
  const sentMessages = [];
  const { sendReturnInquiryNotificationForAppointment } = loadBookingEmailWithSentMessages(sentMessages);
  const admin = createFakeAdmin();

  await sendReturnInquiryNotificationForAppointment({
    admin,
    appointmentId: "6bfc0abc-1111-2222-3333-444455556666",
  });

  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].to, "test@test.com");
  assert.equal(sentMessages[0].subject, "PawJai return inquiry for booking APT-6BFC0");
  assert.match(sentMessages[0].text, /Adopter: Polchaya Sudlabha, proudxd@gmail.com/);
  assert.match(sentMessages[0].text, /Dog: Yala/);
});

test("sends appointment message notification to the opposite party", async () => {
  const sentMessages = [];
  const { sendAppointmentMessageNotificationForAppointment } = loadBookingEmailWithSentMessages(sentMessages);
  const admin = createFakeAdmin();

  await sendAppointmentMessageNotificationForAppointment({
    admin,
    appointmentId: "6bfc0abc-1111-2222-3333-444455556666",
    attachmentName: "home-video.mov",
    body: "Here is the update from home.",
    senderLabel: "Polchaya Sudlabha",
    senderRole: "adopter",
  });

  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].to, "test@test.com");
  assert.equal(sentMessages[0].subject, "New PawJai message for booking APT-6BFC0");
  assert.match(sentMessages[0].text, /From: Polchaya Sudlabha/);
  assert.match(sentMessages[0].text, /Attachment: home-video.mov/);
  assert.match(sentMessages[0].text, /Open conversation: https:\/\/www.pawjaipet.com\/shelter\/thevoicefoundation\?view=messages/);
});
