import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("real staff sessions are used and legacy phrase cookies are ignored", () => {
  const auth = source("../utils/admin-auth.ts");
  const realSessionCheck = auth.indexOf("if (user)");

  assert.ok(realSessionCheck > -1);
  assert.equal(auth.includes("cookieStore.getAll(ADMIN_GATE_COOKIE)"), false);
  assert.equal(auth.includes("cookieStore.getAll(ADMIN_DRAFT_COOKIE)"), false);
  assert.match(auth, /isPawjaiGoogleAdminUser/);
  assert.match(auth, /context\.role === "shelter_admin"/);
  assert.match(auth, /redirectShelterAccountToPortal/);
});

test("admin trees reject shelter accounts on fresh requests and browser-history restores", () => {
  const adminLayout = source("../app/admin/layout.tsx");
  const adminDogPage = source("../app/admin/dogs/new/page.tsx");
  const adminBookingsPage = source("../app/admin/bookings/page.tsx");
  const clientGuard = source("../components/admin/AdminLaneGuard.tsx");
  const laneRoute = source("../app/api/workspace-lane/route.ts");

  assert.match(adminLayout, /context\?\.role === "shelter_admin"/);
  assert.match(adminLayout, /getShelterPortalTarget/);
  assert.match(adminLayout, /<AdminLaneGuard \/>/);
  assert.match(adminDogPage, /requireGlobalAdmin/);
  assert.match(adminBookingsPage, /redirect\("\/admin\?view=bookings"\)/);

  assert.match(clientGuard, /window\.addEventListener\("pageshow"/);
  assert.match(clientGuard, /window\.addEventListener\("popstate"/);
  assert.match(clientGuard, /window\.location\.replace/);
  assert.match(laneRoute, /includePhraseGate: false/);
  assert.match(laneRoute, /lane: "shelter"/);
  assert.match(laneRoute, /"Cache-Control": "no-store"/);
});

test("shelter portal pages and deep dog routes use real scoped auth only", () => {
  const portalPage = source("../app/shelter/[slug]/page.tsx");
  const createDogPage = source("../app/shelter/[slug]/dogs/new/page.tsx");
  const editDogPage = source("../app/shelter/[slug]/dogs/[id]/edit/page.tsx");

  for (const page of [createDogPage, editDogPage]) {
    assert.match(page, /getAdminAuthContext\(\{ includePhraseGate: false \}\)/);
    assert.match(page, /getShelterByPortalSlug/);
    assert.match(page, /homeHref=/);
    assert.doesNotMatch(page, /href=["{`]\/admindraft/);
  }

  assert.match(portalPage, /loadAdminDraftData\(\{ shelterIds: \[shelter\.id\] \}\)/);
  assert.match(portalPage, /workspaceBaseHref=\{`\/shelter\/\$\{slug\}`\}/);
});

test("shelter query tabs keep URL and rendered workspace state synchronized", () => {
  const panel = source("../components/admin/AdminReorgDraftPanel.tsx");

  assert.match(panel, /<Link className=\{className\} href=\{href\} onClick=\{onClick\}>/);
  assert.match(panel, /if \(isShelterTab\(initialShelterTab\)\)/);
  assert.match(panel, /setShelterTab\(initialShelterTab\)/);
});

test("shelter password changes verify the current password and confirmation", () => {
  const settings = source("../app/shelter/[slug]/settings/page.tsx");
  const actions = source("../app/shelter/actions.ts");

  assert.match(settings, /name="currentPassword"/);
  assert.match(settings, /name="newPassword"/);
  assert.match(settings, /name="confirmNewPassword"/);
  assert.match(settings, /bg-\[#cd8188\]/);
  assert.match(actions, /newPassword !== confirmNewPassword/);
  assert.match(actions, /passwordClient\.auth\.signInWithPassword/);
  assert.match(actions, /persistSession: false/);
  assert.match(actions, /passwordCheck\.user\?\.id !== context\.userId/);
});

test("shelter create and edit flows store an optional Thai dog name on the shared dog record", () => {
  const createForm = source("../app/admin/dogs/new/DogListingForm.tsx");
  const createAction = source("../app/admin/dogs/new/actions.ts");
  const editForm = source("../app/admin/dogs/[id]/edit/DogEditForm.tsx");
  const editAction = source("../app/admin/dogs/[id]/edit/actions.ts");

  for (const form of [createForm, editForm]) {
    assert.match(form, /Dog name \(English\)/);
    assert.match(form, /Dog name \(Thai\)/);
    assert.match(form, /name="name_th"/);
  }
  for (const action of [createAction, editAction]) {
    assert.match(action, /"localized_name_th", getOptionalString\(formData, "name_th"\)/);
  }
  assert.match(editAction, /"localized_name_th"/);
});

test("shelter booking routes remain under the portal for detail, visitor, and QR flows", () => {
  const routeHelper = source("../utils/booking-workspace-routes.ts");
  const sharedDetail = source("../app/booking/[id]/page.tsx");
  const sharedVisitor = source("../app/booking/[id]/visitor-profile/page.tsx");
  const sharedCheckIn = source("../app/booking/check-in/page.tsx");
  const portalDetail = source("../app/shelter/[slug]/bookings/[id]/page.tsx");
  const portalVisitor = source("../app/shelter/[slug]/bookings/[id]/visitor-profile/page.tsx");
  const portalCheckIn = source("../app/shelter/[slug]/bookings/check-in/page.tsx");

  assert.ok(routeHelper.includes("`${shelterBase}/bookings/${appointmentId}`"));
  for (const page of [sharedDetail, sharedVisitor, sharedCheckIn]) {
    assert.match(page, /!context\.isGlobalAdmin/);
    assert.match(page, /getShelterPortalTarget/);
  }
  for (const page of [portalDetail, portalVisitor, portalCheckIn]) {
    assert.match(page, /includePhraseGate: false/);
    assert.match(page, /getShelterByPortalSlug/);
    assert.match(page, /`\/shelter\/\$\{slug\}\?view=bookings`/);
  }
});

test("shelter form mutations cannot honor an admin return destination", () => {
  const bookingActions = source("../app/admin/bookings/actions.ts");
  const dogEditActions = source("../app/admin/dogs/[id]/edit/actions.ts");

  assert.match(bookingActions, /if \(!context\.isGlobalAdmin\)/);
  assert.match(bookingActions, /allowedPortalReturn/);
  assert.match(bookingActions, /await redirectAfterShelterMutation\(formData, adminContext/);
  assert.match(dogEditActions, /if \(!adminContext\.isGlobalAdmin\)/);
  assert.match(dogEditActions, /safePortalReturn/);
  assert.match(dogEditActions, /portalTarget \? `\$\{portalTarget\}\?view=dogs` : "\/shelter"/);
});

test("shared workspace and adopter navigation fail closed outside user routes", () => {
  const shell = source("../components/admin/PawjaiWorkspaceShell.tsx");
  const bottomNav = source("../components/BottomNavBar.tsx");

  assert.match(shell, /homeHref \?\? "\/shelter"/);
  for (const prefix of ["/admin", "/admindraft", "/booking", "/shelter"]) {
    assert.ok(bottomNav.includes(`"${prefix}"`));
  }
  assert.match(bottomNav, /hidesAdopterNavigation\(pathname\)/);
});
