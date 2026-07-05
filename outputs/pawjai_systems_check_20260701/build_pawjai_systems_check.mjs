import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/sudlabha/Desktop/paw/outputs/pawjai_systems_check_20260701";
const workbook = Workbook.create();

const runMeta = {
  site: "https://www.pawjai.co.th/",
  runDate: "2026-07-01",
  tester: "Codex QA",
  environment: "Production site; fresh in-app tab plus isolated temporary Chrome context for final scheduling check",
  testEmail: "codex-pawjai-qa-1782895471164@example.com",
  dog: "วอน",
  dogId: "a6dc4fd9-bfa6-40bc-9bb7-d8a13b5f93cb",
  shelter: "The Voice Foundation",
};

const journeyRows = [
  ["1", "Setup", "Open fresh production homepage", "Homepage loads unauthenticated", "Loaded https://www.pawjai.co.th/ with dog feed", "Pass", "Info", "In-app browser fresh tab"],
  ["2", "Wishlist", "Click Save on first dog while signed out", "Prompt to sign in/up", "Auth modal opened with message: Sign in to save dogs to your wishlist", "Pass", "Info", "https://www.pawjai.co.th/"],
  ["3", "Auth", "Open create account from auth modal", "Create-account form appears", "Create account form with Email, Create password, Confirm password", "Pass", "Info", "User-facing UI"],
  ["4", "Auth", "Submit synthetic email signup", "Account created or verification instruction shown", "Verify email screen shown with verification link/code instructions", "Pass", "Info", "Expected email-verification gate"],
  ["5", "Auth", "QA bypass email confirmation", "Synthetic account can continue downstream QA", "Confirmed only the synthetic test user via Supabase admin", "Pass", "Info", "DB-assisted QA bypass"],
  ["6", "Auth", "Log in with verified synthetic account", "Modal closes and authenticated session starts", "Login succeeded after a short settle delay", "Pass", "Info", "User-facing UI"],
  ["7", "Wishlist", "Click Save while signed in", "Dog saves without auth prompt", "First Save control changed to Saved; profile wishlist later showed 1 dog", "Pass", "Info", "User-facing UI"],
  ["8", "Profile", "Open profile after signup/login", "Account state, verification prompt, wishlist visible", "Profile showed verification not started and saved dog วอน", "Pass", "Info", "https://www.pawjai.co.th/profile"],
  ["9", "Profile", "Inspect fresh-account badges", "Only earned/accurate badges display", "Fresh account displayed First Adopter, Top Donor, Premium User", "Fail", "Medium", "Profile page"],
  ["10", "Discovery", "Open filter/preferences", "Preference controls load", "Filter page loaded size, age, breed, temperament, friendliness, special-needs controls", "Pass", "Info", "https://www.pawjai.co.th/filter"],
  ["11", "Discovery", "Apply medium/mixed/activity/training preferences", "Filtered feed/results appear", "Returned to feed with a shorter result set; included Ridgeback dogs despite Mixed Breed selection", "Needs Review", "Medium", "Matching rules may be weighted rather than strict"],
  ["12", "Dog Detail", "Open first dog detail", "Dog profile shows details and CTAs", "Detail showed video, age/gender/size/weight, shelter, Verify to book, Treat", "Pass", "Info", "https://www.pawjai.co.th/dogs/a6dc4fd9-bfa6-40bc-9bb7-d8a13b5f93cb"],
  ["13", "Donations", "Open Treat modal on dog detail", "Donation/treat UI appears as overlay dialog", "Treat dialog opened with 1/2/3 treat options, Continue, Maybe later", "Pass", "Info", "Dialog role present; fixed overlay observed"],
  ["14", "Verification", "Open Verify to book", "Verification wizard explains required adopter info", "Documents wizard loaded Section A, status Not started, 4-section progress", "Pass", "Info", "https://www.pawjai.co.th/documents"],
  ["15", "Verification", "Fill Section A with synthetic data", "Continue advances to Section B", "Section A advanced to Section B after date was typed via DOM-assisted interaction", "Pass", "Info", "User-facing form plus automation fallback"],
  ["16", "Verification", "Continue Section B", "Selecting answers stays in wizard", "Automation attempt unexpectedly navigated to Appointments near lower controls/sticky nav; needs manual reproduction", "Needs Review", "Medium", "Could be automation-coordinate miss, not confirmed user bug"],
  ["17", "Verification", "QA-complete synthetic adopter profile", "Booking gate can be tested without real files", "Set only synthetic adopter to submitted with completed_at profile record", "Pass", "Info", "DB-assisted QA bypass; no real documents uploaded"],
  ["18", "Booking", "Open schedule entry for dog while signed in", "Verified user reaches calendar", "Schedule route showed Book a Visit for วอน at The Voice Foundation", "Pass", "Info", "Fresh isolated Chrome context"],
  ["19", "Booking", "Select available date", "Time slots appear", "July 1 showed 9:00, 10:00, 11:00, 1:00, 2:00, 3:00, 4:00", "Pass", "Info", "Fresh isolated Chrome context"],
  ["20", "Booking", "Select 9:00 and enter optional note", "Confirm Visit becomes enabled", "Confirm Visit enabled; final booking was not submitted to avoid live shelter notification", "Pass", "Info", "No final appointment created"],
];

