import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/sudlabha/Desktop/paw/outputs/pawjai-change-log-20260702";
const outputPath = path.join(outputDir, "PAWJAI-change-log-and-fix-schedule-2026-07-02.xlsx");

const workbook = Workbook.create();

const colors = {
  title: "#4F4338",
  titleText: "#FFFFFF",
  accent: "#D38A2C",
  accentLight: "#FFF2DF",
  pale: "#FFF8EE",
  border: "#E7DBC8",
  text: "#4F4338",
  muted: "#74685D",
  done: "#DFF3E6",
  progress: "#FFF2CC",
  next: "#E8F1FF",
  risk: "#FCE4E4",
};

const statuses = ["Done", "In Progress", "Scheduled", "Manual", "Blocked", "Watch"];
const priorities = ["P0", "P1", "P2", "P3"];
const owners = ["Codex", "Sudlabha", "Supabase Dashboard", "Future Pass"];

function styleTitle(sheet, rangeAddress, title, subtitle) {
  const titleRange = sheet.getRange(rangeAddress);
  titleRange.merge();
  titleRange.values = [[title]];
  titleRange.format.fill = { color: colors.title };
  titleRange.format.font = { color: colors.titleText, bold: true, size: 18 };
  titleRange.format.wrapText = true;
  titleRange.format.rowHeight = 34;

  const subtitleCell = sheet.getRange("A2");
  subtitleCell.values = [[subtitle]];
  sheet.getRange("A2:H2").merge();
  subtitleCell.format.fill = { color: colors.pale };
  subtitleCell.format.font = { color: colors.muted, italic: true, size: 11 };
  subtitleCell.format.wrapText = true;
  subtitleCell.format.rowHeight = 30;
}

function styleHeader(range) {
  range.format.fill = { color: colors.accent };
  range.format.font = { color: "#FFFFFF", bold: true };
  range.format.wrapText = true;
  range.format.borders = { preset: "outside", style: "thin", color: colors.accent };
}

function styleBody(range) {
  range.format.font = { color: colors.text, size: 10 };
  range.format.wrapText = true;
  range.format.borders = { preset: "inside", style: "thin", color: colors.border };
}

function addValidation(sheet, address, values) {
  void sheet;
  void address;
  void values;
}

function applyStatusFormatting(sheet, address) {
  void sheet;
  void address;
}

function styleStatusCells(sheet, rows, startRow, statusColumnIndex) {
  rows.forEach((row, offset) => {
    const status = row[statusColumnIndex];
    const cell = sheet.getRangeByIndexes(startRow + offset, statusColumnIndex, 1, 1);
    if (status === "Done") {
      cell.format.fill = { color: colors.done };
      cell.format.font = { color: "#24543A", bold: true };
    } else if (status === "In Progress") {
      cell.format.fill = { color: colors.progress };
      cell.format.font = { color: "#765A00", bold: true };
    } else if (status === "Scheduled" || status === "Watch") {
      cell.format.fill = { color: colors.next };
      cell.format.font = { color: "#284C7E", bold: true };
    } else if (status === "Manual" || status === "Blocked") {
      cell.format.fill = { color: colors.risk };
      cell.format.font = { color: "#7A2929", bold: true };
    }
  });
}

function setWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, 1, 1).format.columnWidth = width;
  });
}

