export function csvCell(value: unknown) {
  let text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  // Spreadsheet formula injection must not turn a listing into executable cells.
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export function exportCsv(columns: string[], rows: Record<string, unknown>[]) {
  return "\uFEFF" + [columns.map(csvCell).join(","), ...rows.map(row => columns.map(column => csvCell(row[column])).join(","))].join("\r\n") + "\r\n";
}
export function allowedExportMedia(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.port && (
      (parsed.hostname === "media.pawjaipet.com" && parsed.pathname.startsWith("/file/pawjai/")) ||
      (parsed.hostname === "bdnyvcvkyepipdcygkvn.supabase.co" && parsed.pathname.startsWith("/storage/v1/object/public/dog-photos/"))
    );
  } catch { return false; }
}