const issueRows = [
  ["ISS-001", "Profile", "Fresh synthetic account displays Top Donor and Premium User badges immediately", "Medium", "Fail", "New users may see unearned trust/status badges, reducing credibility.", "Create new email account, log in, open Profile.", "Show only earned badges, or hide placeholder badges until backed by real account state."],
  ["ISS-002", "Filter", "Mixed Breed preference returned Ridgeback dogs in result set", "Medium", "Needs Review", "If filters are expected to be strict, users may distrust matching results.", "Filter: Medium size, Mixed Breed, Medium activity, Dogs still in training, then Show Dogs.", "Clarify whether filters are weighted preferences or strict filters; update copy/results accordingly."],
  ["ISS-003", "Verification", "Verification wizard lower controls were fragile in automation; one Section B attempt navigated to Appointments", "Medium", "Needs Review", "Could indicate sticky bottom nav overlap or automation-coordinate issue around lower wizard controls.", "After Section A, interact with Section B options near bottom of mobile viewport.", "Manual reproduction on mobile viewport; ensure bottom nav cannot intercept wizard controls."],
  ["ISS-004", "Verification/Auth", "Synthetic signup cannot continue without email code/link", "Info", "Expected", "This is expected production behavior but blocks synthetic QA without inbox/admin help.", "Create account with inaccessible test email.", "Keep as-is for production; provide documented QA test account or staging bypass for future runs."],
  ["ISS-005", "Booking", "First schedule pass selected a date before time slots appeared; retry succeeded", "Low", "Needs Review", "May be hydration/timing sensitivity in automated check; user impact unclear.", "After login redirect to schedule, immediately select first enabled date.", "Consider loading state or test manually on mobile network conditions."],
];

const dataRows = [
  ["Site", runMeta.site],
  ["Run date", runMeta.runDate],
  ["Tester", runMeta.tester],
  ["Environment", runMeta.environment],
  ["Synthetic test email", runMeta.testEmail],
  ["Selected dog", runMeta.dog],
  ["Dog ID", runMeta.dogId],
  ["Shelter", runMeta.shelter],
  ["Final booking submitted?", "No"],
  ["Reason final submit skipped", "Confirm Visit can notify a real shelter; stopped after button enabled."],
  ["Production DB changes made", "Synthetic auth user created/confirmed; adopter profile marked submitted/completed; wishlist saved วอน."],
];

