"use server";

import { unlockAdminGateAction as sharedUnlockAdminGateAction } from "@/app/admin/dogs/new/actions";

export type AdsGateState = {
  message: string;
  status: "idle" | "success" | "error";
};

export async function unlockAdsGateAction(
  prevState: AdsGateState,
  formData: FormData,
): Promise<AdsGateState> {
  return sharedUnlockAdminGateAction(prevState, formData);
}
