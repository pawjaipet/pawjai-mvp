"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_DRAFT_COOKIE = "pawjai_admin_draft_unlocked";
const ADMIN_DRAFT_PASSPHRASE = "pawjaiadmin!";
const ADMIN_DRAFT_COOKIE_PATHS = ["/admindraft", "/booking"];

export async function isAdminDraftUnlocked() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_DRAFT_COOKIE)?.value === "1";
}

export async function unlockAdminDraftAction(formData: FormData) {
  const phrase = String(formData.get("adminPhrase") ?? "").trim();

  if (phrase !== ADMIN_DRAFT_PASSPHRASE) {
    redirect("/admindraft?unlock=failed");
  }

  const cookieStore = await cookies();
  for (const path of ADMIN_DRAFT_COOKIE_PATHS) {
    cookieStore.set({
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      name: ADMIN_DRAFT_COOKIE,
      path,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      value: "1",
    });
  }

  redirect("/admindraft");
}
