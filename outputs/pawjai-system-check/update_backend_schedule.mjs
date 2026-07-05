import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = "/Users/sudlabha/Downloads/pawjai_systems_check_2026-07-01.xlsx";
const previewDir = "/Users/sudlabha/Desktop/paw/outputs/pawjai-system-check/previews";

const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const sheet = workbook.worksheets.getOrAdd("Backend Fix Schedule");
try {
  sheet.getUsedRange().clear({ applyTo: "all" });
} catch {
  // The sheet can be brand new and empty.
}
sheet.showGridLines = false;

const generatedAt = "Updated 2026-07-02 18:28 AEST";
const rows = [
  ["Backend Fix Schedule", null, null, null, null, null, null, null, null, null],
  [generatedAt, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null],
  ["Item ID", "Area", "Type", "Priority", "Owner", "Target", "Status", "Fix Plan", "Verification", "Notes"],
  [
    "BCK-001",
    "Appointments / booking codes",
    "Database migration",
    "High",
    "Codex + user deploy approval",
    "Next production backend window",
    "Ready for approval",
    "Apply a targeted production schema repair for the existing 20260522000100_add_booking_qr_check_in.sql changes: booking_code, check-in fields, and active-slot indexes.",
    "Remote schema exposes appointments.booking_code; admin booking search by code works; QR/check-in fields can be selected/updated; migration history is reconciled after verification.",
    "Linked migration list shows most local migrations are not recorded remotely, so do not blindly bulk-push. Use targeted SQL/repair after backup.",
  ],
  [
    "BCK-002",
    "Messages / appointment list",
    "Backend compatibility",
    "Medium",
    "Codex",
    "This session",
    "Fixed in repo",
    "Added a shared appointment read helper that retries without booking_code if production is temporarily behind the migration.",
    "npm run typecheck passed; appointment/booking tests passed, including booking_code fallback coverage.",
    "This prevents user Messages from breaking while BCK-001 waits for production migration/deploy.",
  ],
  [
    "ADM-001",
    "Admin authentication",
    "Backend access control",
    "High",
    "User approval + Codex",
    "After approval",
    "Waiting for approval",
    "Deploy/enable current repo's Supabase role-based admin and shelter-admin login instead of relying on the shared pawjaiadmin phrase gate.",
    "Verify /admin/login loads, shelter admins see only assigned shelter data, and global admins can access platform pages.",
    "Production currently shows the old shared phrase gate; changing this affects staff login workflow.",
  ],
  [
    "ADM-002",
    "Admin route drift",
    "Deployment verification",
    "High",
    "Codex",
    "After admin auth deploy",
    "Waiting for production verification",
    "Confirm production has current /admin/login, /admin/accounts, /admin/audit, and protected /admin/ads behavior.",
    "HTTP/browser checks return the intended protected pages, not 404 or ungated forms.",
    "Repo has these routes; live production looked older during QA.",
  ],
  [
    "ADM-003",
    "Ads admin protection",
    "Backend access control",
    "High",
    "Codex",
    "This session / next deploy",
    "Fixed in repo; needs deploy verification",
    "Current repo guards Ads page/actions with global-admin checks.",
    "Unauthenticated production visit to /admin/ads should not render the upload form after deployment.",
    "No ad mutation was performed in production.",
  ],
  [
    "DOG-001",
    "Admin dog creation",
    "Backend/storage verification",
    "High",
    "Codex",
    "This session",
    "Backend verified; UX/UI deferred",
    "Production create/delete probe inserted a QA draft dog, uploaded fake image, linked dog_photos cover row, then deleted DB/storage records.",
    "Probe rows show all DB/storage steps passed and cleanup returned no remaining dog/photo rows.",
    "Remaining intermittent create-form submit timeout belongs in the deferred UX/UI/manual repro session.",
  ],
  [
    "DON-001",
    "Profile donor/subscription badges",
    "Future backend feature",
    "Medium",
    "User product approval + Codex",
    "Future session",
    "Waiting for approval",
    "If PawJai wants Top Donor/Premium badges, design the real donation/subscription tracking source of truth first.",
    "Badge appears only after real qualifying donation/subscription data exists.",
    "Current fix hides unearned badges; no fake badge logic remains.",
  ],
  [
    "UX-DEF-001",
    "Verification wizard / schedule timing / admin form click",
    "UX/UI deferred",
    "Medium",
    "User",
    "Later UX/UI session",
    "Deferred by request",
    "Leave mobile control overlap, schedule loading polish, and admin form submit repro to a later UX/UI pass.",
    "Manual browser repro and UI-specific acceptance criteria.",
    "Included here only so backend schedule does not lose the known deferred items.",
  ],
];

