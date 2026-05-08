"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ensureAdopterForUser } from "@/utils/adopter";
import { buildAuthPath, parseAccountCredentials, sanitizeNextPath } from "@/utils/account-model";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

function authRedirect(message: string, nextPath: string): never {
  redirect(buildAuthPath({ nextPath, reason: message }));
}

function getFormNext(formData: FormData): string {
  return sanitizeNextPath(String(formData.get("next") ?? ""));
}

async function getRequestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";

  return `${protocol}://${host}`;
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const nextPath = getFormNext(formData);
  let credentials;

  try {
    credentials = parseAccountCredentials({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  } catch (error) {
    authRedirect(error instanceof Error ? error.message : "Please check your details.", nextPath);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error || !data.user) {
    authRedirect(error?.message ?? "We could not sign you in.", nextPath);
  }

  await ensureAdopterForUser(supabase, data.user);
  revalidatePath("/", "layout");
  redirect(nextPath);
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const nextPath = getFormNext(formData);
  let credentials;

  try {
    credentials = parseAccountCredentials({
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
  } catch (error) {
    authRedirect(error instanceof Error ? error.message : "Please check your details.", nextPath);
  }

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        full_name: null,
      },
    },
  });

  if (error || !data.user) {
    authRedirect(error?.message ?? "We could not create your account.", nextPath);
  }

  if (data.session) {
    await ensureAdopterForUser(supabase, data.user);
    revalidatePath("/", "layout");
    redirect(nextPath);
  }

  authRedirect("Check your email to confirm your account, then sign in.", nextPath);
}

export async function createPasswordAccount(
  formData: FormData,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  let credentials;

  try {
    credentials = parseAccountCredentials({
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Please check your details.",
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: credentials.email,
    password: credentials.password,
    email_confirm: true,
    user_metadata: {
      full_name: null,
    },
  });

  if (error || !data.user) {
    const message = error?.message ?? "We could not create your account.";
    return {
      ok: false,
      error: /already|registered|exists/i.test(message)
        ? "That email already has an account. Try logging in."
        : message,
    };
  }

  await ensureAdopterForUser(admin, data.user);
  revalidatePath("/", "layout");
  return { ok: true, email: credentials.email };
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const nextPath = getFormNext(formData);
  const callbackUrl = new URL("/auth/callback", await getRequestOrigin());
  callbackUrl.searchParams.set("next", nextPath);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data.url) {
    authRedirect(error?.message ?? "We could not start Google sign in.", nextPath);
  }

  redirect(data.url);
}

export async function ensureCurrentUserProfile(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Please sign in again." };
  }

  try {
    await ensureAdopterForUser(supabase, user);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "We could not prepare your account.",
    };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth");
}
