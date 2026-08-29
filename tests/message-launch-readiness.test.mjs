import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("appointment and shelter message views refresh while visible", () => {
  const adopterSource = readFileSync(new URL("../components/appointments/AppointmentDetailClient.tsx", import.meta.url), "utf8");
  const adminSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const migrationSource = readFileSync(new URL("../supabase/migrations/20260722173500_appointment_messages_realtime.sql", import.meta.url), "utf8");

  assert.equal(adopterSource.includes("MESSAGE_THREAD_REFRESH_INTERVAL_MS"), true);
  assert.equal(adopterSource.includes("router.refresh()"), true);
  assert.equal(adopterSource.includes('document.visibilityState === "visible"'), true);
  assert.equal(adopterSource.includes('"postgres_changes"'), true);
  assert.equal(adopterSource.includes('filter: `appointment_id=eq.${appointmentId}`'), true);
  assert.equal(adminSource.includes("MESSAGE_THREAD_REFRESH_INTERVAL_MS"), true);
  assert.equal(adminSource.includes("router.refresh()"), true);
  assert.equal(adminSource.includes('document.visibilityState === "visible"'), true);
  assert.equal(adminSource.includes('"postgres_changes"'), true);
  assert.equal(adminSource.includes('filter: `shelter_id=eq.${shelter.id}`'), true);
  assert.equal(migrationSource.includes("alter publication supabase_realtime add table public.appointment_messages"), true);
  assert.equal(migrationSource.includes("Shelter staff can read appointment messages"), true);
});

test("message views expose backend timestamps and attachment-friendly previews", () => {
  const adopterSource = readFileSync(new URL("../components/appointments/AppointmentDetailClient.tsx", import.meta.url), "utf8");
  const adminSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");

  assert.equal(adopterSource.includes("Backend timestamp"), false);
  assert.equal(adopterSource.includes("dateTime={msg.createdAt}"), false);
  assert.equal(adopterSource.includes("SecureAppointmentMessageAttachment"), true);
  assert.equal(adopterSource.includes('message.attachmentType === "image/jpeg"'), true);
  assert.equal(adopterSource.includes('message.attachmentType === "video/mp4"'), true);
  assert.equal(adopterSource.includes("<video"), true);
  assert.equal(adminSource.includes("Backend timestamp"), true);
  assert.equal(adminSource.includes("dateTime={message.created_at}"), true);
  assert.equal(adminSource.includes("adminMode ? ("), true);
  assert.equal(adminSource.includes("isPreviewableMessageImage"), true);
  assert.equal(adminSource.includes("isPreviewableMessageVideo"), true);
});

test("message notification links use the canonical pawjaipet domain", () => {
  const source = readFileSync(new URL("../utils/booking-email.ts", import.meta.url), "utf8");

  assert.equal(source.includes('const DEFAULT_SITE_ORIGIN = "https://www.pawjaipet.com"'), true);
  assert.equal(source.includes("pawjai.co.th"), false);
});
