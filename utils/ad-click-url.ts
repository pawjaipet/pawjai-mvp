export function normalizeAdClickUrl(value: FormDataEntryValue | null) {
  const rawValue = typeof value === "string" ? value.trim() : "";

  if (!rawValue) {
    return "";
  }

  const candidate = /^[a-z][a-z\d+.-]*:/i.test(rawValue)
    ? rawValue
    : `https://${rawValue.replace(/^\/+/, "")}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("Enter a valid click URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Click URL must be a website link.");
  }

  return url.toString();
}
