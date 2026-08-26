import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadAppointmentsModel() {
  const source = readFileSync(new URL("../utils/appointments-model.ts", import.meta.url), "utf8");
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

test("classifies appointment cards by status and date", () => {
  const { isPastAppointment } = loadAppointmentsModel();

  assert.equal(isPastAppointment({ appointment_date: "2026-05-22", status: "requested" }, "2026-05-23"), true);
  assert.equal(isPastAppointment({ appointment_date: "2026-05-29", status: "requested" }, "2026-05-23"), false);
  assert.equal(isPastAppointment({ appointment_date: "2026-05-29", status: "cancelled" }, "2026-05-23"), true);
});

test("builds user-facing appointment status labels", () => {
  const { getAppointmentStatusCopy } = loadAppointmentsModel();

  assert.equal(getAppointmentStatusCopy("requested").label, "Pending");
  assert.equal(getAppointmentStatusCopy("confirmed").label, "Accepted");
  assert.equal(getAppointmentStatusCopy("cancelled").label, "Denied");
});

test("allows users to edit only active dated appointment requests", () => {
  const { canEditAppointmentDateTime } = loadAppointmentsModel();

  assert.equal(canEditAppointmentDateTime({ appointment_date: "2026-05-29", status: "requested" }, "2026-05-23"), true);
  assert.equal(canEditAppointmentDateTime({ appointment_date: "2026-05-29", status: "confirmed" }, "2026-05-23"), true);
  assert.equal(canEditAppointmentDateTime({ appointment_date: "2026-05-22", status: "requested" }, "2026-05-23"), false);
  assert.equal(canEditAppointmentDateTime({ appointment_date: "2026-05-29", status: "completed" }, "2026-05-23"), false);
});

test("flags post-visit follow-up as soon as the scheduled time has passed", () => {
  const { appointmentFollowUpDue } = loadAppointmentsModel();
  const now = new Date("2026-05-23T11:01:00");

  assert.equal(appointmentFollowUpDue({ appointment_date: "2026-05-23", appointment_time: "11:00", status: "confirmed" }, now), true);
  assert.equal(appointmentFollowUpDue({ appointment_date: "2026-05-23", appointment_time: "13:00", status: "confirmed" }, now), false);
  assert.equal(appointmentFollowUpDue({ appointment_date: "2026-05-23", appointment_time: "11:00", status: "completed" }, now), false);
});
