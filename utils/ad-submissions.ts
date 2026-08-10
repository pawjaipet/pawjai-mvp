import "server-only";

import { uploadBufferToBackblaze } from "@/utils/backblaze";
import {
  DEFAULT_AD_CREATIVE_SETTINGS,
  type AdCreativeSettings,
} from "@/utils/ad-creative-settings";
import { parseAdDateRange } from "@/utils/ad-date-range";
import { createAdminClient } from "@/utils/supabase/admin";
import { normalizeAdClickUrl } from "@/utils/ad-click-url";
import { OPEN_ENDED_AD_END_DATE, type AdReviewStatus } from "@/utils/ad-workflow";
import { generateAdSubmissionCode } from "@/utils/ad-codes";
import { optimizeAdMedia } from "@/utils/ad-media";

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
  mediaType?: "image" | "video";
  reviewStatus?: AdReviewStatus;
  startDate?: string;
  submissionCode?: string;
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
    creativeSettings?: AdCreativeSettings;
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
  const submissionCode = generateAdSubmissionCode();

  if (!companyName) return { error: "Company name is required." };
  if (!clickUrl) return { error: "Click URL is required." };
  if (!imageFile || imageFile.size === 0) return { error: "Ad image or video is required." };
  const creativeSettings = options.creativeSettings ?? DEFAULT_AD_CREATIVE_SETTINGS;
  const maxBytes = creativeSettings.maxUploadMb * 1024 * 1024;
  if (imageFile.size > maxBytes) return { error: `Ad media must be under ${creativeSettings.maxUploadMb} MB.` };

  let dateRange: ReturnType<typeof parseAdDateRange>;
  try {
    dateRange = parseAdDateRange(formData.get("start_date"), formData.get("end_date"), {
      defaultEndDate: options.defaultEndDate ?? OPEN_ENDED_AD_END_DATE,
      minStartDate: options.minStartDate,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Dates are invalid." };
  }

  let optimizedMedia: Awaited<ReturnType<typeof optimizeAdMedia>>;
  try {
    optimizedMedia = await optimizeAdMedia(imageFile, creativeSettings);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ad media could not be optimized." };
  }

  const desiredPath = `ads/${Date.now()}-${randomHex(4)}.${optimizedMedia.extension}`;

  let imageUrl: string;
  try {
    const uploaded = await uploadBufferToBackblaze({
      body: optimizedMedia.body,
      contentType: optimizedMedia.contentType,
      desiredPath,
    });
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
    media_type: optimizedMedia.mediaType,
    start_date: dateRange.startDate,
    submission_code: submissionCode,
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
    mediaType: optimizedMedia.mediaType,
    reviewStatus,
    startDate: dateRange.startDate,
    submissionCode,
    success: reviewStatus === "pending"
      ? `Ad for ${companyName} submitted for review.`
      : `Ad for ${companyName} created.`,
  };
}
