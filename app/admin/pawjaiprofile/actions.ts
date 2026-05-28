"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  isAdminGateOpen,
  openAdminGate,
  closeAdminGate,
  validateAdminPassphrase,
} from "@/utils/admin-auth";
import type { PawjaiContactItem, PawjaiContactItemType, PawjaiPartnerShelter } from "@/utils/pawjai-profile";
import type { PawjaiAdminGateState } from "./form-state";

function profileRedirect(message: string) {
  redirect(`/admin/pawjaiprofile?message=${encodeURIComponent(message)}`);
}

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeContactType(value: string): PawjaiContactItemType {
  if (["custom", "email", "phone", "social", "website"].includes(value)) {
    return value as PawjaiContactItemType;
  }

  return "custom";
}

function collectPartnerShelters(formData: FormData, maxRows: number): PawjaiPartnerShelter[] {
  const rows: PawjaiPartnerShelter[] = [];

  for (let index = 0; index < maxRows; index += 1) {
    const name = getString(formData, `shelter_name_${index}`);
    const detail = getString(formData, `shelter_detail_${index}`);
    const logoUrl = getString(formData, `shelter_logo_url_${index}`) || null;

    if (!name && !detail) continue;
    if (!name || !detail) continue;

    rows.push({ detail, logo_url: logoUrl, name });
  }

  return rows;
}

function collectContactItems(formData: FormData, maxRows: number): PawjaiContactItem[] {
  const rows: PawjaiContactItem[] = [];

  for (let index = 0; index < maxRows; index += 1) {
    const type = normalizeContactType(getString(formData, `contact_type_${index}`).toLowerCase());
    const label = getString(formData, `contact_label_${index}`);
    const href = getString(formData, `contact_href_${index}`) || null;

    if (!label && !href) continue;
    if (!label) continue;

    rows.push({ href, label, type });
  }

  return rows;
}

export async function unlockAdminGateAction(
  _prevState: PawjaiAdminGateState,
  formData: FormData,
): Promise<PawjaiAdminGateState> {
  const passphrase = getString(formData, "passphrase");

  if (!validateAdminPassphrase(passphrase)) {
    return {
      message: "That passphrase is incorrect.",
      status: "error",
    };
  }

  await openAdminGate();

  return {
    message: "Access granted. Reloading admin tools...",
    status: "success",
  };
}

export async function lockAdminGateAction() {
  await closeAdminGate();
}

export async function savePawjaiProfileAction(formData: FormData) {
  if (!(await isAdminGateOpen())) {
    profileRedirect("Unlock the admin page first.");
  }

  const heroSlogan = getString(formData, "hero_slogan");
  const missionTitle = getString(formData, "mission_title");
  const missionBody = getString(formData, "mission_body");
  const partnerShelters = collectPartnerShelters(formData, 8);
  const contactItems = collectContactItems(formData, 8);

  if (!heroSlogan) {
    profileRedirect("Slogan is required.");
  }

  if (!missionTitle) {
    profileRedirect("Mission title is required.");
  }

  if (!missionBody) {
    profileRedirect("Mission copy is required.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("pawjai_profile")
    .upsert(
      {
        id: "default",
        hero_slogan: heroSlogan,
        mission_body: missionBody,
        mission_title: missionTitle,
        partner_shelters: partnerShelters,
        contact_items: contactItems,
      },
      { onConflict: "id" },
    );

  if (error) {
    if (error.message.toLowerCase().includes("pawjai_profile")) {
      profileRedirect("Save failed because the pawjai_profile migration has not been applied yet.");
    }

    profileRedirect("PawJai profile could not be saved.");
  }

  revalidatePath("/about");
  revalidatePath("/more");
  revalidatePath("/admin/pawjaiprofile");
  profileRedirect("PawJai profile updated.");
}
