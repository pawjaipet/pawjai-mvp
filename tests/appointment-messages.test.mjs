import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadAppointmentMessages() {
  const source = readFileSync(new URL("../utils/appointment-messages.ts", import.meta.url), "utf8");
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
  });
  return module.exports;
}

test("detects appointment message schema/cache failures", () => {
  const { isAppointmentMessagesUnavailableError, isReturnInquiriesUnavailableError } = loadAppointmentMessages();

  assert.equal(
    isAppointmentMessagesUnavailableError({
      message: "Could not find the table 'public.appointment_messages' in the schema cache",
    }),
    true,
  );
  assert.equal(
    isAppointmentMessagesUnavailableError({
      message: 'relation "public.appointment_messages" does not exist',
    }),
    true,
  );
  assert.equal(isAppointmentMessagesUnavailableError({ message: "duplicate key value violates unique constraint" }), false);
  assert.equal(isAppointmentMessagesUnavailableError(null), false);
  assert.equal(
    isReturnInquiriesUnavailableError({
      message: 'relation "public.return_inquiries" does not exist',
    }),
    true,
  );
  assert.equal(
    isReturnInquiriesUnavailableError({
      message: "Could not find the table 'public.return_inquiries' in the schema cache",
    }),
    true,
  );
  assert.equal(isReturnInquiriesUnavailableError({ message: "duplicate key value violates unique constraint" }), false);
});

test("database types include appointment messages table", () => {
  const source = readFileSync(new URL("../types/database.ts", import.meta.url), "utf8");

  assert.match(source, /appointment_messages:\s*\{/);
  assert.match(source, /attachment_storage_path: string \| null/);
  assert.match(source, /attachment_url: string \| null/);
  assert.match(source, /sender_role: "adopter" \| "shelter" \| "system"/);
  assert.match(source, /return_inquiries:\s*\{/);
});

function loadAppointmentMessageAttachments() {
  const source = readFileSync(new URL("../utils/appointment-message-attachments.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  new Script(outputText).runInNewContext({
    Buffer,
    console,
    crypto,
    exports: module.exports,
    File: class File {},
    module,
    require: (specifier) => {
      if (specifier === "@/utils/supabase/admin") {
        return { createAdminClient: () => ({}) };
      }
      return {};
    },
  });
  return module.exports;
}

test("signs appointment message attachments from private storage paths", async () => {
  const { signAppointmentMessageAttachments } = loadAppointmentMessageAttachments();
  const signedMessages = await signAppointmentMessageAttachments(
    {
      storage: {
        from(bucket) {
          assert.equal(bucket, "appointment-message-attachments");
          return {
            async createSignedUrl(path, expiresIn) {
              assert.equal(expiresIn, 60 * 60);
              return { data: { signedUrl: `signed:${path}` }, error: null };
            },
          };
        },
      },
    },
    [
      {
        attachment_storage_path: "appointment-messages/appt/file.pdf",
        attachment_url: "https://old-public-url.example/file.pdf",
        id: "message-with-path",
      },
      {
        attachment_storage_path: null,
        attachment_url: "https://legacy-public-url.example/file.pdf",
        id: "legacy-message",
      },
    ],
  );

  assert.equal(signedMessages[0].attachment_url, "signed:appointment-messages/appt/file.pdf");
  assert.equal(signedMessages[1].attachment_url, "https://legacy-public-url.example/file.pdf");
});

function loadMessageThreads() {
  const source = readFileSync(new URL("../utils/message-threads.ts", import.meta.url), "utf8");
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
    require: (specifier) => {
      if (specifier === "@/utils/appointment-messages") {
        return loadAppointmentMessages();
      }
      if (specifier === "@/utils/appointment-message-attachments") {
        return {
          signAppointmentMessageAttachments: async (_admin, messages) => messages,
        };
      }
      if (specifier === "@/utils/supabase/admin") {
        return { createAdminClient: () => ({}) };
      }
      return {};
    },
  });
  return module.exports;
}

const baseAppointments = [
  {
    adopter_id: "adopter-voice",
    appointment_date: "2026-07-20",
    appointment_time: "10:00",
    booking_code: "APT-VOICE",
    dog_id: "dog-voice",
    id: "appt-voice",
    shelter_id: "voice",
    status: "confirmed",
  },
  {
    adopter_id: "adopter-rescue",
    appointment_date: "2026-07-22",
    appointment_time: "11:30",
    booking_code: "APT-RESCUE",
    dog_id: "dog-rescue",
    id: "appt-rescue",
    shelter_id: "rescue",
    status: "requested",
  },
];

