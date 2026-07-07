import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = "/Users/sudlabha/Desktop/paw/outputs/admin-transfer-tracker-20260705/pawjai-admin-transfer-tracker.xlsx";
const outputDir = "/Users/sudlabha/Desktop/paw/outputs/admin-transfer-tracker-20260705";

const headerFill = "#4f4338";
const headerFont = "#ffffff";
const subHeaderFill = "#fff3df";
const lightFill = "#fffdfa";
const greenFill = "#eaf6df";
const yellowFill = "#fff1dc";
const redFill = "#ffe8e3";
const borderColor = "#eadfce";

function safeGetSheet(workbook, name) {
  try {
    return workbook.worksheets.getItem(name);
  } catch {
    return workbook.worksheets.add(name);
  }
}

function clearSheet(sheet) {
  try {
    const used = sheet.getUsedRange();
    if (used) used.clear({ applyTo: "all" });
  } catch {
    // New blank sheet.
  }
  try {
    sheet.deleteAllDrawings();
  } catch {
    // Not all imported sheets expose drawings.
  }
}

function styleTitle(range) {
  range.format.fill = headerFill;
  range.format.font = { bold: true, color: headerFont, size: 16 };
  range.format.wrapText = true;
}

function styleHeader(range) {
  range.format.fill = headerFill;
  range.format.font = { bold: true, color: headerFont };
  range.format.wrapText = true;
  range.format.borders = { preset: "outside", style: "thin", color: borderColor };
}

function styleTable(range) {
  range.format.fill = lightFill;
  range.format.wrapText = true;
  range.format.borders = { preset: "inside", style: "thin", color: borderColor };
}

function styleStatusCell(cell, status) {
  const normalized = String(status).toLowerCase();
  if (normalized.includes("done") || normalized.includes("live") || normalized.includes("shared")) {
    cell.format.fill = greenFill;
    cell.format.font = { color: "#2f6b33", bold: true };
  } else if (normalized.includes("partial") || normalized.includes("in progress")) {
    cell.format.fill = yellowFill;
    cell.format.font = { color: "#8a5825", bold: true };
  } else {
    cell.format.fill = redFill;
    cell.format.font = { color: "#9a3129", bold: true };
  }
}

function writeSheet(sheet, title, subtitle, headers, rows, widths) {
  clearSheet(sheet);
  sheet.showGridLines = false;

  const columnCount = headers.length;
  const titleRange = sheet.getRangeByIndexes(0, 0, 1, columnCount);
  titleRange.values = [[title, ...Array.from({ length: columnCount - 1 }, () => "")]];
  styleTitle(titleRange);

  const subtitleRange = sheet.getRangeByIndexes(1, 0, 1, columnCount);
  subtitleRange.values = [[subtitle, ...Array.from({ length: columnCount - 1 }, () => "")]];
  subtitleRange.format.fill = subHeaderFill;
  subtitleRange.format.font = { color: "#5b4d40", italic: true };
  subtitleRange.format.wrapText = true;

  const headerRange = sheet.getRangeByIndexes(3, 0, 1, columnCount);
  headerRange.values = [headers];
  styleHeader(headerRange);

  const tableRange = sheet.getRangeByIndexes(4, 0, rows.length, columnCount);
  tableRange.values = rows;
  styleTable(tableRange);

  rows.forEach((row, index) => {
    const statusIndex = headers.findIndex((header) => header.toLowerCase().includes("status"));
    if (statusIndex >= 0) {
      styleStatusCell(sheet.getCell(4 + index, statusIndex), row[statusIndex]);
    }
  });

  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, rows.length + 4, 1).format.columnWidth = width;
  });
  sheet.getRangeByIndexes(0, 0, rows.length + 4, columnCount).format.autofitRows();
  sheet.freezePanes.freezeRows(4);
}

const routeRows = [
  ["Old production admin", "/admin", "/admin", "Legacy active", "Current live admin remains usable until /admindraft fully replaces it", "Do not delete until every workflow is verified in /admindraft and /shelter"],
  ["PawJai umbrella dashboard", "/admin", "/admindraft", "Moved / live", "PawJai HQ sees all shelters, dogs, bookings, ads, and about content", "Keep as the admin umbrella; do not make shelter staff use this route"],
  ["Shelter login", "not separated before", "/shelter", "Moved / live", "Username/password login for partner shelters", "Always redirect shelter users here when not signed in"],
  ["Shelter workspace", "/admindraft view-as-shelter", "/shelter/[slug]", "Moved / live", "Shelter-only workspace with profile, dog listings, create dog, bookings, messaging, account settings", "Must never expose PawJai umbrella"],
  ["Shelter account settings", "none", "/shelter/[slug]/settings", "Moved / live", "Change shelter username, email, and password through real Supabase Auth + shelter_portal_accounts", "Shared-login pilot only; later replace with employee accounts"],
  ["Dog listings inside shelter", "/admindraft?view=dogs", "/shelter/[slug]?view=dogs", "Moved / live", "Shelter can search and filter its own dogs", "Open public dog profile is allowed to go to /dogs/[id]"],
  ["Create dog", "/admindraft/dog-creation?shelter=:id", "/shelter/[slug]/dogs/new", "Moved / live", "Reuses same live dog create form and buckets", "Exit/success returns to /shelter/[slug]?view=dogs"],
  ["Edit dog", "/admindraft/dogs/[id]/edit", "/shelter/[slug]/dogs/[id]/edit", "Moved / live", "Reuses same live dog edit form, photos, traits, and storage", "Dog must belong to logged-in shelter"],
  ["Public dog profile", "/dogs/[id]", "/dogs/[id]", "Shared exception", "Public adopter-facing profile", "Only allowed cross-over from shelter portal to public UX"],
  ["Booking list", "/admindraft?view=bookings", "/shelter/[slug]?view=bookings", "Moved / live", "Shelter booking list remains inside shelter workspace", "Links open shared /booking detail with safe returnTo"],
  ["Booking detail", "/admindraft/bookings/[id]", "/booking/[id]", "Shared route live", "Single internal booking detail page for PawJai admin and linked shelter", "No new SQL table; reads same appointments/adopters/dogs/shelters"],
  ["Visitor profile / verification", "/admindraft/bookings/[id]/visitor-profile", "/booking/[id]/visitor-profile", "Shared route live", "Single internal visitor profile and verification document page", "Back links use safe returnTo"],
  ["QR check-in", "/admindraft/bookings/check-in", "/booking/check-in", "Shared route live", "QR token resolves to shared booking detail", "Generated QR URLs now use /booking/check-in"],
  ["Messaging", "/admindraft shelter workspace", "/shelter/[slug]?view=messages", "Pending", "Messaging is intentionally not completed in this session", "Plan separately with API/provider choice"],
  ["Ads", "/admin/ads", "/admindraft > Ads", "Admin-only", "PawJai-managed ads remain inside admin umbrella", "No brand login yet"],
  ["About content", "/admin/pawjaiprofile", "/admindraft > About content", "Admin-only", "PawJai public content management", "Not visible to shelters"],
];

