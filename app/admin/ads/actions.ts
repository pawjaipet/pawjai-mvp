"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { parseAdDateRange } from "@/utils/ad-date-range";
import { requireGlobalAdmin } from "@/utils/admin-auth";
import { logAdminAuditEvent } from "@/utils/admin-audit";
import { createAdFromFormData } from "@/utils/ad-submissions";

export async function createAdAction(_prev: { error?: string; success?: string } | undefined, formData: FormData) {
  const adminContext = await requireGlobalAdmin("/admin/ads");
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

  revalidatePath("/admin/ads");
  revalidatePath("/admindraft");
  revalidatePath("/ads");
  revalidatePath("/");
  return { success: result.success };
}

export async function deleteAdAction(id: string) {
  const adminContext = await requireGlobalAdmin("/admin/ads");

  const supabase = createAdminClient();
  await supabase.from("ads").delete().eq("id", id);
  await logAdminAuditEvent({
    action: "ad.delete",
    context: adminContext,
    targetId: id,
    targetTable: "ads",
  });
  revalidatePath("/admin/ads");
  revalidatePath("/");
}

export async function toggleAdAction(id: string, isActive: boolean) {
  const adminContext = await requireGlobalAdmin("/admin/ads");

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
  revalidatePath("/admin/ads");
  revalidatePath("/");
}

export async function updateAdDatesAction(id: string, startDateValue: string, endDateValue: string) {
  const adminContext = await requireGlobalAdmin("/admin/ads");

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

  revalidatePath("/admin/ads");
  revalidatePath("/");
  return { success: "Ad dates updated." };
}
