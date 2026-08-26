import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("shelter workspace exposes donations and URL-backed booking calendar tabs", () => {
  const panel = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");

  assert.equal(panel.includes('onClick={() => setTab("donations")}'), true);
  assert.equal(panel.includes("href={bookingListHref}"), true);
  assert.equal(panel.includes("href={calendarReturnTo}"), true);
  assert.equal(panel.includes("dateKey >= range.startDate"), true);
  assert.equal(panel.includes("dateKey <= range.endDate"), true);
  assert.equal(panel.includes('name="note" placeholder="Holiday, staff training, fully booked" required'), true);
  assert.equal(panel.includes('defaultOpensAt = sampleOpenDay?.opensAt?.slice(0, 5) ?? "10:00"'), true);
  assert.equal(panel.includes('name="opensAt" step="1800" type="time"'), true);
  assert.equal(panel.includes('name="slotDuration" step="15" type="number"'), true);
});

test("blockout mutations validate ranges and report duplicate submissions", () => {
  const actions = readFileSync(new URL("../app/admin/bookings/actions.ts", import.meta.url), "utf8");

  assert.equal(actions.includes("The blockout end date must be on or after the start date."), true);
  assert.equal(actions.includes("Add a reason for this blockout date."), true);
  assert.equal(actions.includes("That blockout date range overlaps an existing closure."), true);
  assert.equal(actions.includes('.lte("start_date", endDate)'), true);
  assert.equal(actions.includes('.gte("end_date", startDate)'), true);
  assert.equal(actions.includes('.lte("start_date", date)'), true);
  assert.equal(actions.includes('.gte("end_date", date)'), true);
  assert.equal(actions.includes("Opening must be before closing"), true);
  assert.equal(actions.includes('.select("id")\n    .single()'), true);
});

test("calendar collapses legacy duplicate blockout rows", () => {
  const panel = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");

  assert.equal(panel.includes("const unavailableRanges = Array.from(new Map("), true);
  assert.equal(panel.includes('`${range.startDate}:${range.endDate}:${range.note ?? ""}`'), true);
});

test("profile and donation settings are separate shelter mutations", () => {
  const panel = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const actions = readFileSync(new URL("../app/admin/bookings/actions.ts", import.meta.url), "utf8");
  const profileAction = actions.slice(
    actions.indexOf("export async function updateShelterProfileAction"),
    actions.indexOf("export async function updateShelterDonationDetailsAction"),
  );

  assert.equal(panel.includes("Internal profile note"), false);
  assert.equal(panel.includes("updateShelterDonationDetailsAction"), true);
  assert.equal(panel.includes('view="donations"'), false);
  assert.equal(profileAction.includes('description: cleanText(formData.get("description"))'), false);
  assert.equal(profileAction.includes("parseShelterDonationDetails"), false);
  assert.equal(actions.includes('action: "shelter.donation_details.update"'), true);
});

test("adopted dogs have a dedicated archive while unavailable records stay manageable", () => {
  const panel = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");

  assert.equal(panel.includes('const currentStatuses = new Set(["available", "draft", "reserved", "unavailable"])'), true);
  assert.equal(panel.includes('const adoptedStatuses = new Set(["adopted"])'), true);
  assert.equal(panel.includes('["adopted", "Adopted dogs"]'), true);
  assert.equal(panel.includes('["all", "All records"]'), true);
  assert.equal(panel.includes('<option value="adopted">Adopted</option>'), true);
  assert.equal(panel.includes('<option value="unavailable">Unavailable</option>'), true);
  assert.equal(panel.includes("Adoption record"), true);
  assert.equal(panel.includes("Visitor profile"), true);
  assert.equal(panel.includes("Booking detail"), true);
  assert.equal(panel.includes("adoptedAppointmentId"), true);
});

test("shelter lane enables English and Thai without translating admin lanes", () => {
  const provider = readFileSync(new URL("../components/i18n/LanguageProvider.tsx", import.meta.url), "utf8");
  const translations = readFileSync(new URL("../components/i18n/translations.ts", import.meta.url), "utf8");

  assert.equal(provider.includes('pathname.startsWith("/shelter")'), false);
  assert.equal(provider.includes('pathname.startsWith("/admindraft")'), true);
  assert.equal(translations.includes('"PawJai Shelter Portal": "พอร์ทัลศูนย์พักพิง PawJai"'), true);
  assert.equal(translations.includes('"Save shelter profile": "บันทึกโปรไฟล์ศูนย์พักพิง"'), true);
  assert.equal(translations.includes('"Search tags or type a new one": "ค้นหาแท็กหรือพิมพ์แท็กใหม่"'), true);
  assert.equal(translations.includes('"Thai Ridgeback": "ไทยหลังอาน"'), true);
  assert.equal(translations.includes('Requested: "รอการตอบรับ"'), true);
  assert.equal(translations.includes('"Pending Reschedule": "รอเปลี่ยนวันเวลา"'), true);
  assert.equal(translations.includes('"Adopted dogs": "สุนัขที่ได้รับการรับเลี้ยงแล้ว"'), true);
  assert.equal(translations.includes('"Adoption record": "บันทึกการรับเลี้ยง"'), true);
  assert.equal(translations.includes('"Dog name (Thai)": "ชื่อสุนัข (ภาษาไทย)"'), true);
  assert.equal(provider.includes("requestAnimationFrame"), true);
  assert.equal(provider.includes("settledRenderTimer"), true);
});

test("donation slips use private storage and shelter-scoped review", () => {
  const donationActions = readFileSync(new URL("../app/donations/actions.ts", import.meta.url), "utf8");
  const bookingActions = readFileSync(new URL("../app/admin/bookings/actions.ts", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../supabase/migrations/20260731074531_donation_proof_and_personality_dedupe.sql", import.meta.url), "utf8");
  const imageOnlyMigration = readFileSync(new URL("../supabase/migrations/20260824053812_donation_slips_image_only.sql", import.meta.url), "utf8");

  assert.equal(donationActions.includes('const DONATION_SLIPS_BUCKET = "donation-slips"'), true);
  assert.equal(donationActions.includes('.eq("user_id", user.id)'), true);
  assert.equal(bookingActions.includes('.eq("shelter_id", shelterId)'), true);
  assert.equal(migration.includes("'donation-slips',\n  'donation-slips',\n  false"), true);
  assert.equal(imageOnlyMigration.includes("donation_intents_proof_image_mime_type"), true);
  assert.equal(imageOnlyMigration.includes("6291456"), true);
  assert.equal(imageOnlyMigration.includes("'image/heic'"), true);
  assert.equal(imageOnlyMigration.includes("'image/heif'"), true);
  assert.equal(imageOnlyMigration.includes("'application/pdf'"), false);
  assert.equal(migration.includes("donation_intents_shelter_or_admin_select"), true);
});
