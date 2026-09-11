import type { Database, Json } from "@/types/database";

type PawjaiProfileRow = Database["public"]["Tables"]["pawjai_profile"]["Row"];

export type PawjaiPartnerShelter = {
  confirmed: boolean;
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
  heroSlogan: "Dog adoption and shelter matching in Thailand",
  missionTitle: "Our Mission",
  missionBody:
    "PawJai helps people discover dogs available for adoption through participating shelters in Thailand. People can review dog profiles, save their preferences, and request an in-person shelter visit. Adoption decisions and paperwork remain with each shelter.",
  partnerShelters: [],
  contactItems: [
    { type: "email", label: "pawjaipet@gmail.com", href: "mailto:pawjaipet@gmail.com" },
    { type: "website", label: "pawjaipet.com", href: "https://www.pawjaipet.com" },
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

export function normalizePartnerShelters(
  value: Json | null | undefined,
  { includeUnconfirmed = false }: { includeUnconfirmed?: boolean } = {},
): PawjaiPartnerShelter[] {
  if (!Array.isArray(value)) return [];

  const rows: PawjaiPartnerShelter[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;

    const name = cleanString(item.name);
    const detail = cleanString(item.detail);
    const confirmed = item.confirmed === true;

    if (!name || !detail) continue;
    if (!confirmed && !includeUnconfirmed) continue;

    const logoUrl = typeof item.logo_url === "string" ? item.logo_url : null;
    rows.push({ confirmed, detail, logo_url: logoUrl, name });
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
  options?: { includeUnconfirmedPartners?: boolean },
): PawjaiProfileContent {
  const heroSlogan = cleanString(row?.hero_slogan) || DEFAULT_PAWJAI_PROFILE_CONTENT.heroSlogan;
  const missionTitle = cleanString(row?.mission_title) || DEFAULT_PAWJAI_PROFILE_CONTENT.missionTitle;
  const missionBody = cleanString(row?.mission_body) || DEFAULT_PAWJAI_PROFILE_CONTENT.missionBody;
  const partnerShelters = normalizePartnerShelters(row?.partner_shelters, {
    includeUnconfirmed: options?.includeUnconfirmedPartners,
  });
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
  if (item.type === "email") {
    const email = item.href?.replace(/^mailto:/i, "") || item.label;
    return email.includes("@") ? `mailto:${email}` : null;
  }

  if (item.type === "phone") {
    const phone = item.href?.replace(/^tel:/i, "") || item.label;
    return phone ? `tel:${phone.replace(/\s+/g, "")}` : null;
  }

  if (item.href) return item.href;

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
  options?: { includeUnconfirmedPartners?: boolean },
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

    return mergePawjaiProfileContent(data, options);
  } catch {
    return DEFAULT_PAWJAI_PROFILE_CONTENT;
  }
}
