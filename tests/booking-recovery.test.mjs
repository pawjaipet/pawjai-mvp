import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../utils/booking-recovery.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const module = { exports: {} };
new Script(outputText).runInNewContext({ module, exports: module.exports });
const {
  bookingSlotConflictReason,
  createBookingSubmissionGuard,
  isBookingSlotUniqueConflict,
  recoverBookingSlot,
} = module.exports;

function conflict(slots) {
  return {
    status: "slot_unavailable",
    reason: "slot_unavailable",
    availability: {
      daysByDate: {
        "2026-10-08": { date: "2026-10-08", slots, isUnavailable: slots.length === 0 },
      },
    },
  };
}

test("a slot taken after selection recovers the date and note without picking another time", () => {
  assert.equal(bookingSlotConflictReason(["10:00", "11:00"], "10:00"), null);
  assert.equal(bookingSlotConflictReason(["11:00"], "10:00"), "slot_unavailable");
  const recovered = recoverBookingSlot("2026-10-08", "Please call on arrival", conflict(["11:00"]));
  assert.equal(recovered.selectedDate, "2026-10-08");
  assert.equal(recovered.selectedTime, null);
  assert.equal(recovered.note, "Please call on arrival");
  assert.equal(recovered.hasRemainingTimes, true);
  assert.deepEqual(recovered.availability.daysByDate["2026-10-08"].slots, ["11:00"]);
});

test("a fully booked day keeps the date and note while offering a different date", () => {
  const recovered = recoverBookingSlot("2026-10-08", "Keep this note", conflict([]));
  assert.equal(recovered.hasRemainingTimes, false);
  assert.equal(recovered.selectedDate, "2026-10-08");
  assert.equal(recovered.note, "Keep this note");
});

test("a retry can select an available time, while a late database conflict is recoverable", () => {
  assert.equal(bookingSlotConflictReason(["11:00"], "11:00"), null);
  assert.equal(bookingSlotConflictReason(["11:00"], "11:00", true), "slot_taken");
  assert.equal(isBookingSlotUniqueConflict('duplicate key on appointments_active_slot_unique_idx'), true);
});

test("two rapid clicks claim only one submission until the first finishes", () => {
  const guard = createBookingSubmissionGuard();
  assert.equal(guard.claim(), true);
  assert.equal(guard.claim(), false);
  guard.release();
  assert.equal(guard.claim(), true);
});
