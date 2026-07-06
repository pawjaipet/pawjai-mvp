"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeNextPath } from "@/utils/account-model";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { createClient } from "@/utils/supabase/server";

function draftLoginRedirect(message: string, nextPath = "/admindraft"): never {
  const params = new URLSearchParams();
  params.set("message", message);
  params.set("next", sanitizeNextPath(nextPath) || "/admindraft");
  redirect(`/admindraft/login?${params.toString()}`);
}

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function resolvePilotLoginIdentifier(identifier: string) {
  const normalized = identifier.trim().toLowerCase();

  if (normalized === "thevoice") return "thevoice@pawjai.co.th";
  if (normalized === "rescuedog") return "rescuedog@pawjai.co.th";
  if (normalized.includes("@")) return normalized;

  return "";
}

function buildDraftHomeForContext(context: NonNullable<Awaited<ReturnType<typeof getAdminAuthContext>>>, nextPath: string) {
  if (context.isGlobalAdmin) {
    return sanitizeNextPath(nextPath) || "/admindraft";
  }

  const shelterId = context.shelterIds[0];
  if (!shelterId) {
    return null;
  }

  const params = new URLSearchParams();
  params.set("shelter", shelterId);
  params.set("view", "profile");
  return `/admindraft?${params.toString()}`;
}

export async function signInAdminDraftAction(formData: FormData) {
  const identifier = getString(formData, "identifier") || getString(formData, "email");
  const email = resolvePilotLoginIdentifier(identifier);
  const password = getString(formData, "password");
  const nextPath = sanitizeNextPath(getString(formData, "next")) || "/admindraft";

  if (!email) {
    draftLoginRedirect("Enter a valid shelter username.", nextPath);
  }

  if (!password) {
    draftLoginRedirect("Enter the account password.", nextPath);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    draftLoginRedirect("Sign-in failed. Check the email and password.", nextPath);
  }

  const context = await getAdminAuthContext({ includePhraseGate: false });
  if (!context) {
    await supabase.auth.signOut();
    draftLoginRedirect("This account is not linked to a PawJai admin or shelter workspace.", nextPath);
  }

  const redirectTo = buildDraftHomeForContext(context, nextPath);
  if (!redirectTo) {
    await supabase.auth.signOut();
    draftLoginRedirect("This shelter account is not linked to a shelter yet.", nextPath);
  }

  revalidatePath("/admindraft");
  redirect(redirectTo);
}

export async function signOutAdminDraftAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/admindraft");
  redirect("/admindraft/login");
}
