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
  assert.equal(createSource.includes("Continue to preview"), true);
  assert.equal(createSource.includes("Submit for review"), true);
  assert.equal(createSource.includes('name="contact_email"'), true);
  assert.equal(createSource.includes('name="contact_phone"'), true);
  assert.equal(createSource.includes('name="end_date"'), true);
  assert.equal(createSource.includes("Requested end date"), true);
  assert.equal(createSource.includes("Ad submission code"), true);
  assert.equal(actionsSource.includes("createAdFromFormData"), true);
  assert.equal(actionsSource.includes('reviewStatus: "pending"'), true);
  assert.equal(actionsSource.includes("isActive: false"), true);
  assert.equal(actionsSource.includes("sendAdSubmissionConfirmation"), true);
});

test("admin draft remains the internal ad review surface", () => {
  const draftSource = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");
  const dataSource = readFileSync(new URL("../utils/admin-draft-data.ts", import.meta.url), "utf8");
  const adminAdsSource = readFileSync(new URL("../app/admin/ads/AdminAdsPage.tsx", import.meta.url), "utf8");
  const adminActionsSource = readFileSync(new URL("../app/admin/ads/actions.ts", import.meta.url), "utf8");
  const activeAdsSource = readFileSync(new URL("../utils/ads.ts", import.meta.url), "utf8");
  const adCardSource = readFileSync(new URL("../components/AdCard.tsx", import.meta.url), "utf8");
  const clickRouteSource = readFileSync(new URL("../app/ads/click/[id]/route.ts", import.meta.url), "utf8");

  assert.equal(draftSource.includes("function AdsTab"), true);
  assert.equal(draftSource.includes("Partner submissions from /ads land in the same ads table."), true);
  assert.equal(draftSource.includes("Brands do not need their own login yet."), false);
  assert.equal(draftSource.includes("Accept ad"), true);
  assert.equal(draftSource.includes("Deny ad"), true);
  assert.equal(draftSource.includes("Pause ad"), true);
  assert.equal(draftSource.includes("Resume ad"), true);
  assert.equal(draftSource.includes("Edit ad dates"), true);
  assert.equal(draftSource.includes("Preview full ad"), true);
  assert.equal(draftSource.includes("Analytics"), true);
  assert.equal(draftSource.includes("Clicks over last 14 days"), true);
  assert.equal(draftSource.includes("Recent clickers"), true);
  assert.equal(draftSource.includes("submissionCode"), true);
  assert.equal(draftSource.includes("updateAdReviewStatusFromFormAction"), true);
  assert.equal(draftSource.includes("toggleAdFromFormAction"), true);
  assert.equal(draftSource.includes("updateAdDatesFromFormAction"), true);
  assert.equal(draftSource.includes("Review ads"), true);
  assert.equal(dataSource.includes('.from("ad_clicks")'), true);
  assert.equal(dataSource.includes("submission_code"), true);
  assert.equal(adCardSource.includes("/ads/click/${ad.id}"), true);
  assert.equal(clickRouteSource.includes('.from("ad_clicks")'), true);
  assert.equal(clickRouteSource.includes("supabase.auth.getUser"), true);
  assert.equal(adminAdsSource.includes("AdReviewCard"), true);
  assert.equal(adminAdsSource.includes("Accept"), true);
  assert.equal(adminAdsSource.includes("Deny"), true);
  assert.equal(adminAdsSource.includes("Full preview"), true);
  assert.equal(adminActionsSource.includes("updateAdReviewStatusAction"), true);
  assert.equal(adminActionsSource.includes("updateAdReviewStatusFromFormAction"), true);
  assert.equal(activeAdsSource.includes('.eq("ad_status", "approved")'), true);
});
