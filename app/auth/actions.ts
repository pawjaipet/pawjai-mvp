"use server";

import type { User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ensureAdopterForUser } from "@/utils/adopter";
import { buildAuthPath, friendlyAuthMessage, parseAccountCredentials, sanitizeNextPath } from "@/utils/account-model";
import { createClient } from "@/utils/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

function authRedirect(message: string, nextPath: string): never {
  redirect(buildAuthPath({ nextPath, reason: friendlyAuthMessage(message) }));
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

async function prepareProfileOrRedirect(supabase: ServerSupabaseClient, user: User, nextPath: string) {
  try {
    await ensureAdopterForUser(supabase, user);
  } catch (error) {
    console.error("Auth profile setup failed", error);
    authRedirect("We signed you in, but could not finish preparing your PawJai profile. Please try again.", nextPath);
  }
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

  await prepareProfileOrRedirect(supabase, data.user, nextPath);
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

  const callbackUrl = new URL("/auth/callback", await getRequestOrigin());
  callbackUrl.searchParams.set("next", nextPath);

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        full_name: null,
      },
      emailRedirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data.user) {
    authRedirect(error?.message ?? "We could not create your account.", nextPath);
  }

  if (data.session) {
    await prepareProfileOrRedirect(supabase, data.user, nextPath);
    revalidatePath("/", "layout");
    redirect(nextPath);
  }

  authRedirect("Check your email to verify your account, then sign in.", nextPath);
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
