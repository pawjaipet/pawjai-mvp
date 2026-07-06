"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { sanitizeNextPath } from "@/utils/account-model";
import {
  getShelterPortalTarget,
  resolveShelterPilotLoginIdentifier,
} from "@/utils/shelter-portal";
import { createClient } from "@/utils/supabase/server";

function shelterLoginRedirect(message: string): never {
  const params = new URLSearchParams();
  params.set("message", message);
  redirect(`/shelter?${params.toString()}`);
}

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function signInShelterPortalAction(formData: FormData) {
  const identifier = getString(formData, "identifier") || getString(formData, "email");
  const email = resolveShelterPilotLoginIdentifier(identifier);
  const password = getString(formData, "password");

  if (!email) {
    shelterLoginRedirect("Enter a valid shelter username.");
  }

  if (!password) {
    shelterLoginRedirect("Enter the account password.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    shelterLoginRedirect("Sign-in failed. Check the username and password.");
  }

  const context = await getAdminAuthContext({ includePhraseGate: false });
  if (!context || context.role !== "shelter_admin") {
    await supabase.auth.signOut();
    shelterLoginRedirect("This account is not linked to a shelter portal.");
  }

  const redirectTo = await getShelterPortalTarget(context);
  if (!redirectTo || sanitizeNextPath(redirectTo) !== redirectTo) {
    await supabase.auth.signOut();
    shelterLoginRedirect("This shelter account is not linked to a shelter yet.");
  }

  revalidatePath("/shelter");
  redirect(redirectTo);
}

export async function signOutShelterPortalAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/shelter");
  redirect("/shelter");
}
