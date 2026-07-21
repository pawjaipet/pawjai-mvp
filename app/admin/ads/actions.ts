"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { parseAdDateRange } from "@/utils/ad-date-range";
import { requireGlobalAdmin } from "@/utils/admin-auth";
import { logAdminAuditEvent } from "@/utils/admin-audit";
import { createAdFromFormData } from "@/utils/ad-submissions";
import type { AdReviewStatus } from "@/utils/ad-workflow";

const ADMIN_ADS_PATH = "/admin/ads";
const ADMIN_DRAFT_ADS_PATH = "/admindraft/ads";

function getAdsReturnPath(value: FormDataEntryValue | string | null | undefined) {
  const requested = String(value ?? "").trim();

  if (requested === ADMIN_DRAFT_ADS_PATH) return ADMIN_DRAFT_ADS_PATH;
  return ADMIN_ADS_PATH;
}

function revalidateAdSurfaces(returnPath: string) {
  revalidatePath(ADMIN_ADS_PATH);
  revalidatePath(ADMIN_DRAFT_ADS_PATH);
  revalidatePath("/admindraft");
  revalidatePath("/ads");
  revalidatePath("/");
  if (returnPath !== ADMIN_ADS_PATH && returnPath !== ADMIN_DRAFT_ADS_PATH) {
    revalidatePath(returnPath);
  }
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
