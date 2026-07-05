import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const outputDir = "/Users/sudlabha/Desktop/paw/outputs/pawjai_systems_check_20260701";
const workbookPath = `${outputDir}/pawjai_systems_check_2026-07-01.xlsx`;
const previewPath = `${outputDir}/admin_feature_audit_preview.png`;

const rows = [
  [
    "Timestamp",
    "Area / Route",
    "Feature Tested",
    "Action / Path",
    "Observed Result",
    "Severity",
    "Evidence / Notes",
  ],
  [
    "2026-07-02",
    "/admin",
    "Shared admin phrase gate",
    "Opened https://www.pawjai.co.th/admin, entered pawjaiadmin, clicked Unlock admin page.",
    "Unlocked successfully into dog creation workspace.",
    "Pass",
    "Live DOM showed PawJai Admin nav and dog creation form after unlock.",
  ],
  [
    "2026-07-02",
    "/admin",
    "Create dog form load",
    "Inspected unlocked create dog screen.",
    "Form renders with core listing, matching template, tags, media URL/file upload fields, and Create dog listing button.",
    "Pass",
    "Live DOM exposed shelter dropdown, status, gender, size radios, matching radios, chips, media controls.",
  ],
  [
    "2026-07-02",
    "/admin",
    "Create dog submit interaction",
    "Attempted to click Create dog listing with an empty form to verify validation.",
    "Browser automation timed out trying to click the bottom submit button; no validation message was observed afterward.",
    "Medium",
    "The button exists in DOM, but interaction stalled from the in-app browser. Could be automation sensitivity, long page/actionability, or client-side performance issue; retest manually.",
  ],
  [
    "2026-07-02",
    "/admin/listings",
    "Manage listings route",
    "Opened live route via browser and HTTP.",
    "SSR returned the shared admin gate when unauthenticated; browser navigation to the route repeatedly hung/reset in automation.",
    "Medium",
    "HTTP status 200 in ~0.5s, rendered gate text. Browser-side deep admin route load caused automation timeout, suggesting hydration/performance or tool actionability problem.",
  ],
  [
    "2026-07-02",
    "/admin/bookings",
    "Bookings route",
    "Opened live route via HTTP.",
    "SSR returned the shared admin gate when unauthenticated.",
    "Pass",
    "HTTP status 200 in ~0.75s with PawJai Internal gate content.",
  ],
  [
    "2026-07-02",
    "/admin/bookings/check-in",
    "Booking QR / check-in route",
    "Opened live route via HTTP.",
    "SSR returned the shared admin gate when unauthenticated.",
    "Pass",
    "HTTP status 200 in ~0.66s with PawJai Internal gate content.",
  ],
  [
    "2026-07-02",
    "/admin/pawjaiprofile",
    "About content admin route",
    "Opened live route via HTTP.",
    "SSR returned the shared admin gate when unauthenticated.",
    "Pass",
    "HTTP status 200 in ~0.66s with PawJai Internal gate content.",
  ],
  [
    "2026-07-02",
    "/admin/ads",
    "Ads admin access control",
    "Opened live route directly without entering admin phrase.",
    "The actual Ads admin page rendered, including New Ad upload form and active server action payload.",
    "High",
    "HTTP status 200 showed PawJai Admin > Ads, All Ads (0), New Ad, Ad Image, Company Name, Click URL, dates, Active immediately, Upload Ad. This route bypasses the shared phrase gate in live production.",
  ],
  [
    "2026-07-02",
    "/admin/ads",
    "Ads create/update/delete write path",
    "Inspected current repo action code and live rendered form; did not upload or mutate production ads.",
    "Current repo protects actions with requireGlobalAdmin, but live page exposure should still be treated as a production access-control bug until deployed behavior is verified.",
    "High",
    "Live page exposes multipart form. Current app/admin/ads/actions.ts requires global admin; deployed bundle may differ from repo because live still uses old shared gate and /admin/login is missing.",
  ],
  [
    "2026-07-02",
    "/admin/audit",
    "Audit page",
    "Opened live route via HTTP.",
    "404 page returned.",
    "Medium",
    "Repo contains app/admin/audit/page.tsx and live Ads nav links to Audit, but production route is 404.",
  ],
  [
    "2026-07-02",
    "/admin/accounts",
    "Accounts page",
    "Opened live route via HTTP.",
    "404 page returned.",
    "Medium",
    "Repo contains app/admin/accounts/page.tsx and live Ads nav links to Accounts, but production route is 404.",
  ],
  [
    "2026-07-02",
    "/admin/login",
    "Admin Supabase login page",
    "Opened live route via HTTP.",
    "404 page returned.",
    "High",
    "Current repo admin-auth redirects unauthenticated admin users to /admin/login, but production /admin/login is 404. This indicates deployed auth/navigation mismatch.",
  ],
  [
    "2026-07-02",
    "Current repo vs production",
    "Admin auth implementation",
    "Compared live behavior to utils/admin-auth.ts.",
    "Production still presents old shared phrase gate, while current repo expects Supabase admin/shelter-admin auth and openAdminGate throws.",
    "High",
    "This mismatch explains missing /admin/login/accounts/audit on production and should be resolved before relying on current admin auth assumptions.",
  ],
  [
    "2026-07-02",
    "Coverage limitation",
    "Deep mutation features",
    "Avoided creating/deleting real ads or dog listings on production.",
    "No destructive production mutation performed.",
    "Info",
    "Need a staging environment or explicit QA fixtures for full create/edit/delete pass across dogs, bookings, ads, profile, accounts, and audit.",
  ],
];

