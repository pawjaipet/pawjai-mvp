import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const outputDir = "/Users/sudlabha/Desktop/paw/outputs/pawjai_systems_check_20260701";
const workbookPath = `${outputDir}/pawjai_systems_check_2026-07-01.xlsx`;
const downloadsPath = "/Users/sudlabha/Downloads/pawjai_systems_check_2026-07-01.xlsx";
const previewPath = `${outputDir}/fix_status_preview.png`;

const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

function styleStatusCell(range, status) {
  range.format.font.bold = true;
  if (status === "Fixed") {
    range.format.fill.color = "#eaf6df";
    range.format.font.color = "#3f6f24";
  } else if (status === "Still needs fixing") {
    range.format.fill.color = "#f7d8d5";
    range.format.font.color = "#9a3129";
  } else if (status === "Waiting for approval") {
    range.format.fill.color = "#fff1dc";
    range.format.font.color = "#9a6220";
  } else {
    range.format.fill.color = "#eef2f7";
    range.format.font.color = "#4b5563";
  }
}

function applyStatusColumns(sheetName, headerRow, statusByArea) {
  const sheet = workbook.worksheets.getItem(sheetName);
  const usedRange = sheet.getUsedRange(true);
  const usedValues = usedRange.values;
  const headerValues = usedValues[headerRow - 1] ?? [];
  const existingFixStatusIndex = headerValues.findIndex((value) => String(value ?? "").trim() === "Fix Status");
  const firstEmptyHeaderIndex = headerValues.findIndex((value) => !String(value ?? "").trim());
  const statusColIndex = existingFixStatusIndex >= 0
    ? existingFixStatusIndex
    : firstEmptyHeaderIndex >= 0
      ? firstEmptyHeaderIndex
      : headerValues.length;
  const notesColIndex = statusColIndex + 1;

  sheet.getCell(headerRow - 1, statusColIndex).values = [["Fix Status"]];
  sheet.getCell(headerRow - 1, notesColIndex).values = [["Fix Notes"]];
  const headerRange = sheet.getRangeByIndexes(headerRow - 1, statusColIndex, 1, 2);
  headerRange.format.fill.color = "#d38a2c";
  headerRange.format.font.color = "#ffffff";
  headerRange.format.font.bold = true;
  headerRange.format.wrapText = true;
  headerRange.format.borders = { preset: "outside", style: "thin", color: "#d6c8ad" };

  for (let rowIndex = headerRow; rowIndex < usedValues.length; rowIndex += 1) {
    const row = usedValues[rowIndex] ?? [];
    const text = row.map((value) => String(value ?? "")).join(" ").toLowerCase();
    if (!text.trim()) continue;

    let status = "Waiting for approval";
    let note = "Needs product/admin confirmation or production deployment before closing.";

    for (const item of statusByArea) {
      if (item.match.every((needle) => text.includes(needle))) {
        status = item.status;
        note = item.note;
        break;
      }
    }

    const statusCell = sheet.getCell(rowIndex, statusColIndex);
    statusCell.values = [[status]];
    styleStatusCell(statusCell, status);
    sheet.getCell(rowIndex, notesColIndex).values = [[note]];
  }

  const statusRange = sheet.getRangeByIndexes(headerRow - 1, statusColIndex, Math.max(1, usedValues.length - headerRow + 1), 2);
  statusRange.format.wrapText = true;
  statusRange.format.borders = { preset: "outside", style: "thin", color: "#d6c8ad" };
  sheet.getRangeByIndexes(0, statusColIndex, 1, 1).format.columnWidth = 20;
  sheet.getRangeByIndexes(0, notesColIndex, 1, 1).format.columnWidth = 58;
}

applyStatusColumns("Issues", 1, [
  {
    match: ["top donor"],
    status: "Fixed",
    note: "Hardcoded profile badges removed. First Adopter now derives from completed appointment plus adopted dog status; Top Donor/Premium stay hidden until real backend tracking exists.",
  },
  {
    match: ["premium"],
    status: "Fixed",
    note: "Hardcoded profile badges removed. Premium no longer appears for fresh accounts because no subscription backend exists yet.",
  },
  {
    match: ["ridgeback"],
    status: "Fixed",
    note: "Breed matcher now handles Mixed Breed/mix variants without matching named Ridgeback breeds. Regression tests added.",
  },
  {
    match: ["verification"],
    status: "Waiting for approval",
    note: "Verification behavior is product/process flow, not a backend-only fix. Needs approval on whether manual follow-up is acceptable.",
  },
  {
    match: ["schedule"],
    status: "Still needs fixing",
    note: "No code change made in this pass. Needs separate browser repro for hydration/timing before a safe backend-only fix.",
  },
]);

applyStatusColumns("Admin Feature Audit", 3, [
  {
    match: ["/admin/ads", "access control"],
    status: "Fixed",
    note: "Local repo protects /admin/ads with requireGlobalAdmin. Production still needs deployment verification.",
  },
  {
    match: ["/admin/ads", "write path"],
    status: "Fixed",
    note: "Local repo server actions requireGlobalAdmin before create/toggle/delete/update. Production still needs deployment verification.",
  },
  {
    match: ["/admin/audit"],
    status: "Fixed",
    note: "Local repo contains /admin/audit page. Production 404 should resolve after deploy/migrations.",
  },
  {
    match: ["/admin/accounts"],
    status: "Fixed",
    note: "Local repo contains /admin/accounts page guarded by requireGlobalAdmin. Production 404 should resolve after deploy/migrations.",
  },
  {
    match: ["/admin/login"],
    status: "Fixed",
    note: "Local repo contains /admin/login Supabase admin sign-in page. Production 404 should resolve after deploy.",
  },
  {
    match: ["auth implementation"],
    status: "Fixed",
    note: "Local repo now uses Supabase admin/shelter-admin auth; shared phrase code path is replaced locally. Production still needs deploy.",
  },
  {
    match: ["create dog submit interaction"],
    status: "Still needs fixing",
    note: "No backend-only fix made. Needs a fresh manual/browser repro because the failure was an automation actionability timeout.",
  },
  {
    match: ["manage listings route"],
    status: "Waiting for approval",
    note: "HTTP returned quickly and route exists locally. Needs production redeploy and manual browser retest.",
  },
  {
    match: ["deep mutation features"],
    status: "Waiting for approval",
    note: "Requires explicit approval/staging fixture before creating/deleting production records.",
  },
]);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const preview = await workbook.render({
  sheetName: "Admin Feature Audit",
  range: "A1:I18",
  scale: 1.25,
  format: "png",
});
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(workbookPath);
await fs.copyFile(workbookPath, downloadsPath);
console.log(JSON.stringify({ workbookPath, downloadsPath, previewPath }, null, 2));