const baseMessages = [
  {
    adopter_id: "adopter-voice",
    appointment_id: "appt-voice",
    attachment_name: null,
    attachment_type: null,
    attachment_url: null,
    body: "Should I bring a leash?",
    created_at: "2026-07-08T08:00:00.000Z",
    id: "msg-voice-1",
    read_by_adopter_at: null,
    read_by_shelter_at: null,
    sender_label: "Mali Visitor",
    sender_role: "adopter",
    shelter_id: "voice",
  },
  {
    adopter_id: "adopter-voice",
    appointment_id: "appt-voice",
    attachment_name: null,
    attachment_type: null,
    attachment_url: null,
    body: "Please bring your ID and arrive ten minutes early.",
    created_at: "2026-07-08T09:00:00.000Z",
    id: "msg-voice-2",
    read_by_adopter_at: null,
    read_by_shelter_at: "2026-07-08T09:00:00.000Z",
    sender_label: "The Voice Foundation",
    sender_role: "shelter",
    shelter_id: "voice",
  },
  {
    adopter_id: "adopter-rescue",
    appointment_id: "appt-rescue",
    attachment_name: null,
    attachment_type: null,
    attachment_url: null,
    body: "Is parking available?",
    created_at: "2026-07-08T10:00:00.000Z",
    id: "msg-rescue-1",
    read_by_adopter_at: null,
    read_by_shelter_at: null,
    sender_label: "Nok Visitor",
    sender_role: "adopter",
    shelter_id: "rescue",
  },
];

const baseDogs = [
  { id: "dog-voice", name: "Won" },
  { id: "dog-rescue", name: "Lucky" },
];

const baseAdopters = [
  { email: "mali@example.com", first_name: "Mali", id: "adopter-voice", last_name: "Visitor", phone_number: "0800000000" },
  { email: "nok@example.com", first_name: "Nok", id: "adopter-rescue", last_name: "Visitor", phone_number: null },
];

const baseShelters = [
  { id: "voice", name: "The Voice Foundation" },
  { id: "rescue", name: "Rescue Dog Thailand" },
];

test("builds appointment message threads with shelter isolation and unread counts", () => {
  const { buildAppointmentMessageThreads } = loadMessageThreads();
  const threads = buildAppointmentMessageThreads({
    adopters: baseAdopters,
    appointments: baseAppointments,
    dogs: baseDogs,
    messages: baseMessages,
    shelterIds: ["voice"],
    shelters: baseShelters,
  });

  assert.equal(threads.length, 1);
  assert.equal(threads[0].appointmentId, "appt-voice");
  assert.equal(threads[0].adopterName, "Mali Visitor");
  assert.equal(threads[0].dogName, "Won");
  assert.equal(threads[0].latestMessage?.body, "Please bring your ID and arrive ten minutes early.");
  assert.equal(threads[0].unreadForShelterCount, 1);
  assert.equal(threads[0].needsReply, false);
  assert.deepEqual(Array.from(threads[0].messages.map((message) => message.id)), ["msg-voice-1", "msg-voice-2"]);
});

test("admin appointment message threads include all shelters", () => {
  const { buildAppointmentMessageThreads } = loadMessageThreads();
  const threads = buildAppointmentMessageThreads({
    adopters: baseAdopters,
    appointments: baseAppointments,
    dogs: baseDogs,
    messages: baseMessages,
    shelters: baseShelters,
  });

  assert.deepEqual(threads.map((thread) => thread.shelterId).sort(), ["rescue", "voice"]);
});

test("filters appointment message threads by search and message state", () => {
  const { buildAppointmentMessageThreads, filterAppointmentMessageThreads } = loadMessageThreads();
  const threads = buildAppointmentMessageThreads({
    adopters: baseAdopters,
    appointments: baseAppointments,
    dogs: baseDogs,
    messages: baseMessages,
    shelters: baseShelters,
  });

  assert.deepEqual(filterAppointmentMessageThreads(threads, { query: "APT-VOICE" }).map((thread) => thread.appointmentId), ["appt-voice"]);
  assert.deepEqual(filterAppointmentMessageThreads(threads, { query: "Lucky" }).map((thread) => thread.appointmentId), ["appt-rescue"]);
  assert.deepEqual(filterAppointmentMessageThreads(threads, { query: "Mali" }).map((thread) => thread.appointmentId), ["appt-voice"]);
  assert.deepEqual(filterAppointmentMessageThreads(threads, { filter: "unread" }).map((thread) => thread.appointmentId), ["appt-rescue", "appt-voice"]);
  assert.deepEqual(filterAppointmentMessageThreads(threads, { filter: "needs_reply" }).map((thread) => thread.appointmentId), ["appt-rescue"]);
});