const adminRows = [
  ["1", "Admin Access", "Open /admin/login on production", "Supabase admin/shelter-admin login from current repo is available", "Production returned 404 for /admin/login", "Fail", "High", "https://www.pawjai.co.th/admin/login"],
  ["2", "Admin Access", "Open /admin on production", "Admin workspace entry appears", "Older shared Admin phrase gate appeared: PAWJAI INTERNAL / Unlock the dog onboarding workspace", "Pass", "Info", "https://www.pawjai.co.th/admin"],
  ["3", "Admin Access", "Unlock live admin phrase gate", "Admin workspace opens", "Shared phrase gate unlocked and showed Create dog, Manage listings, Bookings, Ads, About content", "Pass", "Info", "Live production UI"],
  ["4", "Admin Access", "Compare live admin model to repo model", "Production matches current Supabase role-based admin/shelter-admin code", "Production is still on older phrase-cookie admin gate; current repo uses Supabase profiles.role and shelter_users", "Fail", "High", "Repo vs live behavior"],
  ["5", "QA Data", "Create temporary QA shelter and shelter admin fixture", "Synthetic data isolates admin tests from real shelter data", "Created QA Shelter 1782896841423 and linked temporary shelter-admin account; later cleaned up", "Pass", "Info", "Supabase service-role QA setup"],
  ["6", "Dog Creation", "Fill draft dog profile in live admin UI", "Staff can enter dog core fields and matching traits", "Created QA Draft Dog 1782896841423 as Draft under the QA shelter", "Pass", "Info", "https://www.pawjai.co.th/admin"],
  ["7", "Dog Creation", "Set hidden radio-card fields via automation", "Choice cards are reliably selectable", "Direct Playwright check on sr-only radio did not change state; DOM event fallback worked", "Needs Review", "Low", "Size / matching card controls"],
  ["8", "Listings", "Open Manage listings after creating dog", "Draft dog appears under its shelter and stays out of public feed", "QA draft dog appeared under QA Shelter with DRAFT status; public feed queries only available dogs", "Pass", "Info", "https://www.pawjai.co.th/admin/listings"],
  ["9", "Booking Data", "Create synthetic requested appointment for QA dog", "Appointment insert supports current generated schema", "Remote appointments table rejected booking_code column; legacy insert without booking_code succeeded", "Needs Review", "High", "Supabase schema cache"],
  ["10", "Bookings", "Open admin bookings for QA shelter", "Requested booking is visible with adopter, dog, shelter, date/time and actions", "Booking APT-A5448 appeared with Accept booking / Deny booking / Ask to change date/time", "Pass", "Info", "https://www.pawjai.co.th/admin/bookings"],
  ["11", "Bookings", "Accept synthetic requested booking", "Booking status updates to confirmed", "UI changed from REQUESTED/Awaiting decision to CONFIRMED/Accepted", "Pass", "Info", "Live admin booking action"],
  ["12", "Bookings", "Verify accepted appointment in database", "Database status is confirmed", "Appointment a5448767-ade6-48a1-bceb-5ec5b6d38cd7 status = confirmed", "Pass", "Info", "Supabase verification query"],
  ["13", "Cleanup", "Remove temporary QA admin records", "No synthetic shelter/admin/dog/booking remains", "Deleted QA shelter cascade, synthetic profile, and auth user; remaining shelter/profile checks returned null", "Pass", "Info", "Supabase cleanup"],
];

const adminIssueRows = [
  ["ADM-001", "Admin Access", "Production admin uses shared phrase gate rather than current Supabase admin/shelter-admin login", "High", "Fail", "No per-shelter role scoping on live admin; anyone with phrase sees all shelters and platform admin links.", "Open /admin on production.", "Deploy or restore the Supabase role-based admin login and shelter_users scoping."],
  ["ADM-002", "Deployment Drift", "/admin/login and /admin/accounts return 404 on production while routes exist in repo", "High", "Fail", "Staff/admin documentation may point to routes that do not exist live; current repo and production are out of sync.", "Open /admin/login or /admin/accounts on pawjai.co.th.", "Confirm deployed commit/build and push current admin routes after resolving Next 16 server-action issue."],
  ["ADM-003", "Database Schema", "Remote appointments table lacks booking_code even though generated local types/actions reference it", "High", "Needs Review", "Some booking UI has fallback formatting, but schema drift can break inserts, search, QR/check-in, or admin workflows.", "Insert appointment with booking_code or inspect remote schema cache.", "Apply missing booking/appointment migrations and regenerate types from remote schema."],
  ["ADM-004", "Dog Creation", "Hidden radio-card controls resisted standard Playwright check()", "Low", "Needs Review", "May indicate less robust accessibility/testability for custom card controls, though visible UI still worked with fallback.", "Try checking input[name=size][value=medium] directly.", "Consider explicit labels/ids or test ids for choice-card controls."],
];

function addTitle(sheet, title, subtitle, width) {
  sheet.showGridLines = false;
  const endCol = String.fromCharCode("A".charCodeAt(0) + width - 1);
  sheet.getRange(`A1:${endCol}1`).merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange(`A2:${endCol}2`).merge();
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange(`A1:${endCol}2`).format = {
    fill: "#4F4338",
    font: { bold: true, color: "#FFFFFF" },
  };
  sheet.getRange("A2").format.font = { bold: false, color: "#F5F1E8" };
}

function styleHeader(range) {
  range.format = {
    fill: "#D38A2C",
    font: { bold: true, color: "#FFFFFF" },
    wrapText: true,
  };
}

function addStatusFormatting(sheet, rangeAddress) {
  const range = sheet.getRange(rangeAddress);
  range.conditionalFormats.add("containsText", {
    text: "Pass",
    format: { fill: "#DDEFE4", font: { color: "#1F6B3A" } },
  });
  range.conditionalFormats.add("containsText", {
    text: "Fail",
    format: { fill: "#F8D7DA", font: { color: "#8A1F2D" } },
  });
  range.conditionalFormats.add("containsText", {
    text: "Needs Review",
    format: { fill: "#FFF3CD", font: { color: "#7A5B00" } },
  });
}

