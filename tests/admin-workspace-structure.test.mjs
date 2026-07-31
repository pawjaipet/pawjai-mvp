import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function assertArrayValues(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

function loadAdminWorkspaceStructure() {
  const source = readFileSync(new URL("../utils/admin-workspace-structure.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };

  new Script(outputText).runInNewContext({
    exports: module.exports,
    module,
  });

  return module.exports;
}

test("global admins see the PawJai HQ umbrella first", () => {
  const { getAdminWorkspaceDraft } = loadAdminWorkspaceStructure();

  const draft = getAdminWorkspaceDraft("admin");

  assert.equal(draft.title, "PawJai HQ");
  assert.equal(draft.defaultPath, "/admindraft");
  assertArrayValues(
    draft.primarySections.map((section) => section.label),
    ["Overview", "Shelters", "Dogs", "Bookings", "Donations", "Ads", "About content", "Accounts", "Audit"],
  );
});

test("shelter admins see the complete scoped shelter workspace", () => {
  const { getAdminWorkspaceDraft } = loadAdminWorkspaceStructure();

  const draft = getAdminWorkspaceDraft("shelter_admin");

  assert.equal(draft.title, "My Shelter Workspace");
  assert.equal(draft.subtitle, "powered by PAWJAI");
  assert.equal(draft.defaultPath, "/shelter");
  assertArrayValues(
    draft.primarySections.map((section) => section.label),
    ["Shelter profile", "Dogs", "Create dog", "Bookings", "Donations", "Messaging"],
  );
  assert.equal(draft.primarySections[0].path, "/shelter/[slug]?view=profile");
  assert.equal(draft.primarySections[4].path, "/shelter/[slug]?view=donations");
});

test("draft structure marks global-only sections", () => {
  const { getAdminWorkspaceDraft } = loadAdminWorkspaceStructure();

  const draft = getAdminWorkspaceDraft("admin");
  const globalOnly = draft.primarySections
    .filter((section) => section.globalOnly)
    .map((section) => section.label);

  assertArrayValues(globalOnly, ["Ads", "About content", "Accounts", "Audit"]);
});

test("dog draft workflow includes current admin upload steps, filters, media controls, and booking actions", () => {
  const { adminDogDraftWorkflow } = loadAdminWorkspaceStructure();

  assertArrayValues(
    adminDogDraftWorkflow.workflow.map((step) => step.title),
    ["Core Listing", "Matching Template", "Photos and Videos", "Review and Manage"],
  );
  assert.ok(adminDogDraftWorkflow.uploadSources.includes("Local folder inside pawjaidogs"));
  assert.ok(adminDogDraftWorkflow.uploadSources.includes("Upload photos and videos"));
  assert.ok(adminDogDraftWorkflow.uploadSources.includes("Photo URL slots"));
  assert.ok(adminDogDraftWorkflow.mediaControls.includes("Choose cover"));
  assert.ok(adminDogDraftWorkflow.mediaControls.includes("Move media up"));
  assert.ok(adminDogDraftWorkflow.mediaControls.includes("Move media down"));
  assert.ok(adminDogDraftWorkflow.listingFilters.includes("Adoption status"));
  assert.ok(adminDogDraftWorkflow.listingFilters.includes("No cover media"));
  assert.ok(adminDogDraftWorkflow.bookingActions.includes("Accept booking"));
  assert.ok(adminDogDraftWorkflow.bookingActions.includes("Ask to change date/time"));
});

test("draft launches dog editing natively and leaves unfinished workflows on old admin routes", () => {
  const source = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const navSource = readFileSync(new URL("../components/admin/AdminWorkspaceNav.tsx", import.meta.url), "utf8");
  const adsRouteSource = readFileSync(new URL("../app/admindraft/ads/page.tsx", import.meta.url), "utf8");

  assert.equal(source.includes("`/admindraft/dogs/${dog.id}/edit`"), true);
  assert.equal(source.includes("`${workspaceBaseHref}/dogs/${dog.id}/edit`"), true);
  assert.equal(source.includes("href={`/admin/bookings?shelter=${shelter.id}&view=messages`}"), false);
  assert.equal(source.includes('href="/admin/ads"'), false);
  assert.equal(navSource.includes('return "/admindraft/ads"'), true);
  assert.equal(adsRouteSource.includes("AdminAdsPage"), true);
  assert.equal(source.includes('href="/admindraft/aboutcontent"'), true);
  assert.equal(source.includes('href="/admindraft/accounts"'), true);
  assert.equal(source.includes('href="/admindraft/audit"'), true);
});
