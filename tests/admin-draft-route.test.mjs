import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("/admin is the canonical Supabase-backed PawJai workspace", () => {
  const source = readFileSync(new URL("../app/admin/AdminWorkspacePage.tsx", import.meta.url), "utf8");

  assert.equal(source.includes("loadAdminDraftData"), true);
  assert.equal(source.includes("initialShelterId={resolvedSearchParams?.shelter}"), true);
  assert.equal(source.includes("initialShelterTab={resolvedSearchParams?.view}"), true);
  assert.equal(source.includes('initialRoleView={resolvedSearchParams?.role === "shelter" ? "shelter" : "pawjai"}'), true);
  assert.equal(source.includes('dynamic = "force-dynamic"'), true);
});

test("/admin requires the PawJai Google admin session before loading data", () => {
  const pageSource = readFileSync(new URL("../app/admin/AdminWorkspacePage.tsx", import.meta.url), "utf8");
  const layoutSource = readFileSync(new URL("../app/admin/layout.tsx", import.meta.url), "utf8");
  const authSource = readFileSync(new URL("../utils/admin-auth.ts", import.meta.url), "utf8");
  const loginSource = readFileSync(new URL("../components/admin/AdminGoogleLogin.tsx", import.meta.url), "utf8");

  assert.equal(pageSource.includes("requireGlobalAdmin"), true);
  assert.equal(pageSource.includes("<AdminDraftGate"), false);
  assert.equal(pageSource.includes("loadAdminDraftData"), true);
  assert.equal(layoutSource.includes("AdminLaneGuard"), true);
  assert.equal(layoutSource.includes('redirect(await getShelterPortalTarget'), false);
  assert.equal(authSource.includes("DEFAULT_PAWJAI_ADMIN_GOOGLE_EMAIL"), true);
  assert.equal(authSource.includes("isPawjaiGoogleAdminUser"), true);
  assert.equal(authSource.includes("redirect(buildAdminLoginPath(nextPath))"), true);
  assert.equal(loginSource.includes("completeAdminGoogleLogin"), true);
  assert.equal(loginSource.includes("signInWithIdToken"), true);
});

test("/shelter supports real shelter account login and scoped shelter mode", () => {
  const pageSource = readFileSync(new URL("../app/admin/AdminWorkspacePage.tsx", import.meta.url), "utf8");
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
  assert.equal(bottomNavSource.includes('"/shelter"'), true);
  assert.equal(bottomNavSource.includes("hidesAdopterNavigation(pathname)"), true);
  assert.equal(portalSource.includes("slugifyShelterName"), true);
  assert.equal(panelSource.includes("lockRoleView"), true);
  assert.equal(panelSource.includes("Account settings"), true);
  assert.equal(panelSource.includes("signOutShelterPortalAction"), true);
  assert.equal(dataSource.includes("LoadAdminDraftDataOptions"), true);
  assert.equal(dataSource.includes("shouldScopeShelters"), true);
  assert.equal(dataSource.includes("returnedShelterIds.has"), true);
});

test("legacy admin reorg draft route redirects to /admin", () => {
  const source = readFileSync(new URL("../app/admin/reorg-draft/page.tsx", import.meta.url), "utf8");

  assert.equal(source.includes('redirect("/admin")'), true);
});