const completedRows = [
  ["Security", "Replaced passphrase admin gate", "Moved admin access from passphrase/cookie to Supabase Auth role checks.", "Done", "P0", "Codex", new Date("2026-06-15"), "utils/admin-auth.ts, app/admin/login/page.tsx"],
  ["Security", "Added role model", "Added admin, shelter_admin, and adopter role support through profiles and shelter_users.", "Done", "P0", "Codex", new Date("2026-06-15"), "types/database.ts, utils/admin-authorization.ts"],
  ["Security", "Scoped shelter admins", "Shelter admins can manage only linked shelter records; global admins keep full workspace access.", "Done", "P0", "Codex", new Date("2026-06-15"), "app/admin/bookings, app/admin/dogs"],
  ["Admin UX", "Redesigned admin login", "Created a shared admin/shelter login screen with email and password fields.", "Done", "P1", "Codex", new Date("2026-06-15"), "app/admin/login/page.tsx"],
  ["Admin UX", "Added account management", "Global admins can create/revoke global and shelter admin accounts from the admin UI.", "Done", "P1", "Codex", new Date("2026-06-15"), "app/admin/accounts"],
  ["Security", "Added audit logging", "Admin actions now write audit events; admins can review /admin/audit.", "Done", "P1", "Codex", new Date("2026-06-15"), "utils/admin-audit.ts, app/admin/audit"],
  ["Security", "Added DB-backed rate limiting", "Rate limits added to auth, admin login, bookings, documents, donations, and appointment messages.", "Done", "P1", "Codex", new Date("2026-06-15"), "utils/rate-limit.ts"],
  ["Backend", "Applied targeted Supabase migrations", "Created audit events, rate-limit buckets, booking guard index, and advisor security fixes.", "Done", "P0", "Codex", new Date("2026-06-15"), "supabase/migrations/2026061512*.sql"],
  ["Security", "Reduced Supabase advisor issues", "Set function search_path and removed broad public storage listing policies.", "Done", "P1", "Codex", new Date("2026-06-15"), "20260615124500_supabase_advisor_security_fixes.sql"],
  ["Agent System", "Added agent map and playbooks", "Added stable docs for future Codex/Claude work to reduce context and token waste.", "Done", "P2", "Codex", new Date("2026-06-15"), "docs/agent-map.md, docs/playbooks"],
  ["Cleanup", "Removed duplicate files", "Deleted stale duplicate page/test/client files and corrupt build artifacts.", "Done", "P2", "Codex", new Date("2026-06-15"), "app/messages/page 2.tsx, duplicate tests/utils"],
  ["Next.js", "Moved middleware to proxy", "Replaced deprecated middleware.ts with proxy.ts for Next 16 compatibility.", "Done", "P1", "Codex", new Date("2026-06-15"), "proxy.ts"],
  ["Verification", "Added verify workflow", "Repo now has one command for typecheck, tests, lint, and high-severity audit.", "Done", "P1", "Codex", new Date("2026-06-15"), "package.json"],
];

const scheduleRows = [
  [1, "Enable leaked password protection", "Turn on leaked password protection in Supabase Auth dashboard.", "Manual", "P0", "Supabase Dashboard", new Date("2026-07-02"), new Date("2026-07-02"), "Required dashboard setting; code cannot safely toggle it here.", "Not Started"],
  [2, "Create first global admin", "Create/confirm one real PawJai global admin account, then retire passphrase habit entirely.", "Manual", "P0", "Sudlabha", new Date("2026-07-02"), new Date("2026-07-03"), "Needed before using /admin/accounts smoothly.", "Not Started"],
  [3, "Create shared shelter admins", "Use /admin/accounts to create one shared shelter_admin account per shelter.", "Manual", "P0", "Sudlabha", new Date("2026-07-03"), new Date("2026-07-05"), "Use strong passwords and rotate when staff changes.", "Not Started"],
  [4, "Review admin flows with real data", "Log in as global admin and shelter admin; verify dogs, bookings, audit, accounts, ads permissions.", "Scheduled", "P1", "Codex", new Date("2026-07-05"), new Date("2026-07-06"), "Requires valid admin credentials.", "Not Started"],
  [5, "Reconcile Supabase migration history", "Fix remote/local migration drift so future supabase db push is safe again.", "Scheduled", "P1", "Future Pass", new Date("2026-07-06"), new Date("2026-07-08"), "Do carefully; avoid replaying old migrations against live schema.", "Not Started"],
  [6, "Run Supabase advisors again", "Capture current security/performance warnings after manual settings and migrations.", "Scheduled", "P1", "Codex", new Date("2026-07-08"), new Date("2026-07-08"), "Use advisors output as source of truth.", "Not Started"],
  [7, "Tune RLS performance warnings", "Replace repeated auth calls in policies with initplan-friendly patterns where advisor recommends.", "Scheduled", "P2", "Future Pass", new Date("2026-07-09"), new Date("2026-07-11"), "Backend performance hardening; not a launch blocker.", "Not Started"],
  [8, "Clean duplicate index warning", "Inspect and drop safe duplicate index reported by Supabase advisors.", "Scheduled", "P2", "Future Pass", new Date("2026-07-11"), new Date("2026-07-11"), "Verify index names and usage before dropping.", "Not Started"],
  [9, "Convert key img tags to next/image", "Address the 20 lint warnings by converting highest-traffic images first.", "Scheduled", "P2", "Codex", new Date("2026-07-12"), new Date("2026-07-13"), "Performance polish; verify responsive sizing visually.", "Not Started"],
  [10, "Watch moderate Next/PostCSS advisory", "Track Next release path; avoid npm audit fix --force because it suggests unsafe downgrade.", "Watch", "P2", "Future Pass", new Date("2026-07-14"), new Date("2026-07-14"), "Recheck after Next update.", "Watching"],
  [11, "Commit changes in chunks", "Review dirty worktree and commit admin/security/docs changes separately from newer UX work.", "Scheduled", "P1", "Sudlabha", new Date("2026-07-02"), new Date("2026-07-04"), "Important before deployment or handoff.", "Not Started"],
  [12, "Deployment smoke test", "After account setup and commits, run production build/deploy smoke checks on admin and user routes.", "Scheduled", "P1", "Codex", new Date("2026-07-14"), new Date("2026-07-15"), "Use real environment variables and route checks.", "Not Started"],
];

