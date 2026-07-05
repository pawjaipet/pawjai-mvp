import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("/admindraft is the canonical Supabase-backed draft route", () => {
  const source = readFileSync(new URL("../app/admindraft/page.tsx", import.meta.url), "utf8");

  assert.equal(source.includes("loadAdminDraftData"), true);
  assert.equal(source.includes("initialShelterId={resolvedSearchParams?.shelter}"), true);
  assert.equal(source.includes("initialShelterTab={resolvedSearchParams?.view}"), true);
  assert.equal(source.includes('dynamic = "force-dynamic"'), true);
});

test("/admindraft requires the lightweight draft phrase gate before loading data", () => {
  const pageSource = readFileSync(new URL("../app/admindraft/page.tsx", import.meta.url), "utf8");
  const gateSource = readFileSync(new URL("../components/admin/AdminDraftGate.tsx", import.meta.url), "utf8");
  const actionSource = readFileSync(new URL("../app/admindraft/actions.ts", import.meta.url), "utf8");

  assert.equal(pageSource.includes("isAdminDraftUnlocked"), true);
  assert.equal(pageSource.includes("<AdminDraftGate"), true);
  assert.equal(actionSource.includes("pawjaiadmin!"), true);
  assert.equal(actionSource.includes("httpOnly: true"), true);
  assert.equal(gateSource.includes("Unlock the admin draft workspace."), true);
  assert.equal(gateSource.includes("Admin phrase"), true);
});

test("legacy admin reorg draft route aliases /admindraft", () => {
  const source = readFileSync(new URL("../app/admin/reorg-draft/page.tsx", import.meta.url), "utf8");

  assert.equal(source.includes("@/app/admindraft/page"), true);
});

test("admin draft data loader does not select adopter contact details for public draft", () => {
  const source = readFileSync(new URL("../utils/admin-draft-data.ts", import.meta.url), "utf8");

  assert.equal(source.includes("createAdminClient"), true);
  assert.equal(source.includes("adopters"), false);
  assert.equal(source.includes("adopter_id"), false);
  assert.equal(source.includes("visitor_note"), false);
  assert.equal(source.includes("shelter_note"), false);
});

test("admin draft pulls supporting records used by the existing admin pages", () => {
  const source = readFileSync(new URL("../utils/admin-draft-data.ts", import.meta.url), "utf8");

  assert.equal(source.includes('.from("dog_photos")'), true);
  assert.equal(source.includes('.from("pawjai_profile")'), true);
  assert.equal(source.includes("image_url"), true);
  assert.equal(source.includes("click_url"), true);
});

test("admin draft panel renders real media, ad, and about data", () => {
  const source = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");

  assert.equal(source.includes("coverUrl"), true);
  assert.equal(source.includes("photosCount"), true);
  assert.equal(source.includes("AdsTab ads={ads}"), true);
  assert.equal(source.includes("AboutTab about={about}"), true);
});

test("admin draft supports shelter-specific filters and square shelter workspace tabs", () => {
  const source = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");

  assert.equal(source.includes("shelterFilterOptions"), true);
  assert.equal(source.includes('id="all-dog-shelter"'), true);
  assert.equal(source.includes('id="booking-shelter-filter"'), true);
  assert.equal(source.includes("aspect-square"), true);
});

test("admin draft shelter profile reuses live shelter edit actions in place", () => {
  const panelSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const dataSource = readFileSync(new URL("../utils/admin-draft-data.ts", import.meta.url), "utf8");
  const actionSource = readFileSync(new URL("../app/admin/bookings/actions.ts", import.meta.url), "utf8");

  assert.equal(panelSource.includes("updateShelterProfileAction"), true);
  assert.equal(panelSource.includes("updateShelterOperatingDaysAction"), true);
  assert.equal(panelSource.includes("createShelterBlockoutAction"), true);
  assert.equal(panelSource.includes("deleteShelterAvailabilityAction"), true);
  assert.equal(panelSource.includes('const DRAFT_RETURN_TO = "/admindraft"'), true);
  assert.equal(panelSource.includes('name="returnTo"'), true);
  assert.equal(panelSource.includes("Save shelter profile"), true);
  assert.equal(panelSource.includes("Save weekly schedule"), true);
  assert.equal(dataSource.includes('.from("shelter_availability")'), true);
  assert.equal(dataSource.includes('.from("shelter_regular_hours")'), true);
  assert.equal(actionSource.includes("redirectAfterShelterMutation"), true);
  assert.equal(actionSource.includes('returnTo === "/admindraft"'), true);
});

test("admin draft phrase unlock is accepted by shared admin shelter actions", () => {
  const authSource = readFileSync(new URL("../utils/admin-auth.ts", import.meta.url), "utf8");

  assert.equal(authSource.includes('const ADMIN_DRAFT_COOKIE = "pawjai_admin_draft_unlocked"'), true);
  assert.equal(authSource.includes("ADMIN_DRAFT_COOKIE"), true);
});

test("admin draft has a focused create-dog route that reuses the real dog listing form", () => {
  const panelSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const draftCreateSource = readFileSync(new URL("../app/admindraft/dogs/new/page.tsx", import.meta.url), "utf8");
  const formSource = readFileSync(new URL("../app/admin/dogs/new/DogListingForm.tsx", import.meta.url), "utf8");

  assert.equal(panelSource.includes("`/admindraft/dogs/new?shelter=${shelter.id}`"), true);
  assert.equal(draftCreateSource.includes("DogListingForm"), true);
  assert.equal(draftCreateSource.includes("isAdminDraftUnlocked"), true);
  assert.equal(draftCreateSource.includes("Exit"), true);
  assert.equal(draftCreateSource.includes('cancelLabel="Exit"'), true);
  assert.equal(draftCreateSource.includes('submitLabel="Save Draft"'), true);
  assert.equal(draftCreateSource.includes("/admindraft?shelter="), true);
  assert.equal(formSource.includes("showIntro = true"), true);
  assert.equal(formSource.includes('cancelLabel = "Cancel"'), true);
  assert.equal(formSource.includes("successListingsHref"), true);
  assert.equal(formSource.includes("submitLabel"), true);
});
