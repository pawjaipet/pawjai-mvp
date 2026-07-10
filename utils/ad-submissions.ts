import "server-only";

import { uploadBufferToBackblaze } from "@/utils/backblaze";
import { parseAdDateRange } from "@/utils/ad-date-range";
import { createAdminClient } from "@/utils/supabase/admin";
import { normalizeAdClickUrl } from "@/utils/ad-click-url";

export type AdSubmissionResult = {
  adId?: string;
  companyName?: string;
  error?: string;
  isActive?: boolean;
  success?: string;
};

function randomHex(bytes = 4) {
  return Math.floor(Math.random() * 16 ** (bytes * 2))
    .toString(16)
    .padStart(bytes * 2, "0");
}

export async function createAdFromFormData(formData: FormData): Promise<AdSubmissionResult> {
  const companyName = (formData.get("company_name") as string)?.trim();
  const contactInfo = (formData.get("contact_info") as string)?.trim() || null;
  let clickUrl: string;
  try {
    clickUrl = normalizeAdClickUrl(formData.get("click_url"));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Enter a valid click URL." };
  }
  const isActive = formData.has("is_active") ? formData.get("is_active") === "on" : true;
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
    click_url: clickUrl,
    company_name: companyName,
    contact_info: contactInfo,
    end_date: dateRange.endDate,
    image_url: imageUrl,
    is_active: isActive,
    start_date: dateRange.startDate,
  }).select("id").single();

  if (dbError) return { error: `DB insert failed: ${dbError.message}` };

  return {
    adId: ad?.id,
    companyName,
    isActive,
    success: `Ad for ${companyName} created.`,
  };
}