const riskRows = [
  ["Supabase migration drift", "Remote migration history does not match local migrations; db push could replay old SQL.", "High", "Use targeted SQL until reconciled; schedule migration-history cleanup.", "Scheduled", "Future Pass"],
  ["Dashboard-only security setting", "Leaked password protection still needs manual enabling.", "High", "Enable in Supabase Auth dashboard.", "Manual", "Supabase Dashboard"],
  ["Shared shelter accounts", "Shared credentials reduce per-person traceability.", "Medium", "Use one account per shelter only if needed; rotate password when staff changes; audit events still log account-level actions.", "Manual", "Sudlabha"],
  ["Moderate dependency advisory", "Next currently pulls a vulnerable PostCSS range according to npm audit.", "Medium", "Do not force downgrade; watch patched Next release path.", "Watch", "Future Pass"],
  ["Image performance warnings", "20 img warnings remain; not failing verification but can affect LCP/bandwidth.", "Low", "Convert priority pages to next/image.", "Scheduled", "Codex"],
];

const summary = workbook.worksheets.add("Summary");
summary.showGridLines = false;
styleTitle(summary, "A1:H1", "PAWJAI Change Log & Fix Schedule", "Generated 2026-07-02. Tracks completed security/backend work, remaining risks, and the next implementation schedule.");
summary.getRange("A4:H4").values = [["Metric", "Value", "Notes", "", "Status Mix", "Count", "Priority Mix", "Count"]];
styleHeader(summary.getRange("A4:H4"));
summary.getRange("A5:C10").values = [
  ["Completed changes logged", null, "Rows in Change Log marked Done"],
  ["Scheduled/manual tasks", null, "Rows in Schedule"],
  ["Open risks", null, "Rows in Open Risks"],
  ["Last full verification", "2026-07-02", "npm run verify passed: typecheck, 68 tests, lint 0 errors, high audit gate"],
  ["Known lint warnings", 20, "next/no-img-element warnings only"],
  ["Known dependency advisory", "Moderate", "PostCSS via Next; do not force-fix downgrade"],
];
summary.getRange("B5").formulas = [["=COUNTIF('Change Log'!D5:D60,\"Done\")"]];
summary.getRange("B6").formulas = [["=COUNTA('Schedule'!A5:A60)"]];
summary.getRange("B7").formulas = [["=COUNTA('Open Risks'!A5:A40)"]];
summary.getRange("E5:F10").values = statuses.slice(0, 6).map((status) => [status, null]);
summary.getRange("F5:F10").formulas = statuses.slice(0, 6).map((status) => [`=COUNTIF('Schedule'!D5:D60,"${status}")`]);
summary.getRange("G5:H8").values = priorities.map((priority) => [priority, null]);
summary.getRange("H5:H8").formulas = priorities.map((priority) => [`=COUNTIF('Schedule'!E5:E60,"${priority}")`]);
styleBody(summary.getRange("A5:H10"));
summary.getRange("A12:H12").values = [["Today’s answer", "", "", "", "", "", "", ""]];
summary.getRange("A12:H12").merge();
summary.getRange("A12").format.fill = { color: colors.accentLight };
summary.getRange("A12").format.font = { bold: true, color: colors.text };
summary.getRange("A13:H16").merge(true);
summary.getRange("A13:H16").values = [
  ["The core vulnerable admin gate work is complete and verified. The remaining work is setup and hardening: enable leaked-password protection, create real admin accounts, reconcile Supabase migration history, tune remaining advisor warnings, convert key images to next/image, and commit/deploy in clean chunks."],
  [""],
  [""],
  [""],
];
summary.getRange("A13:H16").format.fill = { color: colors.pale };
summary.getRange("A13:H16").format.wrapText = true;
summary.getRange("A13:H16").format.font = { color: colors.text };
summary.getRange("A1:H16").format.borders = { preset: "outside", style: "thin", color: colors.border };
setWidths(summary, [24, 18, 52, 4, 18, 12, 16, 12]);

