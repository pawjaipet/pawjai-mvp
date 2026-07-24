"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminCookieDomains } from "@/utils/admin-cookie-scope";

const ADMIN_DRAFT_COOKIE = "pawjai_admin_draft_unlocked";
const ADMIN_DRAFT_PASSPHRASE = "pawjaiadmin!";
const ADMIN_DRAFT_COOKIE_PATHS = ["/", "/admindraft", "/booking"];

function getAdminDraftReturnPath(formData: FormData) {
  const requested = String(formData.get("returnTo") ?? "").trim();
  const isAllowedPath = requested === "/admindraft"
    || requested.startsWith("/admindraft?")
    || requested.startsWith("/admindraft/")
    || requested === "/booking"
    || requested.startsWith("/booking?")
    || requested.startsWith("/booking/");

  if (isAllowedPath) {
    return requested;
  }

  return "/admindraft";
}

function withUnlockFailed(path: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}unlock=failed`;
}

export async function isAdminDraftUnlocked() {
  const cookieStore = await cookies();
  return cookieStore.getAll(ADMIN_DRAFT_COOKIE).some((cookie) => cookie.value === "1");
}

export async function unlockAdminDraftAction(formData: FormData) {
  const phrase = String(formData.get("adminPhrase") ?? "").trim();
  const returnTo = getAdminDraftReturnPath(formData);

  if (phrase !== ADMIN_DRAFT_PASSPHRASE) {
    redirect(withUnlockFailed(returnTo));
  }

  const cookieStore = await cookies();
  const cookieDomains = await getAdminCookieDomains();
  for (const path of ADMIN_DRAFT_COOKIE_PATHS) {
    for (const domain of cookieDomains) {
      cookieStore.set({
        ...(domain ? { domain } : {}),
        httpOnly: true,
        maxAge: 60 * 60 * 8,
        name: ADMIN_DRAFT_COOKIE,
        path,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        value: "1",
      });
    }
  }

  redirect(returnTo);
}
