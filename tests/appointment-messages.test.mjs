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
  const { isAppointmentMessagesUnavailableError } = loadAppointmentMessages();

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
});

test("database types include appointment messages table", () => {
  const source = readFileSync(new URL("../types/database.ts", import.meta.url), "utf8");

  assert.match(source, /appointment_messages:\s*\{/);
  assert.match(source, /attachment_url: string \| null/);
  assert.match(source, /sender_role: "adopter" \| "shelter" \| "system"/);
  assert.match(source, /return_inquiries:\s*\{/);
});
