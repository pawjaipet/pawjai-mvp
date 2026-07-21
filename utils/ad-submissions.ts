import "server-only";

import { uploadBufferToBackblaze } from "@/utils/backblaze";
import { parseAdDateRange } from "@/utils/ad-date-range";
import { createAdminClient } from "@/utils/supabase/admin";
import { normalizeAdClickUrl } from "@/utils/ad-click-url";
import { OPEN_ENDED_AD_END_DATE, type AdReviewStatus } from "@/utils/ad-workflow";

export type AdSubmissionResult = {
  adId?: string;
  clickUrl?: string;
  companyName?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  endDate?: string;
  error?: string;
  imageUrl?: string;
  isActive?: boolean;
  reviewStatus?: AdReviewStatus;
  startDate?: string;
  success?: string;
};

function randomHex(bytes = 4) {
  return Math.floor(Math.random() * 16 ** (bytes * 2))
    .toString(16)
    .padStart(bytes * 2, "0");
}

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function combineContactInfo(email: string | null, phone: string | null, fallback: string | null) {
  const parts = [
    email ? `Email: ${email}` : "",
    phone ? `Phone: ${phone}` : "",
  ].filter(Boolean);

  return parts.length ? parts.join("\n") : fallback;
}

export async function createAdFromFormData(
  formData: FormData,
  options: {
    defaultEndDate?: string;
    isActive?: boolean;
    minStartDate?: string;
    reviewStatus?: AdReviewStatus;
  } = {},
): Promise<AdSubmissionResult> {
  const companyName = (formData.get("company_name") as string)?.trim();
  const contactEmail = getString(formData, "contact_email") || null;
  const contactPhone = getString(formData, "contact_phone") || null;
  const fallbackContactInfo = getString(formData, "contact_info") || null;
  const contactInfo = combineContactInfo(contactEmail, contactPhone, fallbackContactInfo);
  let clickUrl: string;
  try {
    clickUrl = normalizeAdClickUrl(formData.get("click_url"));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Enter a valid click URL." };
  }
  const isActive = options.isActive ?? (formData.has("is_active") ? formData.get("is_active") === "on" : true);
  const reviewStatus = options.reviewStatus ?? "approved";
  const imageFile = formData.get("image_file") as File | null;

  if (!companyName) return { error: "Company name is required." };
  if (!clickUrl) return { error: "Click URL is required." };
  if (!imageFile || imageFile.size === 0) return { error: "Ad image is required." };
  if (!imageFile.type.startsWith("image/")) return { error: "File must be an image." };

  let dateRange: ReturnType<typeof parseAdDateRange>;
  try {
    dateRange = parseAdDateRange(formData.get("start_date"), formData.get("end_date"), {
      defaultEndDate: options.defaultEndDate ?? OPEN_ENDED_AD_END_DATE,
      minStartDate: options.minStartDate,
    });
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
    ad_status: reviewStatus,
    click_url: clickUrl,
    company_name: companyName,
    contact_email: contactEmail,
    contact_info: contactInfo,
    contact_phone: contactPhone,
    end_date: dateRange.endDate,
    image_url: imageUrl,
    is_active: isActive,
    start_date: dateRange.startDate,
  }).select("id").single();

  if (dbError) return { error: `DB insert failed: ${dbError.message}` };

  return {
    adId: ad?.id,
    clickUrl,
    companyName,
    contactEmail,
    contactPhone,
    endDate: dateRange.endDate,
    imageUrl,
    isActive,
    reviewStatus,
    startDate: dateRange.startDate,
    success: reviewStatus === "pending"
      ? `Ad for ${companyName} submitted for review.`
      : `Ad for ${companyName} created.`,
  };
}
