import type { Database, Json } from "@/types/database";

type PawjaiProfileRow = Database["public"]["Tables"]["pawjai_profile"]["Row"];

export type PawjaiPartnerShelter = {
  detail: string;
  logo_url?: string | null;
  name: string;
};

export type PawjaiContactItemType = "custom" | "email" | "phone" | "social" | "website";

export type PawjaiContactItem = {
  href: string | null;
  label: string;
  type: PawjaiContactItemType;
};

export type PawjaiProfileContent = {
  contactItems: PawjaiContactItem[];
  heroSlogan: string;
  missionBody: string;
  missionTitle: string;
  partnerShelters: PawjaiPartnerShelter[];
};

export const DEFAULT_PAWJAI_PROFILE_CONTENT: PawjaiProfileContent = {
  heroSlogan: "Connecting Thai dogs with loving homes",
  missionTitle: "Our Mission",
  missionBody:
    "Thailand is home to an estimated 3.5 million stray dogs. PawJai was built to change that — one adoption at a time. We partner with shelters across the country to make the adoption process joyful, transparent, and accessible to everyone.",
  partnerShelters: [
    { name: "Soi Dog Foundation", detail: "Phuket · 1,600+ dogs" },
    { name: "Ban Rak Nong Shelter", detail: "Bangkok · 200+ dogs" },
    { name: "Happy Paws Bangkok", detail: "Bangkok · 120+ dogs" },
    { name: "Chiang Mai Dog Rescue", detail: "Chiang Mai · 80+ dogs" },
  ],
  contactItems: [
    { type: "email", label: "hello@pawjai.co.th", href: "mailto:hello@pawjai.co.th" },
    { type: "social", label: "@pawjai.official", href: null },
    { type: "website", label: "pawjai.co.th", href: "https://pawjai.co.th" },
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isContactType(value: string): value is PawjaiContactItemType {
  return ["custom", "email", "phone", "social", "website"].includes(value);
}

export function normalizePartnerShelters(value: Json | null | undefined): PawjaiPartnerShelter[] {
  if (!Array.isArray(value)) return DEFAULT_PAWJAI_PROFILE_CONTENT.partnerShelters;

  const rows: PawjaiPartnerShelter[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;

    const name = cleanString(item.name);
    const detail = cleanString(item.detail);

    if (!name || !detail) continue;

    const logoUrl = typeof item.logo_url === "string" ? item.logo_url : null;
    rows.push({ detail, logo_url: logoUrl, name });
  }

  return rows.length > 0 ? rows : [];
}

export function normalizeContactItems(value: Json | null | undefined): PawjaiContactItem[] {
  if (!Array.isArray(value)) return DEFAULT_PAWJAI_PROFILE_CONTENT.contactItems;

  const rows: PawjaiContactItem[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;

    const label = cleanString(item.label);
    const hrefValue = cleanString(item.href);
    const typeValue = cleanString(item.type).toLowerCase();
    const type = isContactType(typeValue) ? typeValue : "custom";

    if (!label) continue;

    rows.push({
      href: hrefValue || null,
      label,
      type,
    });
  }

  return rows.length > 0 ? rows : [];
}

export function mergePawjaiProfileContent(
  row?: Partial<PawjaiProfileRow> | null,
): PawjaiProfileContent {
  const heroSlogan = cleanString(row?.hero_slogan) || DEFAULT_PAWJAI_PROFILE_CONTENT.heroSlogan;
  const missionTitle = cleanString(row?.mission_title) || DEFAULT_PAWJAI_PROFILE_CONTENT.missionTitle;
  const missionBody = cleanString(row?.mission_body) || DEFAULT_PAWJAI_PROFILE_CONTENT.missionBody;
  const partnerShelters = normalizePartnerShelters(row?.partner_shelters);
  const contactItems = normalizeContactItems(row?.contact_items);

  return {
    contactItems,
    heroSlogan,
    missionBody,
    missionTitle,
    partnerShelters,
  };
}

export function buildPawjaiContactHref(item: PawjaiContactItem) {
  if (item.href) return item.href;

  if (item.type === "email") return `mailto:${item.label}`;
  if (item.type === "phone") return `tel:${item.label.replace(/\s+/g, "")}`;
  if (item.type === "website") {
    return item.label.startsWith("http://") || item.label.startsWith("https://")
      ? item.label
      : `https://${item.label}`;
  }

  return null;
}

export function pawjaiContactIcon(itemType: PawjaiContactItemType) {
  switch (itemType) {
    case "email":
      return "✉️";
    case "phone":
      return "📱";
    case "social":
      return "📸";
    case "website":
      return "🌐";
    default:
      return "📍";
  }
}

export async function loadPawjaiProfileContent(
  supabase: any,
) {
  try {
    const { data, error } = await supabase
      .from("pawjai_profile")
      .select("hero_slogan, mission_title, mission_body, partner_shelters, contact_items")
      .eq("id", "default")
      .maybeSingle();

    if (error) {
      return DEFAULT_PAWJAI_PROFILE_CONTENT;
    }

    return mergePawjaiProfileContent(data);
  } catch {
    return DEFAULT_PAWJAI_PROFILE_CONTENT;
  }
}
