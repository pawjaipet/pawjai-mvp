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
  assert.equal(actionSource.includes('const ADMIN_DRAFT_COOKIE_PATHS = ["/admindraft", "/booking"]'), true);
  assert.equal(actionSource.includes("getAdminDraftReturnPath"), true);
  assert.equal(actionSource.includes("withUnlockFailed(returnTo)"), true);
  assert.equal(actionSource.includes("redirect(returnTo)"), true);
  assert.equal(gateSource.includes("Unlock the admin draft workspace."), true);
  assert.equal(gateSource.includes("Admin phrase"), true);
  assert.equal(gateSource.includes('name="returnTo"'), true);
  assert.equal(gateSource.includes("/shelter"), true);
  assert.equal(pageSource.includes("getAdminAuthContext"), false);
});

test("/shelter supports real shelter account login and scoped shelter mode", () => {
  const pageSource = readFileSync(new URL("../app/admindraft/page.tsx", import.meta.url), "utf8");
  const oldLoginPageSource = readFileSync(new URL("../app/admindraft/login/page.tsx", import.meta.url), "utf8");
  const shelterLoginPageSource = readFileSync(new URL("../app/shelter/page.tsx", import.meta.url), "utf8");
  const shelterPortalPageSource = readFileSync(new URL("../app/shelter/[slug]/page.tsx", import.meta.url), "utf8");
  const shelterSettingsPageSource = readFileSync(new URL("../app/shelter/[slug]/settings/page.tsx", import.meta.url), "utf8");
  const shelterActionSource = readFileSync(new URL("../app/shelter/actions.ts", import.meta.url), "utf8");
  const panelSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const bottomNavSource = readFileSync(new URL("../components/BottomNavBar.tsx", import.meta.url), "utf8");
  const dataSource = readFileSync(new URL("../utils/admin-draft-data.ts", import.meta.url), "utf8");
  const portalSource = readFileSync(new URL("../utils/shelter-portal.ts", import.meta.url), "utf8");
  const migrationSource = readFileSync(new URL("../supabase/migrations/20260707113715_shelter_portal_accounts.sql", import.meta.url), "utf8");

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
  assert.equal(shelterPortalPageSource.includes("accountSettingsHref"), true);
  assert.equal(shelterSettingsPageSource.includes("updateShelterPortalAccountAction"), true);
  assert.equal(shelterSettingsPageSource.includes("Account settings"), true);
  assert.equal(shelterActionSource.includes("signInWithPassword"), true);
  assert.equal(shelterActionSource.includes("includePhraseGate: false"), true);
  assert.equal(shelterActionSource.includes('context.role !== "shelter_admin"'), true);
  assert.equal(shelterActionSource.includes("updateUserById"), true);
  assert.equal(shelterActionSource.includes("shelter_portal_accounts"), true);
  assert.equal(shelterActionSource.includes("Sign out"), false);
  assert.equal(portalSource.includes("shelter_portal_accounts"), true);
  assert.equal(migrationSource.includes("create table if not exists public.shelter_portal_accounts"), true);
  assert.equal(bottomNavSource.includes('pathname.startsWith("/shelter")'), true);
  assert.equal(portalSource.includes("slugifyShelterName"), true);
  assert.equal(panelSource.includes("lockRoleView"), true);
  assert.equal(panelSource.includes("Account settings"), true);
  assert.equal(panelSource.includes("signOutShelterPortalAction"), true);
  assert.equal(dataSource.includes("LoadAdminDraftDataOptions"), true);
  assert.equal(dataSource.includes("shouldScopeShelters"), true);
  assert.equal(dataSource.includes("returnedShelterIds.has"), true);
});

test("legacy admin reorg draft route aliases /admindraft", () => {
  const source = readFileSync(new URL("../app/admin/reorg-draft/page.tsx", import.meta.url), "utf8");

  assert.equal(source.includes("@/app/admindraft/page"), true);
});