const summary = workbook.worksheets.add("Summary");
addTitle(summary, "PAWJAI Systems Check", "User journey QA: signup, wishlist, discovery, verification gate, and booking readiness", 7);
summary.getRange("A4:B10").values = [
  ["Metric", "Value"],
  ["Journey steps", journeyRows.length],
  ["Passed", journeyRows.filter((r) => r[5] === "Pass").length],
  ["Failed", journeyRows.filter((r) => r[5] === "Fail").length],
  ["Needs review", journeyRows.filter((r) => r[5] === "Needs Review").length],
  ["Final appointment submitted", "No"],
  ["Overall result", "Core journey works through booking readiness; issues noted for profile badges, filter clarity, and verification wizard manual follow-up."],
];
styleHeader(summary.getRange("A4:B4"));
summary.getRange("A4:B10").format.borders = { preset: "outside", style: "thin", color: "#CDBFAF" };
summary.getRange("A10:B10").format = { fill: "#F5F1E8", font: { bold: true, color: "#4F4338" }, wrapText: true };
summary.getRange("A12:G17").values = [
  ["Top Finding", "Area", "Severity", "Status", "Impact", "Recommendation", "Issue ID"],
  [issueRows[0][2], issueRows[0][1], issueRows[0][3], issueRows[0][4], issueRows[0][5], issueRows[0][7], issueRows[0][0]],
  [issueRows[1][2], issueRows[1][1], issueRows[1][3], issueRows[1][4], issueRows[1][5], issueRows[1][7], issueRows[1][0]],
  [issueRows[2][2], issueRows[2][1], issueRows[2][3], issueRows[2][4], issueRows[2][5], issueRows[2][7], issueRows[2][0]],
  [issueRows[4][2], issueRows[4][1], issueRows[4][3], issueRows[4][4], issueRows[4][5], issueRows[4][7], issueRows[4][0]],
  ["Booking stopped before live appointment submission", "Booking", "Info", "Intentional", "Avoided sending a real shelter notification.", "Submit only after explicit production-test approval.", "NOTE"],
];
styleHeader(summary.getRange("A12:G12"));
addStatusFormatting(summary, "D13:D17");
summary.getRange("A12:G17").format.wrapText = true;
summary.getRange("A4:B10").format.wrapText = true;
summary.freezePanes.freezeRows(12);

const journey = workbook.worksheets.add("Journey Log");
addTitle(journey, "Journey Log", "Step-by-step observed behavior from the QA walkthrough", 8);
journey.getRange("A4:H4").values = [["#", "Area", "Step", "Expected", "Actual", "Status", "Severity", "Evidence"]];
journey.getRange(`A5:H${4 + journeyRows.length}`).values = journeyRows;
styleHeader(journey.getRange("A4:H4"));
journey.getRange(`A4:H${4 + journeyRows.length}`).format.wrapText = true;
journey.getRange(`A4:H${4 + journeyRows.length}`).format.borders = { preset: "outside", style: "thin", color: "#CDBFAF" };
addStatusFormatting(journey, `F5:F${4 + journeyRows.length}`);
journey.freezePanes.freezeRows(4);

const issues = workbook.worksheets.add("Issues");
addTitle(issues, "Issues & Follow-Ups", "Problems, risks, and open questions discovered during the walkthrough", 8);
issues.getRange("A4:H4").values = [["Issue ID", "Area", "Finding", "Severity", "Status", "Impact", "Reproduction", "Recommendation"]];
issues.getRange(`A5:H${4 + issueRows.length}`).values = issueRows;
styleHeader(issues.getRange("A4:H4"));
issues.getRange(`A4:H${4 + issueRows.length}`).format.wrapText = true;
issues.getRange(`A4:H${4 + issueRows.length}`).format.borders = { preset: "outside", style: "thin", color: "#CDBFAF" };
addStatusFormatting(issues, `E5:E${4 + issueRows.length}`);
issues.freezePanes.freezeRows(4);

const admin = workbook.worksheets.add("Admin Log");
addTitle(admin, "Admin / Shelter Admin Log", "Production admin journey QA: access, dog creation, listings, booking approval, cleanup", 8);
admin.getRange("A4:H4").values = [["#", "Area", "Step", "Expected", "Actual", "Status", "Severity", "Evidence"]];
admin.getRange(`A5:H${4 + adminRows.length}`).values = adminRows;
styleHeader(admin.getRange("A4:H4"));
admin.getRange(`A4:H${4 + adminRows.length}`).format.wrapText = true;
admin.getRange(`A4:H${4 + adminRows.length}`).format.borders = { preset: "outside", style: "thin", color: "#CDBFAF" };
addStatusFormatting(admin, `F5:F${4 + adminRows.length}`);
admin.freezePanes.freezeRows(4);