sheet.getRange("A1:J12").values = rows;
sheet.getRange("A1:J1").merge();
sheet.getRange("A2:J2").merge();
sheet.getRange("A1:J1").format = {
  fill: "#65584F",
  font: { bold: true, color: "#FFFFFF", size: 16 },
};
sheet.getRange("A2:J2").format = {
  fill: "#F5F1E8",
  font: { color: "#65584F", italic: true },
};
sheet.getRange("A4:J4").format = {
  fill: "#D6C8AD",
  font: { bold: true, color: "#4F4338" },
  wrapText: true,
};
sheet.getRange("A5:J12").format = {
  fill: "#FFFDF8",
  font: { color: "#4F4338" },
  wrapText: true,
};
sheet.getRange("A4:J12").format.borders = {
  insideHorizontal: { style: "thin", color: "#EADFCF" },
  insideVertical: { style: "thin", color: "#EADFCF" },
  top: { style: "thin", color: "#D6C8AD" },
  bottom: { style: "thin", color: "#D6C8AD" },
  left: { style: "thin", color: "#D6C8AD" },
  right: { style: "thin", color: "#D6C8AD" },
};
sheet.getRange("D5:D12").format = { font: { bold: true, color: "#7A4F1E" } };
sheet.getRange("G5:G12").format = { font: { bold: true, color: "#65584F" } };
sheet.getRange("A:A").format.columnWidth = 14;
sheet.getRange("B:B").format.columnWidth = 26;
sheet.getRange("C:C").format.columnWidth = 22;
sheet.getRange("D:D").format.columnWidth = 12;
sheet.getRange("E:E").format.columnWidth = 24;
sheet.getRange("F:F").format.columnWidth = 22;
sheet.getRange("G:G").format.columnWidth = 28;
sheet.getRange("H:H").format.columnWidth = 56;
sheet.getRange("I:I").format.columnWidth = 46;
sheet.getRange("J:J").format.columnWidth = 46;
sheet.getRange("A1:J12").format.verticalAlignment = "Top";
sheet.getRange("A4:J4").format.horizontalAlignment = "Center";
sheet.freezePanes.freezeRows(4);

const issues = workbook.worksheets.getItem("Issues");
const issuesValues = issues.getRange("A1:H9").values;
for (let rowIndex = 0; rowIndex < issuesValues.length; rowIndex += 1) {
  if (issuesValues[rowIndex][0] === "ISS-005") {
    issues.getRange(`B${rowIndex + 1}:C${rowIndex + 1}`).values = [[
      "Deferred UX/UI",
      "Schedule timing/loading behavior is being left for a later UX/UI session per user request.",
    ]];
  }
}

const scheduleInspect = await workbook.inspect({
  kind: "table",
  sheetId: "Backend Fix Schedule",
  range: "A1:J12",
  include: "values",
  tableMaxRows: 12,
  tableMaxCols: 10,
  maxChars: 5000,
});
console.log(scheduleInspect.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

await fs.mkdir(previewDir, { recursive: true });
const sheets = await workbook.inspect({ kind: "sheet", include: "name", maxChars: 4000 });
console.log(sheets.ndjson);
const preview = await workbook.render({
  sheetName: "Backend Fix Schedule",
  range: "A1:J12",
  scale: 1,
  format: "png",
});
await fs.writeFile(`${previewDir}/backend-fix-schedule.png`, new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(workbookPath);
console.log(`saved ${workbookPath}`);
