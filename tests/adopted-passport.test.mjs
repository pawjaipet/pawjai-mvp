import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const adoptedPageSource = readFileSync(new URL("../app/adopted/page.tsx", import.meta.url), "utf8");
const passportSource = readFileSync(new URL("../components/adopted/AdoptedPetPassport.tsx", import.meta.url), "utf8");
const translationsSource = readFileSync(new URL("../components/i18n/translations.ts", import.meta.url), "utf8");

test("/adopted renders the post-adoption passport instead of dog profile links", () => {
  assert.equal(adoptedPageSource.includes("AdoptedPetPassport"), true);
  assert.equal(adoptedPageSource.includes("getAdoptedPets"), true);
  assert.equal(adoptedPageSource.includes("href={`/dogs/${pet.id}`"), false);
  assert.equal(passportSource.includes("Show Vet Card"), true);
  assert.equal(passportSource.includes("Vaccination & Documents"), true);
  assert.equal(passportSource.includes("Insurance coming soon"), true);
  assert.equal(passportSource.includes("Care Timeline / Reminders"), true);
  assert.equal(passportSource.includes("Make an Appointment"), false);
  assert.equal(passportSource.includes("Treat "), false);
});

test("adopted passport fixed copy is translated for Thai mode", () => {
  for (const label of [
    "Post-adoption care",
    "Show Vet Card",
    "Health snapshot",
    "Vaccination & Documents",
    "Insurance coming soon",
    "Care Timeline / Reminders",
    "Adopted from",
  ]) {
    assert.equal(translationsSource.includes(`"${label}"`), true);
  }
});
