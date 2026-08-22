"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  normalizeAdCreativeSettings,
  saveAdCreativeSettings,
} from "@/utils/ad-creative-settings";
import { parseAdDateRange } from "@/utils/ad-date-range";
import { requireGlobalAdmin } from "@/utils/admin-auth";
import { logAdminAuditEvent } from "@/utils/admin-audit";
import { createAdFromFormData } from "@/utils/ad-submissions";
import type { AdReviewStatus } from "@/utils/ad-workflow";

const ADMIN_PATH = "/admin";
const ADMIN_ADS_PATH = "/admin?view=ads";

function getAdsReturnPath(value: FormDataEntryValue | string | null | undefined) {
  const requested = String(value ?? "").trim();
  const canonical = requested.replace(/^\/admindraft/, "/admin");

  if (canonical === "/admin/ads" || canonical.startsWith("/admin/ads?")) return ADMIN_ADS_PATH;
  if (canonical === ADMIN_PATH || canonical.startsWith(`${ADMIN_PATH}?`)) return canonical;
  return ADMIN_ADS_PATH;
}

function redirectAfterAdMutation(returnPath: string, message: string) {
  const params = new URLSearchParams();
  if (message) params.set("message", message);
  const separator = returnPath.includes("?") ? "&" : "?";
  redirect(`${returnPath}${params.toString() ? `${separator}${params.toString()}` : ""}`);
}

function revalidateAdSurfaces(returnPath: string) {
  revalidatePath(ADMIN_PATH);
  revalidatePath("/ads");
  revalidatePath("/");
  if (returnPath !== ADMIN_ADS_PATH) {
    revalidatePath(returnPath);
  }
}

function getPositiveInteger(formData: FormData, name: string) {
  const value = Number(String(formData.get(name) ?? "").trim());
  return Number.isFinite(value) ? Math.round(value) : Number.NaN;
}

export async function createAdAction(_prev: { error?: string; success?: string } | undefined, formData: FormData) {
  const returnPath = getAdsReturnPath(formData.get("returnTo"));
  const adminContext = await requireGlobalAdmin(returnPath);
  const result = await createAdFromFormData(formData);

  if (result.error) return { error: result.error };

  await logAdminAuditEvent({
    action: "ad.create",
    context: adminContext,
    metadata: {
      companyName: result.companyName,
      isActive: result.isActive,
    },
    targetId: result.adId ?? null,
    targetTable: "ads",
  });

  revalidateAdSurfaces(returnPath);
  return { success: result.success };
}

export async function deleteAdAction(id: string, returnPathValue?: string) {
  const returnPath = getAdsReturnPath(returnPathValue);
  const adminContext = await requireGlobalAdmin(returnPath);

  const supabase = createAdminClient();
  await supabase.from("ads").delete().eq("id", id);
  await logAdminAuditEvent({
    action: "ad.delete",
    context: adminContext,
    targetId: id,
    targetTable: "ads",
  });
  revalidateAdSurfaces(returnPath);
}

export async function toggleAdAction(id: string, isActive: boolean, returnPathValue?: string) {
  const returnPath = getAdsReturnPath(returnPathValue);
  const adminContext = await requireGlobalAdmin(returnPath);

  const supabase = createAdminClient();
  await supabase.from("ads").update({ is_active: isActive }).eq("id", id);
  await logAdminAuditEvent({
    action: "ad.toggle",
    context: adminContext,
    metadata: {
      isActive,
    },
    targetId: id,
    targetTable: "ads",
  });
  revalidateAdSurfaces(returnPath);
}

export async function updateAdReviewStatusAction(id: string, status: AdReviewStatus, returnPathValue?: string) {
  const returnPath = getAdsReturnPath(returnPathValue);
  const adminContext = await requireGlobalAdmin(returnPath);
  const isActive = status === "approved";

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("ads")
    .update({
      ad_status: status,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: `DB update failed: ${error.message}` };
  }

  await logAdminAuditEvent({
    action: "ad.review.update",
    context: adminContext,
    metadata: {
      isActive,
      status,
    },
    targetId: id,
    targetTable: "ads",
  });

  revalidateAdSurfaces(returnPath);
  return { success: status === "approved" ? "Ad accepted and set live." : "Ad denied." };
}

export async function updateAdDatesAction(id: string, startDateValue: string, endDateValue: string, returnPathValue?: string) {
  const returnPath = getAdsReturnPath(returnPathValue);
  const adminContext = await requireGlobalAdmin(returnPath);

  let dateRange: ReturnType<typeof parseAdDateRange>;
  try {
    dateRange = parseAdDateRange(startDateValue, endDateValue);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Dates are invalid." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("ads")
    .update({
      end_date: dateRange.endDate,
      start_date: dateRange.startDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: `DB update failed: ${error.message}` };
  }

  await logAdminAuditEvent({
    action: "ad.dates.update",
    context: adminContext,
    metadata: {
      endDate: dateRange.endDate,
      startDate: dateRange.startDate,
    },
    targetId: id,
    targetTable: "ads",
  });

  revalidateAdSurfaces(returnPath);
  return { success: "Ad dates updated." };
}

export async function updateAdDatesFromFormAction(id: string, returnPathValue: string, formData: FormData) {
  const returnPath = getAdsReturnPath(returnPathValue);
  const result = await updateAdDatesAction(
    id,
    String(formData.get("start_date") ?? ""),
    String(formData.get("end_date") ?? ""),
    returnPath,
  );
  redirectAfterAdMutation(returnPath, result?.error ?? result?.success ?? "Ad dates saved.");
}

export async function updateAdCreativeSettingsFromFormAction(returnPathValue: string, formData: FormData) {
  const returnPath = getAdsReturnPath(returnPathValue);
  const adminContext = await requireGlobalAdmin(returnPath);
  const settings = normalizeAdCreativeSettings({
    height: getPositiveInteger(formData, "height"),
    maxUploadMb: getPositiveInteger(formData, "max_upload_mb"),
    maxVideoSeconds: getPositiveInteger(formData, "max_video_seconds"),
    width: getPositiveInteger(formData, "width"),
  });

  const { error } = await saveAdCreativeSettings(settings);

  if (error) {
    redirectAfterAdMutation(returnPath, `Creative settings failed: ${error.message}`);
  }

  await logAdminAuditEvent({
    action: "ad.creative_settings.update",
    context: adminContext,
    metadata: settings,
    targetId: "ads_creative_specs",
    targetTable: "site_settings",
  });

  revalidateAdSurfaces(returnPath);
  redirectAfterAdMutation(returnPath, "Ad creative specs updated.");
}

export async function updateAdReviewStatusFromFormAction(id: string, status: AdReviewStatus, returnPathValue: string) {
  const returnPath = getAdsReturnPath(returnPathValue);
  const result = await updateAdReviewStatusAction(id, status, returnPath);
  redirectAfterAdMutation(returnPath, result?.error ?? result?.success ?? "Ad review updated.");
}

export async function toggleAdFromFormAction(id: string, isActive: boolean, returnPathValue: string) {
  const returnPath = getAdsReturnPath(returnPathValue);
  await toggleAdAction(id, isActive, returnPath);
  redirectAfterAdMutation(returnPath, isActive ? "Ad resumed." : "Ad paused.");
}