test("admin direct pages route through the shared Google admin guard", () => {
  const aboutSource = readFileSync(new URL("../app/admin/aboutcontent/page.tsx", import.meta.url), "utf8");
  const accountsSource = readFileSync(new URL("../app/admin/accounts/page.tsx", import.meta.url), "utf8");
  const adsSource = readFileSync(new URL("../app/admin/ads/page.tsx", import.meta.url), "utf8");
  const auditSource = readFileSync(new URL("../app/admin/audit/page.tsx", import.meta.url), "utf8");
  const analyticsSource = readFileSync(new URL("../app/admin/analytics/page.tsx", import.meta.url), "utf8");
  const mainSource = readFileSync(new URL("../app/admin/AdminWorkspacePage.tsx", import.meta.url), "utf8");
  const accountsContentSource = readFileSync(new URL("../components/admin/AdminAccountsPageContent.tsx", import.meta.url), "utf8");
  const auditContentSource = readFileSync(new URL("../components/admin/AdminAuditPageContent.tsx", import.meta.url), "utf8");
  const analyticsContentSource = readFileSync(new URL("../components/admin/AdminUserAnalyticsPageContent.tsx", import.meta.url), "utf8");
  const aboutContentSource = readFileSync(new URL("../components/admin/PawjaiProfileAdminPageContent.tsx", import.meta.url), "utf8");

  assert.equal(aboutSource.includes("lockedFallback"), false);
  assert.equal(accountsSource.includes("lockedFallback"), false);
  assert.equal(adsSource.includes('redirect("/admin?view=ads")'), true);
  assert.equal(adsSource.includes("AdminAdsPage"), false);
  assert.equal(auditSource.includes("lockedFallback"), false);
  assert.equal(analyticsSource.includes("lockedFallback"), false);
  for (const source of [auditContentSource, analyticsContentSource, aboutContentSource]) {
    assert.equal(source.includes("buildAdminLoginPath"), true);
  }
  assert.equal(accountsContentSource.includes("requireGlobalAdmin"), true);
  assert.equal(mainSource.includes("buildAdminReturnTo"), true);
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
  assert.equal(source.includes("<AdsTab"), true);
  assert.equal(source.includes("adClicks={adClicks}"), true);
  assert.equal(source.includes("ads={ads}"), true);
  assert.equal(source.includes("AboutTab about={about}"), true);
});

test("admin ad tab uses clickable status sub-tabs", () => {
  const source = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");

  assert.equal(source.includes("matchesAdFilters"), true);
  assert.equal(source.includes('id="admin-ad-search"'), true);
  assert.equal(source.includes('placeholder="Search ad code, advertiser, or URL"'), true);
  assert.equal(source.includes('id="admin-ad-status"'), false);
  assert.equal(source.includes('{ label: "Pending review", value: "pending" }'), true);
  assert.equal(source.includes('{ label: "Live", value: "approved" }'), true);
  assert.equal(source.includes('{ label: "Paused", value: "paused" }'), true);
  assert.equal(source.includes('{ label: "Denied", value: "denied" }'), true);
  assert.equal(source.includes('{ label: "Expired", value: "expired" }'), true);
  assert.equal(source.includes("AD_STATUS_TABS.map"), true);
  assert.equal(source.includes("No ads match these filters."), true);
  assert.equal(source.includes("Accept ad"), true);
  assert.equal(source.includes("Deny ad"), true);
  assert.equal(source.includes("Edit ad dates"), true);
  assert.equal(source.includes("Preview full ad"), true);
  assert.equal(source.includes("Analytics"), true);
  assert.equal(source.includes("Clicks over last 14 days"), true);
  assert.equal(source.includes("Recent clickers"), true);
  assert.equal(source.includes("Review ads"), true);
  assert.equal(source.includes('const ADMIN_ADS_RETURN_TO = "/admin?view=ads"'), true);
  assert.equal(source.includes("ADMIN_ADS_RETURN_TO"), true);
  assert.equal(source.includes('FieldGrid fields={["Advertiser", "Placement", "Image/video asset", "Destination URL", "Live status", "Start date", "End date"]}'), false);
});

