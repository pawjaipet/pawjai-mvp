import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("documents server action file only exports async server actions", () => {
  const source = readFileSync(new URL("../app/documents/actions.ts", import.meta.url), "utf8");
  const exportedValues = [
    ...source.matchAll(/^export\s+(?!async\s+function|type\s+)(?:const|let|var|function|class)\s+([A-Za-z0-9_]+)/gm),
  ].map((match) => match[1]);

  assert.deepEqual(exportedValues, []);
});

test("shelter message action is shelter scoped and writes shelter messages", () => {
  const source = readFileSync(new URL("../app/shelter/actions.ts", import.meta.url), "utf8");

  assert.equal(source.includes("sendShelterAppointmentMessageAction"), true);
  assert.equal(source.includes("getAdminAuthContext({ includePhraseGate: false })"), true);
  assert.equal(source.includes('context.role !== "shelter_admin"'), true);
  assert.equal(source.includes("context.shelterIds.includes(appointment.shelter_id)"), true);
  assert.equal(source.includes('sender_role: "shelter"'), true);
  assert.equal(source.includes("read_by_shelter_at"), true);
  assert.equal(source.includes('revalidatePath("/messages")'), true);
  assert.equal(source.includes('revalidatePath("/admindraft")'), true);
  assert.equal(source.includes('revalidatePath(safeReturnTo)'), true);
});
