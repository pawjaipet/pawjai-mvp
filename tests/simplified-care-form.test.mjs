import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("care form shows three notes and keeps historical removed fields intact", () => {
  const source = read("components/admin/DogCarePassportFields.tsx");
  for (const label of ["Current medication", "Allergies", "Medical notes"]) {
    assert.ok(source.includes(`<Field label="${label}">`));
  }
  for (const label of ["Last vet check date", "Next vet check due date", "Special needs notes"]) {
    assert.ok(!source.includes(`<Field label="${label}">`));
  }
  for (const name of ["care_last_vet_check_date", "care_next_vet_check_due_date", "care_special_needs_notes"]) {
    assert.ok(source.includes(`type="hidden" name="${name}"`));
  }
  assert.ok(source.includes("Add another vaccination"));
});

test("create and edit keep one public care description beside care tags", () => {
  for (const path of ["app/admin/dogs/new/DogListingForm.tsx", "app/admin/dogs/[id]/edit/DogEditForm.tsx"]) {
    const source = read(path);
    assert.equal(source.match(/name="special_needs"/g)?.length, 1);
    assert.ok(source.indexOf('label="Care description (public)"') > source.indexOf('name="care_tag"'));
  }
});