test("PawJai-only pages share the admin workspace shell", () => {
  const analyticsSource = readFileSync(new URL("../components/admin/AdminUserAnalyticsPageContent.tsx", import.meta.url), "utf8");
  const accountsSource = readFileSync(new URL("../components/admin/AdminAccountsPageContent.tsx", import.meta.url), "utf8");
  const auditSource = readFileSync(new URL("../components/admin/AdminAuditPageContent.tsx", import.meta.url), "utf8");
  const aboutSource = readFileSync(new URL("../components/admin/PawjaiProfileAdminPageContent.tsx", import.meta.url), "utf8");
  const shellSource = readFileSync(new URL("../components/admin/PawjaiWorkspaceShell.tsx", import.meta.url), "utf8");

  for (const source of [analyticsSource, accountsSource, auditSource, aboutSource]) {
    assert.equal(source.includes("PawjaiWorkspaceShell"), true);
  }
  assert.equal(shellSource.includes("PawJai management workspace"), true);
  assert.equal(shellSource.includes("View as PawJai"), true);
  assert.equal(shellSource.includes("View as shelter"), true);
  assert.equal(shellSource.includes("AdminWorkspaceNav"), true);
  assert.equal(analyticsSource.indexOf('active="analytics"') < analyticsSource.indexOf("RANGE_OPTIONS.map"), true);
});

test("admin draft supports shelter-specific filters and square shelter workspace tabs", () => {
  const source = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");

  assert.equal(source.includes("shelterFilterOptions"), true);
  assert.equal(source.includes('id="all-dog-shelter"'), true);
  assert.equal(source.includes('id="booking-shelter-filter"'), true);
  assert.equal(source.includes("aspect-square"), true);
});

test("admin shelter profile reuses live shelter edit actions in place", () => {
  const panelSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const dataSource = readFileSync(new URL("../utils/admin-draft-data.ts", import.meta.url), "utf8");
  const actionSource = readFileSync(new URL("../app/admin/bookings/actions.ts", import.meta.url), "utf8");

  assert.equal(panelSource.includes("updateShelterProfileAction"), true);
  assert.equal(panelSource.includes("updateShelterOperatingDaysAction"), true);
  assert.equal(panelSource.includes("createShelterBlockoutAction"), true);
  assert.equal(panelSource.includes("deleteShelterAvailabilityAction"), true);
  assert.equal(panelSource.includes('const ADMIN_RETURN_TO = "/admin"'), true);
  assert.equal(panelSource.includes('name="returnTo"'), true);
  assert.equal(panelSource.includes("Save shelter profile"), true);
  assert.equal(panelSource.includes("Save weekly schedule"), true);
  assert.equal(dataSource.includes('.from("shelter_availability")'), true);
  assert.equal(dataSource.includes('.from("shelter_regular_hours")'), true);
  assert.equal(actionSource.includes("redirectAfterShelterMutation"), true);
  assert.equal(actionSource.includes('returnTo.startsWith("/admin")'), true);
  assert.equal(actionSource.includes('returnTo.startsWith("/shelter/")'), true);
});

test("legacy admin draft cookies are cleared but no longer accepted as admin auth", () => {
  const authSource = readFileSync(new URL("../utils/admin-auth.ts", import.meta.url), "utf8");

  assert.equal(authSource.includes('const ADMIN_DRAFT_COOKIE = "pawjai_admin_draft_unlocked"'), true);
  assert.equal(authSource.includes("ADMIN_DRAFT_COOKIE"), true);
  assert.equal(authSource.includes("cookieStore.getAll(ADMIN_DRAFT_COOKIE)"), false);
  assert.equal(authSource.includes("await closeAdminGate();"), true);
});

