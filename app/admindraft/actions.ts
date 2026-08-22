"use server";

import { redirect } from "next/navigation";
import {
  buildAdminLoginPath,
  getAdminAuthContext,
  sanitizeAdminNextPath,
} from "@/utils/admin-auth";

function getAdminDraftReturnPath(formData: FormData) {
  const requested = String(formData.get("returnTo") ?? "").trim();
  return sanitizeAdminNextPath(requested);
}

export async function isAdminDraftUnlocked() {
  const context = await getAdminAuthContext({ includePhraseGate: false });
  return Boolean(context?.isGlobalAdmin);
}

export async function unlockAdminDraftAction(formData: FormData) {
  const returnTo = getAdminDraftReturnPath(formData);
  redirect(buildAdminLoginPath(returnTo));
}
