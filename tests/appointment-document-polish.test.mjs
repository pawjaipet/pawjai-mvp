import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appointmentDetailSource = readFileSync(
  new URL("../components/appointments/AppointmentDetailClient.tsx", import.meta.url),
  "utf8",
);
const appointmentPageSource = readFileSync(new URL("../app/appointments/page.tsx", import.meta.url), "utf8");
const appointmentDetailPageSource = readFileSync(new URL("../app/appointments/[id]/page.tsx", import.meta.url), "utf8");
const documentsSource = readFileSync(new URL("../components/documents/DocumentsPageClient.tsx", import.meta.url), "utf8");
const translationsSource = readFileSync(new URL("../components/i18n/translations.ts", import.meta.url), "utf8");

test("appointment detail fixed UI copy is localized in Thai mode", () => {
  for (const label of [
    "Appointment",
    "DETAILS",
    "MESSAGES",
    "HELP",
    "MEETING AT",
    "Click to access Google Maps",
    "Get help",
    "Help center and contact support",
  ]) {
    assert.equal(appointmentDetailSource.includes(label), true);
    assert.equal(translationsSource.includes(`"${label}"`) || translationsSource.includes(`${label}:`), true);
  }
  assert.equal(appointmentDetailSource.includes("MachineTranslatedText"), true);
});

test("appointment detail uses stored Thai dog and shelter location fields when available", () => {
  assert.equal(appointmentDetailPageSource.includes('"localized_name_th"'), true);
  assert.equal(appointmentDetailPageSource.includes("name_th, address_line_th, subdistrict_th, district_th, province_th, meeting_instructions_th"), true);
  assert.equal(appointmentDetailSource.includes("dog.nameTh"), true);
  assert.equal(appointmentDetailSource.includes("addressLinesTh"), true);
  assert.equal(appointmentDetailPageSource.includes("TODO(codex): Replace these fallbacks with first-class Thai address columns"), true);
});

test("appointments modify date and time controls are compact mobile columns", () => {
  assert.equal(appointmentPageSource.includes("grid grid-cols-1 gap-[8px] min-[380px]:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]"), true);
  assert.equal(appointmentPageSource.includes("h-[40px] min-w-0 w-full rounded-[11px]"), true);
});

test("document verification stepper can jump sections without dropping current draft", () => {
  assert.equal(documentsSource.includes("function jumpToSection"), true);
  assert.equal(documentsSource.includes('aria-current={active ? "step" : undefined}'), true);
  assert.equal(documentsSource.includes("submitCurrentForm(\"draft\");"), true);
  assert.equal(documentsSource.includes("onClick={() => jumpToSection(s)}"), true);
});
