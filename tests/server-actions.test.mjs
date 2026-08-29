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

test("admin dog media saves Backblaze CDN URLs instead of Supabase public URLs", () => {
  const newDogSource = readFileSync(new URL("../app/admin/dogs/new/actions.ts", import.meta.url), "utf8");
  const editDogSource = readFileSync(new URL("../app/admin/dogs/[id]/edit/actions.ts", import.meta.url), "utf8");

  for (const source of [newDogSource, editDogSource]) {
    assert.equal(source.includes("uploadBufferToBackblaze"), true);
    assert.equal(source.includes(".storage.from(DOG_PHOTOS_BUCKET).upload"), true);
    assert.equal(source.includes("public_url: uploaded.publicUrl"), true);
    assert.equal(source.includes(".getPublicUrl("), false);
  }

  assert.equal(newDogSource.includes("trait_value: uploadedVideo.publicUrl"), true);
  assert.equal(editDogSource.includes("trait_value: coverVideo.publicUrl"), true);
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
  assert.equal(source.includes('revalidatePath("/admin")'), true);
  assert.equal(source.includes('revalidatePath(safeReturnTo)'), true);
});

test("shelter message action supports appointment attachments", () => {
  const source = readFileSync(new URL("../app/shelter/actions.ts", import.meta.url), "utf8");
  const adopterSource = readFileSync(new URL("../app/appointments/[id]/actions.ts", import.meta.url), "utf8");
  const policySource = readFileSync(new URL("../utils/appointment-message-attachments.ts", import.meta.url), "utf8");
  const configSource = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  const bucketMigrationSource = readFileSync(new URL("../supabase/migrations/20260722113257_appointment_message_attachments_bucket.sql", import.meta.url), "utf8");

  assert.equal(source.includes("uploadAppointmentMessageAttachment"), true);
  assert.equal(adopterSource.includes("uploadAppointmentMessageAttachment"), true);
  assert.equal(policySource.includes('APPOINTMENT_MESSAGE_ATTACHMENTS_BUCKET = "appointment-message-attachments"'), true);
  assert.equal(policySource.includes("APPOINTMENT_MESSAGE_ATTACHMENT_MAX_BYTES = 200 * 1024 * 1024"), true);
  assert.equal(policySource.includes('"application/pdf"'), true);
  assert.equal(policySource.includes('"image/heic"'), true);
  assert.equal(policySource.includes('"image/heif"'), true);
  assert.equal(policySource.includes('"image/jpeg"'), true);
  assert.equal(policySource.includes('"image/png"'), true);
  assert.equal(policySource.includes('"video/mp4"'), true);
  assert.equal(policySource.includes('"video/quicktime"'), true);
  assert.equal(policySource.includes("MP4"), true);
  assert.equal(policySource.includes("MOV"), true);
  assert.equal(policySource.includes(".storage.from(APPOINTMENT_MESSAGE_ATTACHMENTS_BUCKET).upload"), true);
  assert.equal(policySource.includes("appointment-messages/${appointmentId}/"), true);
  assert.equal(policySource.includes("storagePath"), true);
  assert.equal(policySource.includes("signAppointmentMessageAttachments"), true);
  assert.equal(source.includes("attachment_name: attachment?.name ?? null"), true);
  assert.equal(source.includes("attachment_type: attachment?.type ?? null"), true);
  assert.equal(source.includes("attachment_storage_path: attachment?.storagePath ?? null"), true);
  assert.equal(source.includes("attachment_url: null"), true);
  assert.equal(source.includes("isMissingAppointmentColumnError(error, \"attachment_storage_path\")"), true);
  assert.equal(source.includes("sendAppointmentMessageNotificationForAppointment"), true);
  assert.equal(adopterSource.includes("sendAppointmentMessageNotificationForAppointment"), true);
  assert.equal(configSource.includes('bodySizeLimit: "210mb"'), true);
  assert.equal(configSource.includes('proxyClientMaxBodySize: "210mb"'), true);
  assert.equal(bucketMigrationSource.includes("'appointment-message-attachments'"), true);
  assert.equal(bucketMigrationSource.includes("209715200"), true);
  assert.equal(bucketMigrationSource.includes("'application/pdf'"), true);
  assert.equal(bucketMigrationSource.includes("'video/quicktime'"), true);
  const privateBucketMigrationSource = readFileSync(new URL("../supabase/migrations/20260824100225_private_appointment_message_attachments.sql", import.meta.url), "utf8");
  assert.equal(privateBucketMigrationSource.includes("attachment_storage_path"), true);
  assert.equal(privateBucketMigrationSource.includes("public = false"), true);
  assert.equal(privateBucketMigrationSource.includes("split_part"), true);
});

test("adopter return inquiry action writes a message with a reason", () => {
  const source = readFileSync(new URL("../app/appointments/[id]/actions.ts", import.meta.url), "utf8");
  const messageSource = readFileSync(new URL("../utils/appointment-messages.ts", import.meta.url), "utf8");

  assert.equal(source.includes("submitReturnInquiryAction"), true);
  assert.equal(source.includes('formData.get("returnReason")'), true);
  assert.equal(source.includes('sender_role: "adopter"'), true);
  assert.equal(source.includes("formatReturnInquiryMessageBody(returnReason)"), true);
  assert.equal(messageSource.includes("Return inquiry requested"), true);
  assert.equal(source.includes("isReturnInquiriesUnavailableError"), true);
  assert.equal(source.includes("reason ||"), true);
  assert.equal(source.includes(".from(\"appointment_messages\").insert"), true);
});
