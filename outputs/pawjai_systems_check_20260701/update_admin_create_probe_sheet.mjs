import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const outputDir = "/Users/sudlabha/Desktop/paw/outputs/pawjai_systems_check_20260701";
const workbookPath = `${outputDir}/pawjai_systems_check_2026-07-01.xlsx`;
const downloadsPath = "/Users/sudlabha/Downloads/pawjai_systems_check_2026-07-01.xlsx";
const logPath = `${outputDir}/qa_admin_create_dog_probe_log.json`;
const previewPath = `${outputDir}/admin_create_probe_preview.png`;

const log = JSON.parse(await fs.readFile(logPath, "utf8"));
const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getOrAdd("Admin Create Probe");

sheet.showGridLines = false;
sheet.getRange("A1:H80").clear({ applyTo: "all" });

sheet.getRange("A2:E2").values = [["Admin Create Dog Probe - QA-Codex Production Test", "", "", "", ""]];
sheet.getRange("A2:E2").format.fill.color = "#4f4338";
sheet.getRange("A2:E2").format.font.color = "#ffffff";
sheet.getRange("A2:E2").format.font.bold = true;
sheet.getRange("A2:E2").format.font.size = 16;
sheet.getRange("A2:E2").format.rowHeight = 30;

const summaryRows = [
  ["Run Status", "Backend/storage create-delete passed; live UI repro blocked by in-app browser control timeouts."],
  ["Started", `'${log.startedAt}`],
  ["Ended", `'${log.endedAt}`],
  ["QA Dog Name", log.dogName],
  ["Created Dog ID", log.createdDogId],
  ["Created Photo ID", log.createdPhotoId],
  ["Storage Path", log.storagePath],
  ["Cleanup", `Dog deleted: ${log.cleanup?.deletedDogId ? "yes" : "no"}; storage removed: ${log.cleanup?.removedStoragePath ? "yes" : "no"}`],
  ["Fix Status", "Still needs UI fixing"],
  ["Fix Notes", "Production database/storage path works. Remaining issue is the intermittent live admin form submit/UI path; needs manual browser repro or a stable browser session."],
];

sheet.getRangeByIndexes(3, 0, summaryRows.length, 2).values = summaryRows;
sheet.getRange("A4:A13").format.fill.color = "#fff1dc";
sheet.getRange("A4:A13").format.font.bold = true;
sheet.getRange("A4:B13").format.wrapText = true;
sheet.getRange("A4:B13").format.borders = { preset: "outside", style: "thin", color: "#d6c8ad" };
sheet.getRange("A:A").format.columnWidth = 24;
sheet.getRange("B:B").format.columnWidth = 90;

const stepHeader = [["Step", "OK", "Timestamp", "Result / Evidence", "Error"]];
const stepRows = (log.steps ?? []).map((step) => [
  step.name,
  step.ok ? "Pass" : "Fail",
  `'${step.at}`,
  step.result ? JSON.stringify(step.result) : "",
  step.error ?? "",
]);
sheet.getRangeByIndexes(15, 0, 1, 5).values = stepHeader;
sheet.getRange("A16:E16").format.fill.color = "#d38a2c";
sheet.getRange("A16:E16").format.font.color = "#ffffff";
sheet.getRange("A16:E16").format.font.bold = true;
if (stepRows.length) {
  sheet.getRangeByIndexes(16, 0, stepRows.length, 5).values = stepRows;
  sheet.getRangeByIndexes(16, 0, stepRows.length, 5).format.wrapText = true;
  sheet.getRangeByIndexes(16, 0, stepRows.length, 5).format.rowHeight = 62;
  for (let index = 0; index < stepRows.length; index += 1) {
    const statusCell = sheet.getCell(16 + index, 1);
    statusCell.format.fill.color = stepRows[index][1] === "Pass" ? "#eaf6df" : "#f7d8d5";
    statusCell.format.font.color = stepRows[index][1] === "Pass" ? "#3f6f24" : "#9a3129";
    statusCell.format.font.bold = true;
  }
}
sheet.getRange("A16:E26").format.borders = { preset: "outside", style: "thin", color: "#d6c8ad" };
sheet.getRange("C:C").format.columnWidth = 24;
sheet.getRange("D:D").format.columnWidth = 86;
sheet.getRange("E:E").format.columnWidth = 36;
sheet.freezePanes.freezeRows(16);

const audit = workbook.worksheets.getItem("Admin Feature Audit");
const auditValues = audit.getUsedRange(true).values;
for (let rowIndex = 0; rowIndex < auditValues.length; rowIndex += 1) {
  const rowText = (auditValues[rowIndex] ?? []).map((value) => String(value ?? "")).join(" ").toLowerCase();
  if (rowText.includes("create dog submit interaction")) {
    audit.getCell(rowIndex, 7).values = [["Still needs UI fixing"]];
    audit.getCell(rowIndex, 7).format.fill.color = "#f7d8d5";
    audit.getCell(rowIndex, 7).format.font.color = "#9a3129";
    audit.getCell(rowIndex, 7).format.font.bold = true;
    audit.getCell(rowIndex, 8).values = [[
      "2026-07-02 probe: production DB/storage create-delete passed and cleanup completed. In-app browser control timed out before UI submit repro, so the remaining issue is specifically the live admin UI submit path.",
    ]];
    break;
  }
}

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const preview = await workbook.render({
  sheetName: "Admin Create Probe",
  range: "A1:E26",
  scale: 1.25,
  format: "png",
});
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(workbookPath);
await fs.copyFile(workbookPath, downloadsPath);
console.log(JSON.stringify({ workbookPath, downloadsPath, previewPath }, null, 2));