test("admin draft direct pages unlock back to their own route", () => {
  const aboutSource = readFileSync(new URL("../app/admindraft/aboutcontent/page.tsx", import.meta.url), "utf8");
  const accountsSource = readFileSync(new URL("../app/admindraft/accounts/page.tsx", import.meta.url), "utf8");
  const adsSource = readFileSync(new URL("../app/admindraft/ads/page.tsx", import.meta.url), "utf8");
  const auditSource = readFileSync(new URL("../app/admindraft/audit/page.tsx", import.meta.url), "utf8");
  const mainSource = readFileSync(new URL("../app/admindraft/page.tsx", import.meta.url), "utf8");

  assert.equal(aboutSource.includes('returnTo="/admindraft/aboutcontent"'), true);
  assert.equal(accountsSource.includes('returnTo="/admindraft/accounts"'), true);
  assert.equal(adsSource.includes("isAdminDraftUnlocked"), true);
  assert.equal(adsSource.includes('returnTo="/admindraft/ads"'), true);
  assert.equal(adsSource.includes('basePath="/admindraft"'), true);
  assert.equal(adsSource.includes("getAdminAuthContext"), false);
  assert.equal(auditSource.includes('returnTo="/admindraft/audit"'), true);
  assert.equal(mainSource.includes("buildAdminDraftReturnTo"), true);
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

test("admin draft ad tab uses real search and status filters", () => {
  const source = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");

  assert.equal(source.includes("matchesAdFilters"), true);
  assert.equal(source.includes('id="admin-ad-search"'), true);
  assert.equal(source.includes('id="admin-ad-status"'), true);
  assert.equal(source.includes('placeholder="Search advertiser or URL"'), true);
  assert.equal(source.includes('<option value="pending">Pending review</option>'), true);
  assert.equal(source.includes('<option value="approved">Live</option>'), true);
  assert.equal(source.includes('<option value="paused">Paused</option>'), true);
  assert.equal(source.includes('<option value="denied">Denied</option>'), true);
  assert.equal(source.includes('<option value="expired">Expired</option>'), true);
  assert.equal(source.includes("No ads match these filters."), true);
  assert.equal(source.includes("Accept ad"), true);
  assert.equal(source.includes("Deny ad"), true);
  assert.equal(source.includes("Edit ad dates"), true);
  assert.equal(source.includes("Preview full ad"), true);
  assert.equal(source.includes("Review ad"), false);
  assert.equal(source.includes('FieldGrid fields={["Advertiser", "Placement", "Image/video asset", "Destination URL", "Live status", "Start date", "End date"]}'), false);
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
  assert.equal(actionSource.includes('returnTo.startsWith("/admindraft")'), true);
  assert.equal(actionSource.includes('returnTo.startsWith("/shelter/")'), true);
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
  const shelterCreateSource = readFileSync(new URL("../app/shelter/[slug]/dogs/new/page.tsx", import.meta.url), "utf8");
  const formSource = readFileSync(new URL("../app/admin/dogs/new/DogListingForm.tsx", import.meta.url), "utf8");

  assert.equal(panelSource.includes("`/admindraft/dog-creation?shelter=${selectedShelter.id}`"), true);
  assert.equal(panelSource.includes("`${workspaceBaseHref}/dogs/new`"), true);
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
  assert.equal(shelterCreateSource.includes("getAdminAuthContext({ includePhraseGate: false })"), true);
  assert.equal(shelterCreateSource.includes("getShelterByPortalSlug"), true);
  assert.equal(shelterCreateSource.includes("successListingsHref={cancelHref}"), true);
  assert.equal(shelterCreateSource.includes("returnTo={`/shelter/${slug}/dogs/new`}"), true);
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
  const shelterEditSource = readFileSync(new URL("../app/shelter/[slug]/dogs/[id]/edit/page.tsx", import.meta.url), "utf8");
  const adminEditSource = readFileSync(new URL("../app/admin/dogs/[id]/edit/page.tsx", import.meta.url), "utf8");

  assert.equal(panelSource.includes("`/admindraft/dogs/${dog.id}/edit`"), true);
  assert.equal(panelSource.includes("`${workspaceBaseHref}/dogs/${dog.id}/edit`"), true);
  assert.equal(panelSource.includes("`/admin/dogs/${dog.id}/edit`"), false);
  assert.equal(draftEditSource.includes("DogEditForm"), true);
  assert.equal(draftEditSource.includes("isAdminDraftUnlocked"), true);
  assert.equal(draftEditSource.includes("AdminDraftGate"), true);
  assert.equal(draftEditSource.includes("Back to dog listings"), true);
  assert.equal(draftEditSource.includes("/admindraft?shelter=${dog.shelter_id}&view=dogs"), true);
  assert.equal(draftEditSource.includes("PawJai Admin Draft"), true);
  assert.equal(shelterEditSource.includes("getAdminAuthContext({ includePhraseGate: false })"), true);
  assert.equal(shelterEditSource.includes("getShelterByPortalSlug"), true);
  assert.equal(shelterEditSource.includes("dog.shelter_id !== shelter.id"), true);
  assert.equal(shelterEditSource.includes("returnTo={`/shelter/${slug}/dogs/${dog.id}/edit`}"), true);
  assert.equal(adminEditSource.includes("DogEditForm"), true);
});

test("admin draft and shelter portal open booking detail and visitor profile through shared guarded routes", () => {
  const panelSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const bookingDetailSource = readFileSync(new URL("../app/booking/[id]/page.tsx", import.meta.url), "utf8");
  const visitorProfileSource = readFileSync(new URL("../app/booking/[id]/visitor-profile/page.tsx", import.meta.url), "utf8");
  const checkInSource = readFileSync(new URL("../app/booking/check-in/page.tsx", import.meta.url), "utf8");
  const actionSource = readFileSync(new URL("../app/admin/bookings/actions.ts", import.meta.url), "utf8");

  assert.equal(panelSource.includes("withReturnTo(`/booking/${booking.id}`"), true);
  assert.equal(panelSource.includes("withReturnTo(`/booking/${booking.id}/visitor-profile`"), true);
  assert.equal(panelSource.includes('withReturnTo("/booking/check-in"'), true);
  assert.equal(panelSource.includes("bookingListHref"), true);
  assert.equal(bookingDetailSource.includes("decideBookingAction"), true);
  assert.equal(bookingDetailSource.includes("getAdminAuthContext"), true);
  assert.equal(bookingDetailSource.includes("safeBookingReturnTo"), true);
  assert.equal(bookingDetailSource.includes('requested.startsWith("/admindraft")'), true);
  assert.equal(bookingDetailSource.includes('requested.startsWith("/shelter/")'), true);
  assert.equal(bookingDetailSource.includes('requested.startsWith("/admin/bookings")'), true);
  assert.equal(bookingDetailSource.includes("Back to booking list"), true);
  assert.equal(bookingDetailSource.includes('name="returnTo"'), true);
  assert.equal(bookingDetailSource.includes("withReturnTo(`/booking/${typedAppointment.id}/visitor-profile`"), true);
  assert.equal(visitorProfileSource.includes("getAdminAuthContext"), true);
  assert.equal(visitorProfileSource.includes("safeBookingReturnTo"), true);
  assert.equal(visitorProfileSource.includes("Back to booking detail"), true);
  assert.equal(visitorProfileSource.includes("Back to booking list"), true);
  assert.equal(visitorProfileSource.includes("withReturnTo(`/booking/${typedAppointment.id}`"), true);
  assert.equal(checkInSource.includes("getAdminAuthContext"), true);
  assert.equal(checkInSource.includes("/booking/${appointment.id}?token="), true);
  assert.equal(checkInSource.includes("Back to booking list"), true);
  assert.equal(actionSource.includes("redirectAfterBookingDecision"), true);
  assert.equal(actionSource.includes('returnTo.startsWith("/admindraft")'), true);
  assert.equal(actionSource.includes('returnTo.startsWith("/booking/")'), true);
  assert.equal(actionSource.includes('returnTo.startsWith("/shelter/")'), true);
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
  assert.equal(panelSource.includes("/booking/${booking.id}/visitor-profile"), true);
});

test("admin draft and shelter portal message tabs use real appointment threads", () => {
  const panelSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const dataSource = readFileSync(new URL("../utils/admin-draft-data.ts", import.meta.url), "utf8");

  assert.equal(dataSource.includes("loadAppointmentMessageThreads"), true);
  assert.equal(dataSource.includes("messageThreads"), true);
  assert.equal(dataSource.includes("messagesUnavailable"), true);
  assert.equal(panelSource.includes("sendShelterAppointmentMessageAction"), true);
  assert.equal(panelSource.includes("Read-only PawJai admin view"), true);
  assert.equal(panelSource.includes("messageFilter"), true);
  assert.equal(panelSource.includes("messageSearch"), true);
  assert.equal(panelSource.includes("No conversation selected"), true);
  assert.equal(panelSource.includes("/visitor-profile"), true);
  assert.equal(panelSource.includes('name="attachment"'), true);
  assert.equal(panelSource.includes("Attach file"), true);
  assert.equal(panelSource.includes("/admin/bookings?shelter="), false);
});