test("canonical admin has a focused create-dog route that reuses the real dog listing form", () => {
  const panelSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const adminCreateSource = readFileSync(new URL("../app/admin/dogs/new/page.tsx", import.meta.url), "utf8");
  const shelterCreateSource = readFileSync(new URL("../app/shelter/[slug]/dogs/new/page.tsx", import.meta.url), "utf8");
  const formSource = readFileSync(new URL("../app/admin/dogs/new/DogListingForm.tsx", import.meta.url), "utf8");

  assert.equal(panelSource.includes("`/admin/dogs/new?shelter=${selectedShelter.id}`"), true);
  assert.equal(panelSource.includes("`${workspaceBaseHref}/dogs/new`"), true);
  assert.equal(panelSource.includes("adminDraftShelterCreateDogHref"), true);
  assert.equal(panelSource.includes('params.set("role", "shelter")'), true);
  assert.equal(adminCreateSource.includes("DogListingForm"), true);
  assert.equal(adminCreateSource.includes("PawjaiWorkspaceShell"), true);
  assert.equal(adminCreateSource.includes("requireGlobalAdmin"), true);
  assert.equal(adminCreateSource.includes("Exit"), true);
  assert.equal(adminCreateSource.includes('cancelLabel="Exit"'), true);
  assert.equal(adminCreateSource.includes('submitLabel="Save Draft"'), true);
  assert.equal(adminCreateSource.includes('listingsParams.set("role", "shelter")'), true);
  assert.equal(adminCreateSource.includes("returnTo={cancelHref}"), true);
  assert.equal(formSource.includes("showIntro = true"), true);
  assert.equal(formSource.includes('cancelLabel = "Cancel"'), true);
  assert.equal(formSource.includes("successListingsHref"), true);
  assert.equal(formSource.includes("submitLabel"), true);
  assert.equal(formSource.includes('import { Save } from "lucide-react"'), true);
  assert.equal(formSource.includes("bg-[#cd8188]"), true);
  assert.equal(formSource.includes("bg-[#d38a2c]"), false);
  assert.equal(adminCreateSource.includes("bg-[#cd8188]"), true);
  assert.equal(adminCreateSource.includes("bg-[#d38a2c]"), false);
  assert.equal(shelterCreateSource.includes("getAdminAuthContext({ includePhraseGate: false })"), true);
  assert.equal(shelterCreateSource.includes("getShelterByPortalSlug"), true);
  assert.equal(shelterCreateSource.includes("PawjaiWorkspaceShell"), true);
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
  assert.equal(panelSource.includes("md:grid-cols-6"), true);
});

test("canonical admin dog cards edit through an admin-native dog edit route", () => {
  const panelSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const shelterEditSource = readFileSync(new URL("../app/shelter/[slug]/dogs/[id]/edit/page.tsx", import.meta.url), "utf8");
  const adminEditSource = readFileSync(new URL("../app/admin/dogs/[id]/edit/page.tsx", import.meta.url), "utf8");

  assert.equal(panelSource.includes("`/admin/dogs/${dog.id}/edit`"), true);
  assert.equal(panelSource.includes("`${workspaceBaseHref}/dogs/${dog.id}/edit`"), true);
  assert.equal(panelSource.includes("adoptionBookingListHref"), true);
  assert.equal(panelSource.includes("bookingWorkspaceVisitorHref"), true);
  assert.equal(adminEditSource.includes("DogEditForm"), true);
  assert.equal(adminEditSource.includes("requireGlobalAdmin"), true);
  assert.equal(adminEditSource.includes("AdminDraftGate"), false);
  assert.equal(adminEditSource.includes("Back to dog listings"), true);
  assert.equal(adminEditSource.includes("returnTo={editHref}"), true);
  assert.equal(adminEditSource.includes("PawJai Admin"), true);
  assert.equal(shelterEditSource.includes("getAdminAuthContext({ includePhraseGate: false })"), true);
  assert.equal(shelterEditSource.includes("getShelterByPortalSlug"), true);
  assert.equal(shelterEditSource.includes("dog.shelter_id !== shelter.id"), true);
  assert.equal(shelterEditSource.includes("returnTo={`/shelter/${slug}/dogs/${dog.id}/edit`}"), true);
});

