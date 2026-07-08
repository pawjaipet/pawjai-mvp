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
const blueFill = "#e9f2ff";
const brownFill = "#f6efe6";
const orangeFill = "#f8dfb8";
const pinkFill = "#f7e3e1";

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
  if (
    normalized.includes("done")
    || normalized.includes("live")
    || normalized.includes("shared")
    || normalized.includes("safe")
    || normalized.includes("ready")
    || normalized.includes("verified")
  ) {
    cell.format.fill = greenFill;
    cell.format.font = { color: "#2f6b33", bold: true };
  } else if (
    normalized.includes("partial")
    || normalized.includes("in progress")
    || normalized.includes("manual")
    || normalized.includes("guarded")
    || normalized.includes("watch")
  ) {
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
  titleRange.merge();
  titleRange.values = [[title]];
  styleTitle(titleRange);

  const subtitleRange = sheet.getRangeByIndexes(1, 0, 1, columnCount);
  subtitleRange.merge();
  subtitleRange.values = [[subtitle]];
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

function writeCard(cell, title, body, fill = lightFill) {
  cell.values = [[`${title}\n${body}`]];
  cell.format.fill = fill;
  cell.format.font = { bold: true, color: "#4f4338" };
  cell.format.wrapText = true;
  cell.format.borders = { preset: "outside", style: "thin", color: borderColor };
  cell.format.rowHeight = 104;
}

function writeArrow(cell, label = "flows to") {
  cell.values = [[`->\n${label}`]];
  cell.format.fill = "#ffffff";
  cell.format.font = { bold: true, color: "#b77624" };
  cell.format.wrapText = true;
}

function styleNoteRange(range) {
  range.format.fill = subHeaderFill;
  range.format.font = { color: "#5b4d40" };
  range.format.wrapText = true;
  range.format.borders = { preset: "outside", style: "thin", color: borderColor };
}

function writeDiagramHeader(sheet, title, subtitle, columns = 8) {
  clearSheet(sheet);
  sheet.showGridLines = false;
  const titleRange = sheet.getRangeByIndexes(0, 0, 1, columns);
  titleRange.merge();
  titleRange.values = [[title]];
  styleTitle(titleRange);
  const subtitleRange = sheet.getRangeByIndexes(1, 0, 1, columns);
  subtitleRange.merge();
  subtitleRange.values = [[subtitle]];
  subtitleRange.format.fill = subHeaderFill;
  subtitleRange.format.font = { color: "#5b4d40", italic: true };
  subtitleRange.format.wrapText = true;
}

function writeDbSyncDiagram(sheet) {
  writeDiagramHeader(
    sheet,
    "PAWJAI Live Data Sync Diagram",
    "Different route shells, same Supabase database, same storage bucket, same shared form/actions.",
    8,
  );

  const widths = [34, 10, 34, 10, 36, 10, 38, 38];
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, 22, 1).format.columnWidth = width;
  });

  sheet.getRange("A4:H4").values = [[
    "Interface lane",
    "",
    "Shared code",
    "",
    "Live data layer",
    "",
    "Updated surfaces",
    "Sync rule",
  ]];
  styleHeader(sheet.getRange("A4:H4"));

  const rows = [
    {
      row: 5,
      interface: "Admin dog edit\n/admindraft/dogs/[id]/edit\nPawJai umbrella can edit any permitted shelter dog",
      code: "DogEditForm\nupdateDogProfileAction\nreturnTo=/admindraft/dogs/[id]/edit",
      data: "Supabase tables\ndogs, dog_photos, dog_traits, shelters\nStorage bucket: dog-photos",
      surfaces: "/admindraft dog listings\n/shelter dog listings\n/dogs/[id] public profile",
      rule: "Same dog.id. No duplicate dog record. Navigation/refresh shows latest data on both sides.",
      fill: blueFill,
    },
    {
      row: 8,
      interface: "Shelter dog edit\n/shelter/[slug]/dogs/[id]/edit\nShelter shell is scoped to that shelter only",
      code: "DogEditForm\nupdateDogProfileAction\nserver checks dog.shelter_id before render",
      data: "Same Supabase rows and same media bucket as admin dog edit",
      surfaces: "/shelter/[slug]?view=dogs\n/admindraft?shelter=:id&view=dogs\n/dogs/[id]",
      rule: "Editing here changes the same live PawJai listing that admin sees.",
      fill: greenFill,
    },
    {
      row: 11,
      interface: "Dog creation\n/admindraft/dog-creation?shelter=:id\n/shelter/[slug]/dogs/new",
      code: "DogListingForm\ncreateDogProfileAction\nsuccessListingsHref controls exit lane",
      data: "Creates dogs row\nCreates dog_photos rows\nUploads to dog-photos bucket",
      surfaces: "Admin all dogs\nShelter own dogs\nPublic dog profile when available",
      rule: "Both create flows insert into the same production tables; route only changes who can choose shelter.",
      fill: orangeFill,
    },
    {
      row: 14,
      interface: "Booking list and detail\n/admindraft?view=bookings\n/shelter/[slug]?view=bookings\n/booking/[id]",
      code: "ShelterBookingsTab\ndecideBookingAction\ncheckInBookingAction\nsafeBookingReturnTo",
      data: "appointments, adopters, dogs, shelters\nadopter_documents for verification view",
      surfaces: "Admin booking list\nShelter booking list\nShared /booking detail/profile",
      rule: "Single appointment record. Decisions and QR check-ins revalidate admin, shelter, shared booking, and adopter appointment views.",
      fill: brownFill,
    },
    {
      row: 17,
      interface: "Shelter profile/calendar\n/admindraft selected shelter\n/shelter/[slug]?view=profile",
      code: "updateShelterProfileAction\nupdateShelterOperatingDaysAction\ncreate/delete blockouts",
      data: "shelters\nshelter_regular_hours\nshelter_availability",
      surfaces: "Shelter profile card\nBooking availability\nAdmin selected shelter profile",
      rule: "Same shelter.id; route-specific returnTo keeps staff out of PawJai admin lane.",
      fill: pinkFill,
    },
  ];

  for (const item of rows) {
    writeCard(sheet.getCell(item.row - 1, 0), item.interface, "", item.fill);
    writeArrow(sheet.getCell(item.row - 1, 1));
    writeCard(sheet.getCell(item.row - 1, 2), item.code, "", "#ffffff");
    writeArrow(sheet.getCell(item.row - 1, 3), "reads/writes");
    writeCard(sheet.getCell(item.row - 1, 4), item.data, "", yellowFill);
    writeArrow(sheet.getCell(item.row - 1, 5), "revalidates");
    writeCard(sheet.getCell(item.row - 1, 6), item.surfaces, "", greenFill);
    writeCard(sheet.getCell(item.row - 1, 7), item.rule, "", "#fffaf3");
  }

  const noteRange = sheet.getRange("A20:H20");
  noteRange.merge();
  noteRange.values = [[
    "See Architecture Advice sheet for the longer advisory: keep route shells separate, keep data/actions shared, and add Supabase Realtime later only if instant open-tab updates become important.",
  ]];
  styleNoteRange(noteRange);
}

