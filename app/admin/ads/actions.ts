"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { uploadBufferToBackblaze } from "@/utils/backblaze";
import { parseAdDateRange } from "@/utils/ad-date-range";
import { requireGlobalAdmin } from "@/utils/admin-auth";
import { logAdminAuditEvent } from "@/utils/admin-audit";

function randomHex(bytes = 4) {
  return Math.floor(Math.random() * 16 ** (bytes * 2))
    .toString(16)
    .padStart(bytes * 2, "0");
}

export async function createAdAction(_prev: { error?: string; success?: string } | undefined, formData: FormData) {
  const adminContext = await requireGlobalAdmin("/admin/ads");

  const companyName = (formData.get("company_name") as string)?.trim();
  const contactInfo = (formData.get("contact_info") as string)?.trim() || null;
  const clickUrl = (formData.get("click_url") as string)?.trim();
  const isActive = formData.get("is_active") === "on";
  const imageFile = formData.get("image_file") as File | null;

  if (!companyName) return { error: "Company name is required." };
  if (!clickUrl) return { error: "Click URL is required." };
  if (!imageFile || imageFile.size === 0) return { error: "Ad image is required." };
  if (!imageFile.type.startsWith("image/")) return { error: "File must be an image." };

  let dateRange: ReturnType<typeof parseAdDateRange>;
  try {
    dateRange = parseAdDateRange(formData.get("start_date"), formData.get("end_date"));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Dates are invalid." };
  }

  const body = Buffer.from(await imageFile.arrayBuffer());
  const ext = imageFile.type.includes("png") ? "png" : imageFile.type.includes("webp") ? "webp" : "jpg";
  const desiredPath = `ads/${Date.now()}-${randomHex(4)}.${ext}`;

  let imageUrl: string;
  try {
    const uploaded = await uploadBufferToBackblaze({ body, contentType: imageFile.type, desiredPath });
    imageUrl = uploaded.publicUrl;
  } catch (err) {
    return { error: `B2 upload failed: ${err instanceof Error ? err.message : "unknown error"}` };
  }

  const supabase = createAdminClient();
  const { data: ad, error: dbError } = await supabase.from("ads").insert({
    company_name: companyName,
    contact_info: contactInfo,
    image_url: imageUrl,
    click_url: clickUrl,
    start_date: dateRange.startDate,
    end_date: dateRange.endDate,
    is_active: isActive,
  }).select("id").single();

  if (dbError) return { error: `DB insert failed: ${dbError.message}` };
  await logAdminAuditEvent({
    action: "ad.create",
    context: adminContext,
    metadata: {
      companyName,
      isActive,
    },
    targetId: ad?.id ?? null,
    targetTable: "ads",
  });

  revalidatePath("/admin/ads");
  revalidatePath("/");
  return { success: `Ad for ${companyName} created.` };
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