test("admin draft and shelter portal open booking detail and visitor profile through shared guarded routes", () => {
  const panelSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const routeSource = readFileSync(new URL("../utils/booking-workspace-routes.ts", import.meta.url), "utf8");
  const bookingDetailSource = readFileSync(new URL("../app/booking/[id]/page.tsx", import.meta.url), "utf8");
  const visitorProfileSource = readFileSync(new URL("../app/booking/[id]/visitor-profile/page.tsx", import.meta.url), "utf8");
  const checkInSource = readFileSync(new URL("../app/booking/check-in/page.tsx", import.meta.url), "utf8");
  const adminDetailSource = readFileSync(new URL("../app/admin/bookings/[id]/page.tsx", import.meta.url), "utf8");
  const adminVisitorSource = readFileSync(new URL("../app/admin/bookings/[id]/visitor-profile/page.tsx", import.meta.url), "utf8");
  const adminCheckInSource = readFileSync(new URL("../app/admin/bookings/check-in/page.tsx", import.meta.url), "utf8");
  const shelterDetailSource = readFileSync(new URL("../app/shelter/[slug]/bookings/[id]/page.tsx", import.meta.url), "utf8");
  const shelterVisitorSource = readFileSync(new URL("../app/shelter/[slug]/bookings/[id]/visitor-profile/page.tsx", import.meta.url), "utf8");
  const shelterCheckInSource = readFileSync(new URL("../app/shelter/[slug]/bookings/check-in/page.tsx", import.meta.url), "utf8");
  const actionSource = readFileSync(new URL("../app/admin/bookings/actions.ts", import.meta.url), "utf8");

  assert.equal(panelSource.includes("bookingWorkspaceDetailHref"), true);
  assert.equal(panelSource.includes("bookingWorkspaceVisitorHref"), true);
  assert.equal(panelSource.includes("bookingWorkspaceCheckInHref"), true);
  assert.equal(panelSource.includes("bookingListHref"), true);
  assert.equal(routeSource.includes("`${shelterBase}/bookings/${appointmentId}`"), true);
  assert.equal(routeSource.includes("`/admin/bookings/${appointmentId}`"), true);
  assert.equal(bookingDetailSource.includes("decideBookingAction"), true);
  assert.equal(bookingDetailSource.includes("getAdminAuthContext"), true);
  assert.equal(bookingDetailSource.includes("safeBookingReturnTo"), true);
  assert.equal(bookingDetailSource.includes('requested.startsWith("/admindraft")'), true);
  assert.equal(bookingDetailSource.includes('requested.startsWith("/shelter/")'), true);
  assert.equal(bookingDetailSource.includes('requested.startsWith("/admin/bookings")'), true);
  assert.equal(bookingDetailSource.includes("Back to shelter bookings"), true);
  assert.equal(bookingDetailSource.includes('name="returnTo"'), true);
  assert.equal(bookingDetailSource.includes("bookingWorkspaceVisitorHref"), true);
  assert.equal(bookingDetailSource.includes("!context.isGlobalAdmin && !shelterPortalSlug"), true);
  assert.equal(visitorProfileSource.includes("getAdminAuthContext"), true);
  assert.equal(visitorProfileSource.includes("safeBookingReturnTo"), true);
  assert.equal(visitorProfileSource.includes("Back to booking detail"), true);
  assert.equal(visitorProfileSource.includes("Back to booking list"), true);
  assert.equal(visitorProfileSource.includes("bookingWorkspaceDetailHref"), true);
  assert.equal(visitorProfileSource.includes("!context.isGlobalAdmin && !shelterPortalSlug"), true);
  assert.equal(checkInSource.includes("getAdminAuthContext"), true);
  assert.equal(checkInSource.includes("bookingWorkspaceDetailHref"), true);
  assert.equal(checkInSource.includes("Back to booking list"), true);
  assert.equal(checkInSource.includes("!context.isGlobalAdmin && !shelterPortalSlug"), true);
  for (const adminRouteSource of [adminDetailSource, adminVisitorSource, adminCheckInSource]) {
    assert.equal(adminRouteSource.includes("requireGlobalAdmin"), true);
  }
  for (const shelterRouteSource of [shelterDetailSource, shelterVisitorSource, shelterCheckInSource]) {
    assert.equal(shelterRouteSource.includes("getAdminAuthContext({ includePhraseGate: false })"), true);
    assert.equal(shelterRouteSource.includes("getShelterByPortalSlug"), true);
    assert.equal(shelterRouteSource.includes('`/shelter/${slug}?view=bookings`'), true);
    assert.equal(shelterRouteSource.includes("shelterPortalSlug: slug"), true);
  }
  assert.equal(actionSource.includes("redirectAfterBookingDecision"), true);
  assert.equal(actionSource.includes("safeBookingMutationReturnTo"), true);
  assert.equal(actionSource.includes("getShelterPortalTarget"), true);
  assert.equal(actionSource.includes("context.isGlobalAdmin"), true);
  assert.equal(actionSource.includes("allowedSharedDetail"), false);
});

