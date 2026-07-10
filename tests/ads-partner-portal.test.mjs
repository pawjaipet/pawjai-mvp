import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("/ads uses partner login and does not expose the internal ad list", () => {
  const pageSource = readFileSync(new URL("../app/ads/page.tsx", import.meta.url), "utf8");
  const formSource = readFileSync(new URL("../app/ads/AdsGateForm.tsx", import.meta.url), "utf8");
  const createSource = readFileSync(new URL("../app/ads/PartnerAdCreatePage.tsx", import.meta.url), "utf8");
  const actionsSource = readFileSync(new URL("../app/ads/actions.ts", import.meta.url), "utf8");
  const authSource = readFileSync(new URL("../utils/ads-partner-auth.ts", import.meta.url), "utf8");

  assert.equal(pageSource.includes("AdminAdsPage"), false);
  assert.equal(pageSource.includes("requireGlobalAdmin"), false);
  assert.equal(pageSource.includes("PartnerAdCreatePage"), true);
  assert.equal(pageSource.includes("isAdsPartnerGateOpen"), true);

  assert.equal(formSource.includes("Partner ads login."), true);
  assert.equal(formSource.includes('name="username"'), true);
  assert.equal(formSource.includes('name="password"'), true);
  assert.equal(authSource.includes("ADS_PARTNER_USERNAME"), true);
  assert.equal(authSource.includes("pawjaiads"), true);

  assert.equal(createSource.includes("All Ads"), false);
  assert.equal(createSource.includes("deleteAdAction"), false);
  assert.equal(createSource.includes("toggleAdAction"), false);
  assert.equal(createSource.includes("createPartnerAdAction"), true);
  assert.equal(actionsSource.includes("createAdFromFormData"), true);
});

test("admin draft remains the internal ad review surface", () => {
  const draftSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");

  assert.equal(draftSource.includes("function AdsTab"), true);
  assert.equal(draftSource.includes("Partner submissions from /ads land in the same ads table."), true);
  assert.equal(draftSource.includes("Brands do not need their own login yet."), false);
});