function writeRouteFlowDiagram(sheet) {
  writeDiagramHeader(
    sheet,
    "PAWJAI Route Flow and Lane Separation",
    "Deep pages can be shared only when the return path is validated. Shelter staff should never land in the PawJai admin umbrella.",
    8,
  );

  const widths = [32, 10, 32, 10, 34, 10, 34, 40];
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, 24, 1).format.columnWidth = width;
  });
  sheet.getRange("A4:H4").values = [["Lane start", "", "Workspace list", "", "Deep workflow", "", "Back/exit", "Guardrail"]];
  styleHeader(sheet.getRange("A4:H4"));

  const rows = [
    {
      row: 5,
      start: "PawJai admin\n/admindraft\nphrase gate",
      list: "/admindraft?shelter=:id&view=dogs\n/admindraft?view=bookings",
      deep: "/admindraft/dogs/[id]/edit\n/booking/[id]?returnTo=/admindraft...",
      back: "/admindraft?shelter=:id&view=dogs\n/admindraft?view=bookings",
      guard: "Admin can see umbrella; booking returnTo accepts /admindraft for global admin.",
      fill: blueFill,
    },
    {
      row: 9,
      start: "Shelter staff\n/shelter login\nSupabase account",
      list: "/shelter/[slug]?view=profile\n/shelter/[slug]?view=dogs\n/shelter/[slug]?view=bookings",
      deep: "/shelter/[slug]/dogs/[id]/edit\n/booking/[id]?returnTo=/shelter/[slug]...",
      back: "/shelter/[slug]?view=dogs\n/shelter/[slug]?view=bookings",
      guard: "Server checks shelter membership and dog.shelter_id. Wrong-lane returnTo falls back to shelter portal.",
      fill: greenFill,
    },
    {
      row: 13,
      start: "Shared booking route\n/booking/[id]\n/booking/[id]/visitor-profile",
      list: "Opened from admin or shelter list",
      deep: "safeBookingReturnTo(requestedReturnTo)\ncanAccessShelter(context, shelter_id)",
      back: "Returns to allowed /admindraft or /shelter path only",
      guard: "External URLs, // paths, and wrong role/lane return paths are ignored.",
      fill: orangeFill,
    },
    {
      row: 17,
      start: "Public dog profile exception",
      list: "/shelter/[slug]?view=dogs\n/admindraft?view=dogs",
      deep: "/dogs/[id]",
      back: "Browser back or public navigation",
      guard: "This is the one intentional crossover into adopter-facing UX.",
      fill: pinkFill,
    },
  ];

  for (const item of rows) {
    writeCard(sheet.getCell(item.row - 1, 0), item.start, "", item.fill);
    writeArrow(sheet.getCell(item.row - 1, 1));
    writeCard(sheet.getCell(item.row - 1, 2), item.list, "", "#ffffff");
    writeArrow(sheet.getCell(item.row - 1, 3), "opens");
    writeCard(sheet.getCell(item.row - 1, 4), item.deep, "", yellowFill);
    writeArrow(sheet.getCell(item.row - 1, 5), "returns");
    writeCard(sheet.getCell(item.row - 1, 6), item.back, "", greenFill);
    writeCard(sheet.getCell(item.row - 1, 7), item.guard, "", "#fffaf3");
  }
}

