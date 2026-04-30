"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureAdopterForUser } from "@/utils/adopter";
import { parseAccountCredentials } from "@/utils/account-model";
import { createClient } from "@/utils/supabase/server";

function authRedirect(message: string): never {
  redirect(`/auth?message=${encodeURIComponent(message)}`);
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  let credentials;

  try {
    credentials = parseAccountCredentials({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  } catch (error) {
    authRedirect(error instanceof Error ? error.message : "Please check your details.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error || !data.user) {
    authRedirect(error?.message ?? "We could not sign you in.");
  }

  await ensureAdopterForUser(supabase, data.user);
  revalidatePath("/", "layout");
  redirect("/profile");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  let credentials;

  try {
    credentials = parseAccountCredentials({
      email: formData.get("email"),
      password: formData.get("password"),
      fullName: formData.get("fullName"),
    });
  } catch (error) {
    authRedirect(error instanceof Error ? error.message : "Please check your details.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        full_name: credentials.fullName,
      },
    },
  });

  if (error || !data.user) {
    authRedirect(error?.message ?? "We could not create your account.");
  }

  if (data.session) {
    await ensureAdopterForUser(supabase, data.user);
    revalidatePath("/", "layout");
    redirect("/profile");
  }

  authRedirect("Check your email to confirm your account, then sign in.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth");
}
