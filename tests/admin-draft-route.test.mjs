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
  assert.equal(gateSource.includes("/shelter"), true);
  assert.equal(pageSource.includes("getAdminAuthContext"), false);
});

test("/shelter supports real shelter account login and scoped shelter mode", () => {
  const pageSource = readFileSync(new URL("../app/admindraft/page.tsx", import.meta.url), "utf8");
  const oldLoginPageSource = readFileSync(new URL("../app/admindraft/login/page.tsx", import.meta.url), "utf8");
  const shelterLoginPageSource = readFileSync(new URL("../app/shelter/page.tsx", import.meta.url), "utf8");
  const shelterPortalPageSource = readFileSync(new URL("../app/shelter/[slug]/page.tsx", import.meta.url), "utf8");
  const shelterActionSource = readFileSync(new URL("../app/shelter/actions.ts", import.meta.url), "utf8");
  const panelSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const dataSource = readFileSync(new URL("../utils/admin-draft-data.ts", import.meta.url), "utf8");
  const portalSource = readFileSync(new URL("../utils/shelter-portal.ts", import.meta.url), "utf8");

  assert.equal(pageSource.includes("scopedShelterIds"), false);
  assert.equal(oldLoginPageSource.includes('redirect("/shelter")'), true);
  assert.equal(shelterLoginPageSource.includes("Sign in to your shelter workspace."), true);
  assert.equal(shelterLoginPageSource.includes("PawJai Shelter Portal"), true);
  assert.equal(shelterLoginPageSource.includes("Username"), true);
  assert.equal(shelterLoginPageSource.includes('name="identifier"'), true);
  assert.equal(shelterLoginPageSource.includes("signInShelterPortalAction"), true);
  assert.equal(shelterPortalPageSource.includes("getShelterByPortalSlug"), true);
  assert.equal(shelterPortalPageSource.includes("loadAdminDraftData({ shelterIds: [shelter.id] })"), true);
  assert.equal(shelterPortalPageSource.includes('initialRoleView="shelter"'), true);
  assert.equal(shelterPortalPageSource.includes("lockRoleView"), true);
  assert.equal(shelterActionSource.includes("signInWithPassword"), true);
  assert.equal(shelterActionSource.includes("includePhraseGate: false"), true);
  assert.equal(shelterActionSource.includes('context.role !== "shelter_admin"'), true);
  assert.equal(portalSource.includes("thevoice@pawjai.co.th"), true);
  assert.equal(portalSource.includes("rescuedog@pawjai.co.th"), true);
  assert.equal(portalSource.includes("slugifyShelterName"), true);
  assert.equal(panelSource.includes("lockRoleView"), true);
  assert.equal(panelSource.includes("View as shelter"), true);
  assert.equal(dataSource.includes("LoadAdminDraftDataOptions"), true);
  assert.equal(dataSource.includes("shouldScopeShelters"), true);
  assert.equal(dataSource.includes("returnedShelterIds.has"), true);
});

test("legacy admin reorg draft route aliases /admindraft", () => {
  const source = readFileSync(new URL("../app/admin/reorg-draft/page.tsx", import.meta.url), "utf8");

  assert.equal(source.includes("@/app/admindraft/page"), true);
});

