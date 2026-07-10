"use server";

import { revalidatePath } from "next/cache";
import {
  isAdsPartnerGateOpen,
  openAdsPartnerGate,
  validateAdsPartnerCredentials,
} from "@/utils/ads-partner-auth";
import { createAdFromFormData } from "@/utils/ad-submissions";

export type AdsGateState = {
  message: string;
  status: "idle" | "success" | "error";
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
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData,
) {
  if (!(await isAdsPartnerGateOpen())) {
    return { error: "Sign in to the ads workspace first." };
  }

  const result = await createAdFromFormData(formData);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/ads");
  revalidatePath("/admin/ads");
  revalidatePath("/admindraft");
  revalidatePath("/");

  return { success: result.success };
}
