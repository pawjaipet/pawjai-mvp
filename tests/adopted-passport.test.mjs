import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const adoptedPageSource = readFileSync(new URL("../app/adopted/page.tsx", import.meta.url), "utf8");
const dogProfileSource = readFileSync(new URL("../app/dogs/[id]/page.tsx", import.meta.url), "utf8");
const dogCareFieldSource = readFileSync(new URL("../components/admin/DogCarePassportFields.tsx", import.meta.url), "utf8");
const dogCareActionSource = readFileSync(new URL("../utils/dog-care-passport-actions.ts", import.meta.url), "utf8");
const passportSource = readFileSync(new URL("../components/adopted/AdoptedPetPassport.tsx", import.meta.url), "utf8");
const translationsSource = readFileSync(new URL("../components/i18n/translations.ts", import.meta.url), "utf8");
const migrationSource = readFileSync(new URL("../supabase/migrations/20260831144935_dog_care_passport.sql", import.meta.url), "utf8");
const tutorialSource = readFileSync(new URL("../components/SwipeFeedTutorial.tsx", import.meta.url), "utf8");

test("/adopted renders the post-adoption passport instead of dog profile links", () => {
  assert.equal(adoptedPageSource.includes("AdoptedPetPassport"), true);
  assert.equal(adoptedPageSource.includes("getAdoptedPets"), true);
  assert.equal(adoptedPageSource.includes("href={`/dogs/${pet.id}`"), false);
  assert.equal(passportSource.includes("Show Vet Card"), true);
  assert.equal(passportSource.includes("Vaccination records"), true);
  assert.equal(passportSource.includes("Care documents"), true);
  assert.equal(passportSource.includes("Care Notes / Vet Notes"), true);
  assert.equal(passportSource.includes("Message Shelter"), true);
  assert.equal(passportSource.includes("Insurance coming soon"), true);
  assert.equal(passportSource.includes("Make an Appointment"), false);
  assert.equal(passportSource.includes("Treat "), false);
});

test("public dog profile and adopted pet passport remain separate lifecycle surfaces", () => {
  assert.equal(dogProfileSource.includes("AdoptedPetPassport"), false);
  assert.equal(dogProfileSource.includes("dog_care_"), false);
  assert.equal(dogProfileSource.includes("Show Vet Card"), false);
  assert.equal(dogProfileSource.includes("Vaccination records"), false);
  assert.equal(dogProfileSource.includes("Care documents"), false);
  assert.equal(dogProfileSource.includes("Make an Appointment"), true);
  assert.equal(dogProfileSource.includes("Treat "), true);

  assert.equal(passportSource.includes("Show Vet Card"), true);
  assert.equal(passportSource.includes("Vaccination records"), true);
  assert.equal(passportSource.includes("Care documents"), true);
  assert.equal(passportSource.includes("Reminders"), true);
  assert.equal(passportSource.includes("Message Shelter"), true);
  assert.equal(passportSource.includes("Make an Appointment"), false);
  assert.equal(passportSource.includes("Treat "), false);
});

test("/adopted reads shared care tables instead of hardcoded care placeholders", () => {
  for (const tableName of [
    "dog_care_records",
    "dog_vaccination_records",
    "dog_care_documents",
    "dog_care_timeline_events",
  ]) {
    assert.equal(adoptedPageSource.includes(`from("${tableName}")`), true);
    assert.equal(migrationSource.includes(`public.${tableName}`), true);
    assert.equal(migrationSource.includes(`alter table public.${tableName} enable row level security`), true);
  }
});

test("shelter dog forms do not create adopter-visible care notes", () => {
  assert.equal(dogCareFieldSource.includes("Add adopter-visible care note"), false);
  assert.equal(dogCareFieldSource.includes("care_note_"), false);
  assert.equal(dogCareActionSource.includes("care_note_"), false);
  assert.equal(dogCareActionSource.includes("Care note could not be saved"), false);
});

test("adopted passport fixed copy is translated for Thai mode", () => {
  for (const label of [
    "Post-adoption care",
    "Show Vet Card",
    "Health snapshot",
    "Vaccination records",
    "Care documents",
    "Care Notes / Vet Notes",
    "Reminders",
    "Message Shelter",
    "Insurance coming soon",
    "Adopted from",
  ]) {
    assert.equal(translationsSource.includes(`"${label}"`), true);
  }
});

test("logged-out swipe tutorial dismissal persists in browser storage", () => {
  assert.equal(tutorialSource.includes("pawjai.swipeFeedTutorialDismissed"), true);
  assert.equal(tutorialSource.includes("window.localStorage.getItem(DISMISSED_KEY)"), true);
  assert.equal(tutorialSource.includes("window.localStorage.setItem(DISMISSED_KEY"), true);
});
