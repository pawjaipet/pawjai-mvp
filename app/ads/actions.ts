"use server";

import { revalidatePath } from "next/cache";
import { createAdFromFormData } from "@/utils/ad-submissions";
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

export async function createPartnerAdAction(
  _prevState: PartnerAdCreateState | undefined,
  formData: FormData,
) {
  const today = new Date().toISOString().slice(0, 10);
  const result = await createAdFromFormData(formData, {
    isActive: false,
    minStartDate: today,
    reviewStatus: "pending",
  });

  if (result.error) {
    return { error: result.error };
  }

  if (result.submissionCode && result.companyName && result.clickUrl && result.startDate && result.endDate) {
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

  revalidatePath("/ads");
  revalidatePath("/admin/ads");
  revalidatePath("/admindraft");
  revalidatePath("/");

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