test("admin draft data loader includes booking workspace fields for inline decisions", () => {
  const source = readFileSync(new URL("../utils/admin-draft-data.ts", import.meta.url), "utf8");

  assert.equal(source.includes("createAdminClient"), true);
  assert.equal(source.includes("booking_code"), true);
  assert.equal(source.includes("checked_in_at"), true);
  assert.equal(source.includes("visitor_note"), true);
  assert.equal(source.includes("shelter_note"), true);
  assert.equal(source.includes('.from("adopters")'), true);
  assert.equal(source.includes("adopterEmail"), true);
  assert.equal(source.includes("adopterPhoneNumber"), true);
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
  const draftCreateAliasSource = readFileSync(new URL("../app/admindraft/dog-creation/page.tsx", import.meta.url), "utf8");
  const formSource = readFileSync(new URL("../app/admin/dogs/new/DogListingForm.tsx", import.meta.url), "utf8");

  assert.equal(panelSource.includes("`/admindraft/dog-creation?shelter=${shelter.id}`"), true);
  assert.equal(draftCreateAliasSource.includes("../dogs/new/page"), true);
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

test("admin draft dog listings remove the inline field map and expose creation as a shelter workspace tab", () => {
  const panelSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");

  assert.equal(panelSource.includes("Show field map"), false);
  assert.equal(panelSource.includes("Hide field map"), false);
  assert.equal(panelSource.includes("CreateDogPreview"), false);
  assert.equal(panelSource.includes("coreListingFields"), false);
  assert.equal(panelSource.includes("matchingGroups"), false);
  assert.equal(panelSource.includes("ShelterWorkspaceLinkTab"), true);
  assert.equal(panelSource.includes("Create dog profile"), true);
  assert.equal(panelSource.includes("md:grid-cols-5"), true);
});

test("admin draft dog cards edit through a draft-native dog edit route", () => {
  const panelSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const draftEditSource = readFileSync(new URL("../app/admindraft/dogs/[id]/edit/page.tsx", import.meta.url), "utf8");
  const adminEditSource = readFileSync(new URL("../app/admin/dogs/[id]/edit/page.tsx", import.meta.url), "utf8");

  assert.equal(panelSource.includes("`/admindraft/dogs/${dog.id}/edit`"), true);
  assert.equal(panelSource.includes("`/admin/dogs/${dog.id}/edit`"), false);
  assert.equal(draftEditSource.includes("DogEditForm"), true);
  assert.equal(draftEditSource.includes("isAdminDraftUnlocked"), true);
  assert.equal(draftEditSource.includes("AdminDraftGate"), true);
  assert.equal(draftEditSource.includes("Back to dog listings"), true);
  assert.equal(draftEditSource.includes("/admindraft?shelter=${dog.shelter_id}&view=dogs"), true);
  assert.equal(draftEditSource.includes("PawJai Admin Draft"), true);
  assert.equal(adminEditSource.includes("DogEditForm"), true);
});

test("admin draft opens booking detail and visitor profile in draft-native routes", () => {
  const panelSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const bookingDetailSource = readFileSync(new URL("../app/admindraft/bookings/[id]/page.tsx", import.meta.url), "utf8");
  const visitorProfileSource = readFileSync(new URL("../app/admindraft/bookings/[id]/visitor-profile/page.tsx", import.meta.url), "utf8");
  const checkInSource = readFileSync(new URL("../app/admindraft/bookings/check-in/page.tsx", import.meta.url), "utf8");
  const actionSource = readFileSync(new URL("../app/admin/bookings/actions.ts", import.meta.url), "utf8");

  assert.equal(panelSource.includes("`/admindraft/bookings/${booking.id}`"), true);
  assert.equal(panelSource.includes('href="/admindraft/bookings/check-in"'), true);
  assert.equal(bookingDetailSource.includes("decideBookingAction"), true);
  assert.equal(bookingDetailSource.includes("isAdminDraftUnlocked"), true);
  assert.equal(bookingDetailSource.includes("Back to booking list"), true);
  assert.equal(bookingDetailSource.includes('name="returnTo"'), true);
  assert.equal(bookingDetailSource.includes("/admindraft?shelter="), true);
  assert.equal(bookingDetailSource.includes("/admindraft/bookings/${typedAppointment.id}/visitor-profile"), true);
  assert.equal(visitorProfileSource.includes("isAdminDraftUnlocked"), true);
  assert.equal(visitorProfileSource.includes("Back to booking detail"), true);
  assert.equal(visitorProfileSource.includes("Back to booking list"), true);
  assert.equal(visitorProfileSource.includes("/admindraft/bookings/${typedAppointment.id}"), true);
  assert.equal(checkInSource.includes("isAdminDraftUnlocked"), true);
  assert.equal(checkInSource.includes("/admindraft/bookings/${appointment.id}?token="), true);
  assert.equal(checkInSource.includes("Back to booking list"), true);
  assert.equal(actionSource.includes("redirectAfterBookingDecision"), true);
  assert.equal(actionSource.includes('returnTo.startsWith("/admindraft")'), true);
});

test("admin draft booking tab duplicates the low-friction old booking workspace flow", () => {
  const panelSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");

  assert.equal(panelSource.includes("VISIT_BUCKETS"), true);
  assert.equal(panelSource.includes("bookingSearch"), true);
  assert.equal(panelSource.includes("bookingStatusFilter"), true);
  assert.equal(panelSource.includes("Search booking code"), true);
  assert.equal(panelSource.includes("QR check-in scanner"), true);
  assert.equal(panelSource.includes("decideBookingAction"), true);
  assert.equal(panelSource.includes("Edit decision"), true);
  assert.equal(panelSource.includes("Open visitor profile"), true);
  assert.equal(panelSource.includes("Open booking detail"), true);
  assert.equal(panelSource.includes("/admindraft/bookings/${booking.id}/visitor-profile"), true);
});