async function writeDiagramGallery(workbook, sheet, images) {
  clearSheet(sheet);
  sheet.showGridLines = false;
  const galleryTitle = sheet.getRange("A1:H1");
  galleryTitle.merge();
  galleryTitle.values = [["Embedded PNG diagram gallery"]];
  styleTitle(galleryTitle);
  const galleryNote = sheet.getRange("A2:H2");
  galleryNote.merge();
  galleryNote.values = [["These images are generated from the workbook's diagram sheets. Future Codex sessions can read the underlying diagram sheets as text/tables and view these snapshots visually."]];
  styleNoteRange(galleryNote);
  const codexNote = sheet.getRange("A3:H3");
  codexNote.merge();
  codexNote.values = [["Codex note: if a workbook renderer does not display embedded drawings, use the DB Sync Diagram and Route Flow Diagram sheets as the readable source, or regenerate the PNG previews with workbook-build/update-route-tabs.mjs."]];
  styleNoteRange(codexNote);
  [22, 22, 22, 22, 22, 22, 22, 22].forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, 44, 1).format.columnWidth = width;
  });
  sheet.getRange("A5:H5").values = [["DB Sync Diagram snapshot", "", "", "", "Route Flow Diagram snapshot", "", "", ""]];
  styleHeader(sheet.getRange("A5:H5"));

  for (const { file, anchor, widthPx, heightPx } of images) {
    const bytes = await fs.readFile(file);
    const dataUrl = `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
    sheet.images.add({
      dataUrl,
      anchor: {
        from: anchor,
        extent: { widthPx, heightPx },
      },
    });
  }
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

const backBehaviorRows = [
  ["Browser back", "Browser toolbar / trackpad / keyboard", "Any page", "Uses browser history exactly as the browser recorded it", "Auth guards still protect restricted routes, but browser history can feel confusing if the user arrived from a different lane.", "Use as fallback only; do not rely on it for shelter staff training.", "Manual / watch"],
  ["App Back / Exit link", "Visible Back, Exit, Booking list, Dog listings buttons", "/shelter/[slug]/dogs/[id]/edit, /admindraft/dogs/[id]/edit, /booking/[id]", "Hard-coded route for that lane: /shelter/[slug]?view=dogs, /admindraft?... or bookingListHref", "Deterministic and role-aware. Best UX for shelter staff.", "Primary path for training and QA.", "Ready"],
  ["Form returnTo", "Hidden form input submitted with save/delete/profile/calendar forms", "Dog create/edit, shelter profile, calendar, booking decisions", "Server action redirects to returnTo only when it starts with allowed prefixes.", "Keeps saved workflows inside the same lane after mutation.", "Keep adding returnTo whenever a form is reused across admin/shelter.", "Ready"],
  ["Shared booking returnTo", "Query param on /booking routes", "/booking/[id], /booking/[id]/visitor-profile", "safeBookingReturnTo validates /admindraft for global admin, /shelter/[slug] for shelter admin, /admin/bookings for legacy admin only.", "Blocks wrong-lane or external return URLs.", "This is the core fix for booking deep-page leaks.", "Verified"],
  ["QR check-in return", "QR scanner link includes returnTo", "/booking/check-in", "Valid token redirects to /booking/[id]?token=...&returnTo=...; invalid token shows card with Back to booking list.", "Shelter session expires to /shelter; admin can return to admin lane.", "Smoke test on a real phone before shelter pilot.", "Manual / watch"],
  ["Public dog profile exception", "Open public profile button", "/dogs/[id]", "No internal returnTo; use browser back/public navigation.", "This is intentionally adopter-facing and public.", "Only exception where shelter portal may leave private UI.", "Allowed exception"],
  ["Expired shelter session", "User opens deep shelter/booking route after logout", "/shelter/[slug]/..., /booking/[id]", "Redirects to /shelter login or role fallback.", "Should not show PawJai admin login to shelter staff.", "Test in incognito before pilot.", "Manual / watch"],
  ["Unsafe returnTo edit", "User manually edits returnTo URL", "/booking/[id]?returnTo=...", "External URLs, // paths, and wrong-lane paths are ignored; fallback is role-based.", "Prevents shelter staff from being bounced into admin umbrella.", "Keep this pattern for future shared routes.", "Guarded"],
];

const codexSpecRows = [
  ["Dog edit - admin shell", "Route shell", "app/admindraft/dogs/[id]/edit/page.tsx", "dogs, dog_photos, dog_traits, shelters", "DogEditForm -> updateDogProfileAction", "returnTo=/admindraft/dogs/[id]/edit; deleteReturnTo=/admindraft?shelter=:id&view=dogs", "isAdminDraftUnlocked + requireShelterAccess(dog.shelter_id)", "PawJai umbrella interface; same live dog row"],
  ["Dog edit - shelter shell", "Route shell", "app/shelter/[slug]/dogs/[id]/edit/page.tsx", "dogs, dog_photos, dog_traits, shelters", "DogEditForm -> updateDogProfileAction", "returnTo=/shelter/[slug]/dogs/[id]/edit; deleteReturnTo=/shelter/[slug]?view=dogs", "getAdminAuthContext(includePhraseGate:false) + dog.shelter_id === shelter.id", "Shelter-only interface; same live dog row"],
  ["Dog create - admin", "Route shell", "app/admindraft/dog-creation + app/admindraft/dogs/new/page.tsx", "shelters, dog_traits", "DogListingForm -> createDogProfileAction", "successListingsHref=/admindraft?shelter=:id&view=dogs", "isAdminDraftUnlocked + requireShelterAccess(selected shelter)", "Admin can choose shelter"],
  ["Dog create - shelter", "Route shell", "app/shelter/[slug]/dogs/new/page.tsx", "shelters scoped to logged-in shelter, dog_traits", "DogListingForm -> createDogProfileAction", "successListingsHref=/shelter/[slug]?view=dogs", "getShelterByPortalSlug + shelter membership", "Shelter cannot choose other shelters"],
  ["Dog create/edit action", "Server action", "app/admin/dogs/new/actions.ts + app/admin/dogs/[id]/edit/actions.ts", "dogs, dog_photos, dog_traits, appointments", "insert/update/delete rows; upload/remove dog-photos storage", "Accepts /admindraft and /shelter returnTo prefixes", "requireShelterAccess(shelter_id)", "Shared action is why both route shells sync"],
  ["Admin/shelter listings", "Data loader", "utils/admin-draft-data.ts:loadAdminDraftData", "dogs, dog_photos, appointments, shelters, ads, pawjai_profile", "Read-only load for panel", "Panel routes decide edit/create/detail links", "Optional shelterIds scopes shelter portal", "Same loader powers umbrella and shelter subset"],
  ["Booking detail", "Shared route", "app/booking/[id]/page.tsx", "appointments, adopters, dogs, shelters", "decideBookingAction, checkInBookingAction", "safeBookingReturnTo", "getAdminAuthContext + canAccessShelter", "No duplicate booking page/data table needed"],
  ["Visitor profile", "Shared route", "app/booking/[id]/visitor-profile/page.tsx", "appointments, adopters, adopter_documents, adopter_profiles, adopter_preferences, dogs, shelters", "Read profile/verification documents", "Back to booking detail/list uses safe returnTo", "getAdminAuthContext + canAccessShelter", "Shared internal verification view"],
  ["QR check-in", "Shared route", "app/booking/check-in/page.tsx + utils/booking.ts:buildCheckInUrl", "appointments", "checkInBookingAction updates appointments.checked_in_at/status", "returnTo preserved into /booking/[id]", "token validation + canAccessShelter", "Generated QR now points to /booking/check-in"],
  ["Shelter profile", "Shared action reused", "components/admin/AdminReorgDraftPanel.tsx + app/admin/bookings/actions.ts", "shelters, shelter_regular_hours, shelter_availability", "updateShelterProfileAction, operating days, blockouts", "DraftReturnFields returnTo=/admindraft or /shelter/[slug]", "requireShelterAccess(shelter_id)", "Same shelter data in both admin and portal"],
  ["Public dog profile", "Public route", "app/dogs/[id]/page.tsx", "dogs, dog_photos, dog_traits, shelters", "Read-only public display", "Browser/public navigation only", "Public page; available dogs indexable", "Only intentional shelter-to-public crossover"],
  ["Not realtime yet", "Architecture note", "N/A", "Supabase tables are shared", "Server actions revalidate key routes", "Refresh/navigation shows latest DB state", "No Supabase Realtime channel added yet", "Add Realtime later if open tabs need instant updates"],
];

const pilotChecklistRows = [
  ["Login separation", "Voice and Rescue Dog accounts route to their own /shelter/[slug] portal.", "Use incognito; sign in as thevoice and rescuedog; verify no admin umbrella appears.", "Ready", "Before sharing credentials"],
  ["Shelter dog creation", "Shelter can create dog with name, shelter, breed, matching fields, photos, cover order.", "Create a test draft dog from /shelter/thevoicefoundation/dogs/new and confirm it appears in shelter and admin listings.", "Manual smoke test", "Before first staff upload"],
  ["Shelter dog edit", "Editing from /shelter/[slug]/dogs/[id]/edit updates same record admin sees.", "Change a harmless field, return to shelter dog list, check /admindraft dog list and public dog page.", "Manual smoke test", "Before first staff upload"],
  ["Photos and storage", "Uploads land in dog-photos bucket and dog_photos rows; cover/order works.", "Upload 2-3 small photos, set cover, save, reopen from both routes.", "Manual smoke test", "Before first real dog batch"],
  ["Back/exit behavior", "Exit/back from dog create/edit and booking detail returns to the correct lane.", "Click every visible Back, Exit, Dog listings, Booking list button from shelter and admin.", "Manual smoke test", "Critical"],
  ["Booking list sync", "Admin and shelter booking lists read same appointments and reflect status decisions.", "Accept/deny/change one test booking from shelter; verify /admindraft booking list shows same status after reload.", "Manual smoke test", "Critical"],
  ["Booking deep pages", "Shared /booking detail and visitor profile never leak shelter to /admindraft.", "Open booking detail/profile as shelter, use back buttons, edit returnTo manually once.", "Manual smoke test", "Critical"],
  ["QR check-in", "QR check-in opens /booking and preserves the correct return lane.", "Scan or paste a test token from shelter booking list on phone.", "Manual smoke test", "Before shelter live visits"],
  ["Permission boundary", "Voice cannot access Rescue Dog dog edit/booking routes and vice versa.", "Copy a route from one shelter while signed into the other.", "Manual smoke test", "Critical"],
  ["Mobile shelter UX", "Dog create/edit and booking decisions are usable on phone width.", "Test on mobile viewport or real phone for create dog, edit dog, booking decision.", "Manual smoke test", "Before staff training"],
  ["Messaging", "Messaging is intentionally not complete yet.", "Do not promise messaging in the pilot unless built/tested in a separate session.", "Pending", "Separate build"],
  ["Staff training note", "Tell shelter staff to use visible Exit/Back buttons instead of relying on browser back.", "Add this to onboarding SOP.", "Recommended", "Training"],
  ["Temporary shared password", "Shared login is okay for pilot but not long-term.", "After pilot, move to employee accounts with audit history.", "Watch", "Post-pilot"],
  ["Data backup/export", "Before mass upload, export or snapshot dogs/shelters/appointments data.", "Run Supabase export/dashboard backup process.", "Recommended", "Before large onboarding"],
];

const advisoryRows = [
  ["Keep separate route shells", "Yes", "The two dog edit URLs are two interfaces around one shared form/action and one DB row. This is good long-term because permissions and navigation differ by role."],
  ["Do not create duplicate dog tables", "Yes", "Keep dogs, dog_photos, dog_traits as the single source of truth. Route duplication is okay; data duplication is not."],
  ["Use /booking as shared internal booking workspace", "Yes", "Booking intersects admin, shelter, and adopter data. Shared /booking avoids copying pages while safe returnTo preserves lanes."],
  ["Do not expose shelter/admin to indexing", "Done", "/shelter, /booking, /admin, and /admindraft are noindex/private route groups."],
  ["Expect synced after navigation/refresh", "Current", "Both admin and shelter listings reload from Supabase. This is synced data but not live websocket realtime."],
  ["Add Supabase Realtime only if needed", "Later", "Useful if two staff members need open pages to update instantly after someone else saves a dog/booking."],
  ["Pilot-safe missing feature", "Messaging", "Messaging remains the main intentionally pending feature. Do not block dog-data onboarding on messaging unless shelter expects it."],
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

writeDbSyncDiagram(safeGetSheet(workbook, "DB Sync Diagram"));
writeRouteFlowDiagram(safeGetSheet(workbook, "Route Flow Diagram"));

writeSheet(
  safeGetSheet(workbook, "Back Behavior"),
  "PAWJAI Back Behavior Matrix",
  "Documents the two back types: browser history is uncontrolled history, while app back/exit links and returnTo are controlled lane-aware behavior.",
  ["Back type", "Trigger", "Used from", "How it behaves", "Risk / guardrail", "Recommendation", "Status"],
  backBehaviorRows,
  [24, 32, 38, 54, 54, 46, 18],
);

writeSheet(
  safeGetSheet(workbook, "Codex Route Spec"),
  "PAWJAI Machine-Readable Route and Data Spec",
  "Future Codex sessions should read this sheet to understand exact source files, route shells, shared actions, tables, buckets, and guardrails.",
  ["System area", "Type", "Source route / file", "Reads", "Writes / shared action", "Return / back behavior", "Guard", "Notes"],
  codexSpecRows,
  [26, 20, 48, 44, 46, 48, 46, 52],
);

writeSheet(
  safeGetSheet(workbook, "Pilot Checklist"),
  "Shelter Pilot Readiness Checklist",
  "Use this before giving shelter staff login credentials. The goal is to catch route leaks, sync issues, upload problems, and mobile friction before real data scaling.",
  ["Category", "What must be true", "How to test", "Status", "Owner / timing"],
  pilotChecklistRows,
  [26, 58, 64, 22, 28],
);

writeSheet(
  safeGetSheet(workbook, "Architecture Advice"),
  "PAWJAI Architecture Advisory",
  "Recommended long-term structure based on the current admin/shelter/booking reorganization.",
  ["Decision", "Recommendation", "Reason"],
  advisoryRows,
  [34, 24, 92],
);

const routePreview = await workbook.render({ sheetName: "Route Migration Map", range: "A1:F19", scale: 1 });
await fs.writeFile(`${outputDir}/route-migration-map-preview.png`, new Uint8Array(await routePreview.arrayBuffer()));
const connectionPreview = await workbook.render({ sheetName: "Lane Connections", range: "A1:F16", scale: 1 });
await fs.writeFile(`${outputDir}/lane-connections-preview.png`, new Uint8Array(await connectionPreview.arrayBuffer()));
const dbDiagramPreviewPath = `${outputDir}/db-sync-diagram-preview.png`;
const dbDiagramPreview = await workbook.render({ sheetName: "DB Sync Diagram", range: "A1:H22", scale: 1 });
await fs.writeFile(dbDiagramPreviewPath, new Uint8Array(await dbDiagramPreview.arrayBuffer()));
const routeFlowPreviewPath = `${outputDir}/route-flow-diagram-preview.png`;
const routeFlowPreview = await workbook.render({ sheetName: "Route Flow Diagram", range: "A1:H20", scale: 1 });
await fs.writeFile(routeFlowPreviewPath, new Uint8Array(await routeFlowPreview.arrayBuffer()));
const backPreview = await workbook.render({ sheetName: "Back Behavior", range: "A1:G13", scale: 1 });
await fs.writeFile(`${outputDir}/back-behavior-preview.png`, new Uint8Array(await backPreview.arrayBuffer()));
const specPreview = await workbook.render({ sheetName: "Codex Route Spec", range: "A1:H16", scale: 1 });
await fs.writeFile(`${outputDir}/codex-route-spec-preview.png`, new Uint8Array(await specPreview.arrayBuffer()));
const checklistPreview = await workbook.render({ sheetName: "Pilot Checklist", range: "A1:E18", scale: 1 });
await fs.writeFile(`${outputDir}/pilot-checklist-preview.png`, new Uint8Array(await checklistPreview.arrayBuffer()));
const advicePreview = await workbook.render({ sheetName: "Architecture Advice", range: "A1:C13", scale: 1 });
await fs.writeFile(`${outputDir}/architecture-advice-preview.png`, new Uint8Array(await advicePreview.arrayBuffer()));

await writeDiagramGallery(workbook, safeGetSheet(workbook, "Diagram Gallery"), [
  {
    file: dbDiagramPreviewPath,
    anchor: { row: 5, col: 0 },
    widthPx: 760,
    heightPx: 430,
  },
  {
    file: routeFlowPreviewPath,
    anchor: { row: 5, col: 4 },
    widthPx: 760,
    heightPx: 430,
  },
]);
const galleryPreview = await workbook.render({ sheetName: "Diagram Gallery", range: "A1:H32", scale: 1 });
await fs.writeFile(`${outputDir}/diagram-gallery-preview.png`, new Uint8Array(await galleryPreview.arrayBuffer()));

const keyTableCheck = await workbook.inspect({
  kind: "table",
  sheetId: "Back Behavior",
  range: "A1:G13",
  include: "values",
  tableMaxRows: 13,
  tableMaxCols: 7,
  summary: "back behavior check",
});
console.log(keyTableCheck.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson || "no formula errors");

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(workbookPath);
console.log(`updated ${workbookPath}`);
