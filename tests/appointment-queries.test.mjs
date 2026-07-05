import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadAppointmentQueries() {
  const source = readFileSync(new URL("../utils/appointment-queries.ts", import.meta.url), "utf8");
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

function createFakeAdmin(firstResult, fallbackResult) {
  const calls = [];

  return {
    calls,
    from(table) {
      const call = { columns: "", table };
      calls.push(call);

      const query = {
        select(columns) {
          call.columns = columns;
          return query;
        },
        eq() {
          return query;
        },
        order() {
          return query;
        },
        limit() {
          return calls.length === 1 ? firstResult : fallbackResult;
        },
      };

      return query;
    },
  };
}

test("detects missing appointment column/schema-cache errors", () => {
  const { isMissingAppointmentColumnError } = loadAppointmentQueries();

  assert.equal(
    isMissingAppointmentColumnError({
      code: "PGRST204",
      message: "Could not find the 'booking_code' column of 'appointments' in the schema cache",
    }, "booking_code"),
    true,
  );
  assert.equal(
    isMissingAppointmentColumnError({
      message: "column appointments.booking_code does not exist",
    }, "booking_code"),
    true,
  );
  assert.equal(
    isMissingAppointmentColumnError({
      message: "duplicate key value violates unique constraint",
    }, "booking_code"),
    false,
  );
});

test("loads adopter message appointments without requiring booking_code", async () => {
  const { loadAdopterMessageAppointments } = loadAppointmentQueries();
  const admin = createFakeAdmin(
    {
      data: null,
      error: {
        code: "PGRST204",
        message: "Could not find the 'booking_code' column of 'appointments' in the schema cache",
      },
    },
    {
      data: [{
        adopter_id: "adopter-1",
        appointment_date: "2026-05-30",
        appointment_time: "13:00",
        dog_id: "dog-1",
        id: "appt-1",
        shelter_id: "shelter-1",
        status: "confirmed",
      }],
      error: null,
    },
  );

  const result = await loadAdopterMessageAppointments(admin, "adopter-1");

  assert.equal(result.error, null);
  assert.equal(result.usedBookingCodeFallback, true);
  assert.equal(result.data.length, 1);
  assert.equal(admin.calls[0].columns.includes("booking_code"), true);
  assert.equal(admin.calls[1].columns.includes("booking_code"), false);
});