const connectionRows = [
  ["PawJai admin opens booking", "/admindraft?view=bookings", "/booking/[id]?returnTo=/admindraft?view=bookings", "/admindraft?view=bookings", "Safe", "Admin keeps umbrella context"],
  ["Old admin scans QR during migration", "/admin/bookings", "/booking/check-in?returnTo=/admin/bookings", "/admin/bookings or /booking/[id]", "Safe", "Allowed for global admin only while old admin stays live"],
  ["Shelter opens booking", "/shelter/[slug]?view=bookings", "/booking/[id]?returnTo=/shelter/[slug]?view=bookings", "/shelter/[slug]?view=bookings", "Safe", "Shelter cannot leak into /admindraft"],
  ["PawJai admin opens visitor profile", "/booking/[id]", "/booking/[id]/visitor-profile?returnTo=/admindraft...", "/booking/[id] or /admindraft...", "Safe", "Shared page preserves admin return path"],
  ["Shelter opens visitor profile", "/booking/[id]", "/booking/[id]/visitor-profile?returnTo=/shelter/[slug]...", "/booking/[id] or /shelter/[slug]...", "Safe", "Shared page preserves shelter return path"],
  ["Shelter creates dog", "/shelter/[slug]", "/shelter/[slug]/dogs/new", "/shelter/[slug]?view=dogs", "Safe", "Same create action, shelter-specific route shell"],
  ["Shelter edits dog", "/shelter/[slug]?view=dogs", "/shelter/[slug]/dogs/[id]/edit", "/shelter/[slug]?view=dogs", "Safe", "Server checks dog.shelter_id before rendering"],
  ["PawJai admin edits dog", "/admindraft?view=dogs", "/admindraft/dogs/[id]/edit", "/admindraft?view=dogs", "Safe", "Admin keeps admin route context"],
  ["Shelter opens public dog profile", "/shelter/[slug]?view=dogs", "/dogs/[id]", "Browser back or public page controls", "Allowed exception", "This is intentionally the adopter-facing dog profile"],
  ["QR scanner from shelter", "/shelter/[slug]?view=bookings", "/booking/check-in?returnTo=/shelter/[slug]?view=bookings", "/booking/[id]?returnTo=/shelter/[slug]...", "Safe", "QR resolves into shared booking route"],
  ["Expired shelter session", "any /shelter deep workflow", "/shelter", "/shelter", "Safe", "Shelter should log in through shelter portal, not admin login"],
  ["Unsafe edited returnTo", "manually edited URL", "shared booking route", "role-based fallback", "Guarded", "External URLs and wrong-lane return paths are ignored"],
];

const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

writeSheet(
  safeGetSheet(workbook, "Route Migration Map"),
  "PAWJAI Admin → Shelter → Booking Route Migration Map",
  "Tracks what has moved from old /admin to /admindraft, what now belongs under /shelter, and what is shared through /booking.",
  ["Workflow", "Old / current source", "New canonical route", "Status", "What it does", "Notes / next step"],
  routeRows,
  [28, 32, 36, 18, 48, 54],
);

writeSheet(
  safeGetSheet(workbook, "Lane Connections"),
  "PAWJAI Route Lane Connections",
  "Shows how admin, shelter, booking, and public dog-profile pages should connect without leaking shelter staff into PawJai admin.",
  ["Scenario", "Starts at", "Deep route opened", "Back / exit returns to", "Safety status", "Why it works"],
  connectionRows,
  [30, 34, 46, 40, 18, 54],
);

const routePreview = await workbook.render({ sheetName: "Route Migration Map", range: "A1:F19", scale: 1 });
await fs.writeFile(`${outputDir}/route-migration-map-preview.png`, new Uint8Array(await routePreview.arrayBuffer()));
const connectionPreview = await workbook.render({ sheetName: "Lane Connections", range: "A1:F16", scale: 1 });
await fs.writeFile(`${outputDir}/lane-connections-preview.png`, new Uint8Array(await connectionPreview.arrayBuffer()));

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
  summary: "formula error scan",
});
console.log(errors.ndjson || "no formula errors");

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(workbookPath);
console.log(`updated ${workbookPath}`);
