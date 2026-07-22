"use server";

import { revalidatePath } from "next/cache";
import {
  isAdsPartnerGateOpen,
  openAdsPartnerGate,
  validateAdsPartnerCredentials,
} from "@/utils/ads-partner-auth";
import { createAdFromFormData } from "@/utils/ad-submissions";
import { sendAdSubmissionConfirmation } from "@/utils/ad-email";

export type AdsGateState = {
  message: string;
  status: "idle" | "success" | "error";
};

export type PartnerAdCreateState = {
  ad?: {
    clickUrl: string;
    companyName: string;
    contactEmail: string | null;
    contactPhone: string | null;
    endDate: string;
    id: string;
    imageUrl: string;
    startDate: string;
    submissionCode: string;
  };
  error?: string;
  success?: string;
};

export async function unlockAdsGateAction(
  _prevState: AdsGateState,
  formData: FormData,
): Promise<AdsGateState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!username.trim() || !password.trim()) {
    return {
      message: "Enter the ads username and password.",
      status: "error",
    };
  }

  if (!validateAdsPartnerCredentials(username, password)) {
    return {
      message: "Ads login did not match.",
      status: "error",
    };
  }

  await openAdsPartnerGate();

  return {
    message: "Ads workspace unlocked.",
    status: "success",
  };
}

export async function createPartnerAdAction(
  _prevState: PartnerAdCreateState | undefined,
  formData: FormData,
) {
  if (!(await isAdsPartnerGateOpen())) {
    return { error: "Sign in to the ads workspace first." };
  }

  const today = new Date().toISOString().slice(0, 10);
  const result = await createAdFromFormData(formData, {
    isActive: false,
    minStartDate: today,
    reviewStatus: "pending",
  });

  if (result.error) {
    return { error: result.error };
  }

  if (result.contactEmail && result.submissionCode && result.companyName && result.clickUrl && result.startDate && result.endDate) {
    try {
      await sendAdSubmissionConfirmation({
        clickUrl: result.clickUrl,
        companyName: result.companyName,
        endDate: result.endDate,
        recipientEmail: result.contactEmail,
        startDate: result.startDate,
        submissionCode: result.submissionCode,
      });
    } catch (error) {
      console.error("ad submission confirmation email failed", error);
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
          startDate: result.startDate,
          submissionCode: result.submissionCode,
        }
      : undefined,
    success: result.success,
  };
}