const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getOrAdd("Admin Feature Audit");

sheet.showGridLines = false;
sheet.getRange("A1:G80").clear({ applyTo: "all" });
sheet.getRange("A1:G1").merge();
sheet.getRange("A1").values = [["PawJai Admin Feature Audit - 2026-07-02"]];
sheet.getRange("A1").format.fill.color = "#4f4338";
sheet.getRange("A1").format.font.color = "#ffffff";
sheet.getRange("A1").format.font.bold = true;
sheet.getRange("A1").format.font.size = 16;
sheet.getRange("A1").format.rowHeight = 28;

const tableRange = sheet.getRangeByIndexes(2, 0, rows.length, rows[0].length);
tableRange.values = rows;
tableRange.format.wrapText = true;
tableRange.format.font.size = 10;
tableRange.format.borders = { preset: "outside", style: "thin", color: "#d6c8ad" };

const header = sheet.getRange("A3:G3");
header.format.fill.color = "#d38a2c";
header.format.font.color = "#ffffff";
header.format.font.bold = true;
header.format.rowHeight = 32;

sheet.getRange("A:A").format.columnWidth = 13;
sheet.getRange("B:B").format.columnWidth = 24;
sheet.getRange("C:C").format.columnWidth = 26;
sheet.getRange("D:D").format.columnWidth = 40;
sheet.getRange("E:E").format.columnWidth = 42;
sheet.getRange("F:F").format.columnWidth = 13;
sheet.getRange("G:G").format.columnWidth = 58;
sheet.getRange("A4:G18").format.rowHeight = 60;
sheet.freezePanes.freezeRows(3);

for (let i = 4; i <= rows.length + 2; i += 1) {
  const severity = rows[i - 3]?.[5];
  if (severity === "High") {
    sheet.getRange(`F${i}`).format.fill.color = "#f7d8d5";
    sheet.getRange(`F${i}`).format.font.color = "#9a3129";
    sheet.getRange(`F${i}`).format.font.bold = true;
  } else if (severity === "Medium") {
    sheet.getRange(`F${i}`).format.fill.color = "#fff1dc";
    sheet.getRange(`F${i}`).format.font.color = "#9a6220";
    sheet.getRange(`F${i}`).format.font.bold = true;
  } else if (severity === "Pass") {
    sheet.getRange(`F${i}`).format.fill.color = "#eaf6df";
    sheet.getRange(`F${i}`).format.font.color = "#3f6f24";
    sheet.getRange(`F${i}`).format.font.bold = true;
  } else {
    sheet.getRange(`F${i}`).format.fill.color = "#eef2f7";
    sheet.getRange(`F${i}`).format.font.color = "#4b5563";
  }
}

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const auditPreview = await workbook.render({
  sheetName: "Admin Feature Audit",
  range: "A1:G18",
  scale: 1.5,
  format: "png",
});
await fs.writeFile(previewPath, new Uint8Array(await auditPreview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(workbookPath);
console.log(JSON.stringify({ workbookPath, previewPath, sheet: "Admin Feature Audit" }, null, 2));
