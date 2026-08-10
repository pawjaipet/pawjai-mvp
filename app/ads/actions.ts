"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { createAdFromFormData, createAdFromUploadedMedia } from "@/utils/ad-submissions";
import { fetchAdCreativeSettings } from "@/utils/ad-creative-settings";
import { createBackblazeUploadTarget } from "@/utils/backblaze";
import {
  sendAdSubmissionConfirmation,
  sendPawjaiAdSubmissionNotification,
} from "@/utils/ad-email";

export type PartnerAdCreateState = {
  ad?: {
    clickUrl: string;
    companyName: string;
    contactEmail: string | null;
    contactPhone: string | null;
    endDate: string;
    id: string;
    imageUrl: string;
    mediaType: "image" | "video";
    startDate: string;
    submissionCode: string;
  };
  error?: string;
  success?: string;
};

export type PartnerAdUploadTargetState = {
  authorizationToken?: string;
  contentType?: string;
  error?: string;
  fileName?: string;
  mediaType?: "image" | "video";
  publicUrl?: string;
  uploadUrl?: string;
};

function extensionFromFileName(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function normalizeVideoContentType(contentType: string, extension: string) {
  const type = contentType.split(";")[0]?.trim().toLowerCase();
  if (type === "video/mp4" || extension === "mp4") return "video/mp4";
  if (type === "video/quicktime" || extension === "mov") return "video/quicktime";
  return "";
}

async function sendPartnerAdEmails(result: Awaited<ReturnType<typeof createAdFromFormData>>) {
  if (!result.submissionCode || !result.companyName || !result.clickUrl || !result.startDate || !result.endDate) {
    return;
  }

  try {
    const emailDetails = {
      clickUrl: result.clickUrl,
      companyName: result.companyName,
      contactEmail: result.contactEmail,
      contactPhone: result.contactPhone,
      endDate: result.endDate,
      mediaType: result.mediaType ?? "image",
      recipientEmail: result.contactEmail,
      startDate: result.startDate,
      submissionCode: result.submissionCode,
    };
    const emailResults = await Promise.all([
      sendAdSubmissionConfirmation(emailDetails),
      sendPawjaiAdSubmissionNotification(emailDetails),
    ]);
    for (const emailResult of emailResults) {
      if ("error" in emailResult && emailResult.error) {
        console.error("ad submission email failed", emailResult.error);
      }
    }
  } catch (error) {
    console.error("ad submission email failed", error);
  }
}

function revalidatePartnerAdSurfaces() {
  revalidatePath("/ads");
  revalidatePath("/admin/ads");
  revalidatePath("/admindraft");
  revalidatePath("/");
}

function toPartnerAdState(result: Awaited<ReturnType<typeof createAdFromFormData>>): PartnerAdCreateState {
  if (result.error) {
    return { error: result.error };
  }

  return {
    ad: result.adId && result.imageUrl && result.companyName && result.clickUrl && result.startDate && result.endDate && result.submissionCode
      ? {
          clickUrl: result.clickUrl,
          companyName: result.companyName,
          contactEmail: result.contactEmail ?? null,
          contactPhone: result.contactPhone ?? null,
          endDate: result.endDate,
          id: result.adId,
          imageUrl: result.imageUrl,
          mediaType: result.mediaType ?? "image",
          startDate: result.startDate,
          submissionCode: result.submissionCode,
        }
      : undefined,
    success: result.success,
  };
}

export async function createPartnerAdAction(
  _prevState: PartnerAdCreateState | undefined,
  formData: FormData,
) {
  const today = new Date().toISOString().slice(0, 10);
  const creativeSettings = await fetchAdCreativeSettings();
  const result = await createAdFromFormData(formData, {
    creativeSettings,
    isActive: false,
    minStartDate: today,
    reviewStatus: "pending",
  });

  if (result.error) {
    return { error: result.error };
  }

  await sendPartnerAdEmails(result);

  revalidatePartnerAdSurfaces();

  return toPartnerAdState(result);
}

export async function prepareDirectAdMediaUploadAction(input: {
  contentType: string;
  fileName: string;
  mediaType: "image" | "video";
  size: number;
}): Promise<PartnerAdUploadTargetState> {
  const creativeSettings = await fetchAdCreativeSettings();
  const extension = extensionFromFileName(input.fileName);
  const maxBytes = creativeSettings.maxUploadMb * 1024 * 1024;

  if (input.mediaType !== "video") {
    return { error: "Direct upload is only enabled for video ads." };
  }

  if (!input.size || input.size > maxBytes) {
    return { error: `Ad media must be under ${creativeSettings.maxUploadMb} MB.` };
  }

  const contentType = normalizeVideoContentType(input.contentType, extension);
  if (!contentType) {
    return { error: "File must be an MP4 or MOV video." };
  }

  const uploadExtension = extension === "mov" ? "mov" : "mp4";
  const desiredPath = `ads/${Date.now()}-${randomBytes(4).toString("hex")}.${uploadExtension}`;

  try {
    const target = await createBackblazeUploadTarget({ contentType, desiredPath });
    return {
      ...target,
      mediaType: "video",
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not prepare video upload." };
  }
}

export async function createPartnerAdFromUploadedMediaAction(
  _prevState: PartnerAdCreateState | undefined,
  formData: FormData,
) {
  const today = new Date().toISOString().slice(0, 10);
  const result = await createAdFromUploadedMedia(formData, {
    isActive: false,
    minStartDate: today,
    reviewStatus: "pending",
  });

  if (result.error) {
    return { error: result.error };
  }

  await sendPartnerAdEmails(result);
  revalidatePartnerAdSurfaces();

  return toPartnerAdState(result);
}