const adminIssueStart = 7 + adminRows.length;
admin.getRange(`A${adminIssueStart}:H${adminIssueStart}`).values = [["Issue ID", "Area", "Finding", "Severity", "Status", "Impact", "Reproduction", "Recommendation"]];
admin.getRange(`A${adminIssueStart + 1}:H${adminIssueStart + adminIssueRows.length}`).values = adminIssueRows;
styleHeader(admin.getRange(`A${adminIssueStart}:H${adminIssueStart}`));
admin.getRange(`A${adminIssueStart}:H${adminIssueStart + adminIssueRows.length}`).format.wrapText = true;
admin.getRange(`A${adminIssueStart}:H${adminIssueStart + adminIssueRows.length}`).format.borders = { preset: "outside", style: "thin", color: "#CDBFAF" };
addStatusFormatting(admin, `E${adminIssueStart + 1}:E${adminIssueStart + adminIssueRows.length}`);

const data = workbook.worksheets.add("Test Data");
addTitle(data, "Test Data & Scope", "Synthetic data and scope boundaries used in production-safe QA", 3);
data.getRange("A4:B4").values = [["Field", "Value"]];
data.getRange(`A5:B${4 + dataRows.length}`).values = dataRows;
styleHeader(data.getRange("A4:B4"));
data.getRange(`A4:B${4 + dataRows.length}`).format.wrapText = true;
data.getRange(`A4:B${4 + dataRows.length}`).format.borders = { preset: "outside", style: "thin", color: "#CDBFAF" };

for (const sheet of [summary, journey, issues, data]) {
  const used = sheet.getUsedRange();
  used.format.autofitColumns();
  used.format.autofitRows();
}

summary.getRange("A:A").format.columnWidth = 24;
summary.getRange("B:B").format.columnWidth = 80;
summary.getRange("A12:A17").format.columnWidth = 38;
summary.getRange("B12:D17").format.columnWidth = 18;
summary.getRange("E12:F17").format.columnWidth = 48;
summary.getRange("G12:G17").format.columnWidth = 14;
summary.getRange("A13:G17").format.rowHeight = 64;
journey.getRange("A:A").format.columnWidth = 8;
journey.getRange("B:B").format.columnWidth = 18;
journey.getRange("C:D").format.columnWidth = 34;
journey.getRange("E:E").format.columnWidth = 46;
journey.getRange("F:G").format.columnWidth = 16;
journey.getRange("H:H").format.columnWidth = 32;
journey.getRange(`A5:H${4 + journeyRows.length}`).format.rowHeight = 54;
issues.getRange("A:A").format.columnWidth = 14;
issues.getRange("B:B").format.columnWidth = 18;
issues.getRange("C:C").format.columnWidth = 44;
issues.getRange("D:E").format.columnWidth = 16;
issues.getRange("F:H").format.columnWidth = 46;
issues.getRange(`A5:H${4 + issueRows.length}`).format.rowHeight = 72;
admin.getRange("A:A").format.columnWidth = 8;
admin.getRange("B:B").format.columnWidth = 18;
admin.getRange("C:D").format.columnWidth = 34;
admin.getRange("E:E").format.columnWidth = 50;
admin.getRange("F:G").format.columnWidth = 16;
admin.getRange("H:H").format.columnWidth = 34;
admin.getRange(`A5:H${4 + adminRows.length}`).format.rowHeight = 58;
admin.getRange(`A${adminIssueStart}:A${adminIssueStart + adminIssueRows.length}`).format.columnWidth = 14;
admin.getRange(`C${adminIssueStart}:H${adminIssueStart + adminIssueRows.length}`).format.columnWidth = 38;
admin.getRange(`A${adminIssueStart + 1}:H${adminIssueStart + adminIssueRows.length}`).format.rowHeight = 74;
data.getRange("A:A").format.columnWidth = 28;
data.getRange("B:B").format.columnWidth = 90;

await fs.mkdir(outputDir, { recursive: true });
for (const sheetName of ["Summary", "Journey Log", "Issues", "Admin Log", "Test Data"]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(`${outputDir}/${sheetName.replaceAll(" ", "_").toLowerCase()}_preview.png`, new Uint8Array(await preview.arrayBuffer()));
}

const errorScan = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "formula error scan",
});
console.log(errorScan.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/pawjai_systems_check_2026-07-01.xlsx`);
console.log(`${outputDir}/pawjai_systems_check_2026-07-01.xlsx`);