const changeLog = workbook.worksheets.add("Change Log");
changeLog.showGridLines = false;
styleTitle(changeLog, "A1:H1", "Completed Changes", "What has already been changed or fixed in the PAWJAI system.");
changeLog.getRange("A4:H4").values = [["Area", "Change/Fix", "Details", "Status", "Priority", "Owner", "Date", "Files / Notes"]];
styleHeader(changeLog.getRange("A4:H4"));
changeLog.getRangeByIndexes(4, 0, completedRows.length, 8).values = completedRows;
styleBody(changeLog.getRangeByIndexes(4, 0, completedRows.length, 8));
changeLog.getRange(`G5:G${4 + completedRows.length}`).setNumberFormat("yyyy-mm-dd");
addValidation(changeLog, `D5:D${4 + completedRows.length}`, statuses);
addValidation(changeLog, `E5:E${4 + completedRows.length}`, priorities);
addValidation(changeLog, `F5:F${4 + completedRows.length}`, owners);
applyStatusFormatting(changeLog, `D5:D${4 + completedRows.length}`);
styleStatusCells(changeLog, completedRows, 4, 3);
changeLog.freezePanes.freezeRows(4);
setWidths(changeLog, [18, 30, 58, 16, 12, 18, 14, 42]);

const schedule = workbook.worksheets.add("Schedule");
schedule.showGridLines = false;
styleTitle(schedule, "A1:J1", "Next-Step Schedule", "Use this tab as the active checklist. Update Status and Actual Status as work moves.");
schedule.getRange("A4:J4").values = [["Step", "Task", "Description", "Status", "Priority", "Owner", "Start", "Target", "Notes / Dependencies", "Actual Status"]];
styleHeader(schedule.getRange("A4:J4"));
schedule.getRangeByIndexes(4, 0, scheduleRows.length, 10).values = scheduleRows;
styleBody(schedule.getRangeByIndexes(4, 0, scheduleRows.length, 10));
schedule.getRange(`G5:H${4 + scheduleRows.length}`).setNumberFormat("yyyy-mm-dd");
addValidation(schedule, `D5:D${4 + scheduleRows.length}`, statuses);
addValidation(schedule, `E5:E${4 + scheduleRows.length}`, priorities);
addValidation(schedule, `F5:F${4 + scheduleRows.length}`, owners);
addValidation(schedule, `J5:J${4 + scheduleRows.length}`, ["Not Started", "Watching", "In Progress", "Done", "Blocked"]);
applyStatusFormatting(schedule, `D5:D${4 + scheduleRows.length}`);
styleStatusCells(schedule, scheduleRows, 4, 3);
schedule.freezePanes.freezeRows(4);
setWidths(schedule, [8, 30, 58, 16, 12, 22, 14, 14, 54, 18]);

const risks = workbook.worksheets.add("Open Risks");
risks.showGridLines = false;
styleTitle(risks, "A1:F1", "Open Risks & Watch Items", "Remaining vulnerabilities, operational risks, and what to do about them.");
risks.getRange("A4:F4").values = [["Risk", "Why It Matters", "Severity", "Mitigation", "Status", "Owner"]];
styleHeader(risks.getRange("A4:F4"));
risks.getRangeByIndexes(4, 0, riskRows.length, 6).values = riskRows;
styleBody(risks.getRangeByIndexes(4, 0, riskRows.length, 6));
addValidation(risks, `C5:C${4 + riskRows.length}`, ["High", "Medium", "Low"]);
addValidation(risks, `E5:E${4 + riskRows.length}`, statuses);
addValidation(risks, `F5:F${4 + riskRows.length}`, owners);
applyStatusFormatting(risks, `E5:E${4 + riskRows.length}`);
styleStatusCells(risks, riskRows, 4, 4);
risks.freezePanes.freezeRows(4);
setWidths(risks, [30, 58, 14, 58, 16, 22]);

for (const sheet of [summary, changeLog, schedule, risks]) {
  const used = sheet.getUsedRange();
  used.format.autofitRows();
}

await fs.mkdir(outputDir, { recursive: true });

const summaryInspect = await workbook.inspect({
  kind: "table",
  sheetId: "Summary",
  range: "A1:H16",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 10,
  maxChars: 5000,
});
console.log(summaryInspect.ndjson);

const errorScan = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
  maxChars: 2000,
});
console.log(errorScan.ndjson);

for (const sheetName of ["Summary", "Change Log", "Schedule", "Open Risks"]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  const bytes = new Uint8Array(await preview.arrayBuffer());
  await fs.writeFile(path.join(outputDir, `${sheetName.replaceAll(" ", "-").toLowerCase()}-preview.png`), bytes);
  console.log(`rendered ${sheetName}: ${bytes.length} bytes`);
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