test("admin and adopter navigation cannot leak a shelter session into PawJai admin", () => {
  const adminLayoutSource = readFileSync(new URL("../app/admin/layout.tsx", import.meta.url), "utf8");
  const authSource = readFileSync(new URL("../utils/admin-auth.ts", import.meta.url), "utf8");
  const bottomNavSource = readFileSync(new URL("../components/BottomNavBar.tsx", import.meta.url), "utf8");
  const panelSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const adminDogPageSource = readFileSync(new URL("../app/admin/dogs/new/page.tsx", import.meta.url), "utf8");
  const adminBookingsPageSource = readFileSync(new URL("../app/admin/bookings/page.tsx", import.meta.url), "utf8");
  const adminLaneGuardSource = readFileSync(new URL("../components/admin/AdminLaneGuard.tsx", import.meta.url), "utf8");

  assert.equal(adminLayoutSource.includes('redirect(await getShelterPortalTarget'), false);
  assert.equal(adminLayoutSource.includes("AdminLaneGuard"), true);
  assert.equal(adminLaneGuardSource.includes('window.location.pathname === "/admin/login"'), true);
  assert.equal(adminLaneGuardSource.includes('`/admin/login?next=${encodeURIComponent(nextPath)}`'), true);
  assert.equal(adminDogPageSource.includes("requireGlobalAdmin"), true);
  assert.equal(adminBookingsPageSource.includes('redirect("/admin?view=bookings")'), true);
  assert.equal(authSource.includes("adminGateOpen || adminDraftOpen"), false);
  assert.equal(authSource.includes("isPawjaiGoogleAdminUser(user)"), true);
  for (const routePrefix of ["/admin", "/admindraft", "/ads", "/booking", "/doglistings", "/shelter"]) {
    assert.equal(bottomNavSource.includes(`"${routePrefix}"`), true);
  }
  assert.equal(bottomNavSource.includes("hidesAdopterNavigation(pathname)"), true);
  assert.equal(panelSource.includes('href={isShelterPortal ? workspaceBaseHref : "/admin"}'), true);
  assert.equal(panelSource.includes('isShelterPortal ? "PawJai Shelter Portal" : "PawJai Admin"'), true);
  assert.equal(panelSource.includes("This workspace is limited to your shelter account and its linked records."), true);
});

test("admin draft booking tab duplicates the low-friction old booking workspace flow", () => {
  const panelSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const scannerSource = readFileSync(new URL("../app/admin/bookings/BookingQrScanner.tsx", import.meta.url), "utf8");

  assert.equal(panelSource.includes("VISIT_BUCKETS"), true);
  assert.equal(panelSource.includes('{ label: "Past", value: "past" }'), true);
  assert.equal(panelSource.includes('{ label: "History", value: "history" }'), true);
  assert.equal(panelSource.includes('{ label: "Adopted", value: "adopted" }'), true);
  assert.equal(panelSource.includes('"needs_follow_up"'), false);
  assert.equal(panelSource.includes("bookingSearch"), true);
  assert.equal(panelSource.includes("bookingStatusFilter"), true);
  assert.equal(panelSource.includes("Search booking code"), true);
  assert.equal(panelSource.includes("BookingQrScanner"), true);
  assert.equal(scannerSource.includes("QR check-in scanner"), true);
  assert.equal(panelSource.includes("decideBookingAction"), true);
  assert.equal(panelSource.includes("canRecordPostVisitOutcome"), true);
  assert.equal(panelSource.includes("Adopted dog profile"), true);
  assert.equal(panelSource.includes("Edit decision"), true);
  assert.equal(panelSource.includes("Open visitor profile"), true);
  assert.equal(panelSource.includes("Open booking detail"), true);
  assert.equal(panelSource.includes("bookingWorkspaceVisitorHref"), true);
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
