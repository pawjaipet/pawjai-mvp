"use server";

import { openAdminGate, validateAdminPassphrase } from "@/utils/admin-auth";

export type AdsGateState = {
  message: string;
  status: "idle" | "success" | "error";
};

export async function unlockAdsGateAction(
  _prevState: AdsGateState,
  formData: FormData,
): Promise<AdsGateState> {
  const passphrase = String(formData.get("passphrase") ?? "");

  if (!validateAdminPassphrase(passphrase)) {
    return {
      message: "That password is incorrect.",
      status: "error",
    };
  }

  await openAdminGate();

  return {
    message: "Access granted. Reloading ads onboarding...",
    status: "success",
  };
}
