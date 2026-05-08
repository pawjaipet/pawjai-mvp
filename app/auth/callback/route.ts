import { NextResponse, type NextRequest } from "next/server";
import { ensureAdopterForUser } from "@/utils/adopter";
import { sanitizeNextPath } from "@/utils/account-model";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const redirectTo = new URL(nextPath, request.url);

  if (!code) {
    const authUrl = new URL("/auth", request.url);
    authUrl.searchParams.set("next", nextPath);
    authUrl.searchParams.set("message", "Google sign in did not return a code.");
    return NextResponse.redirect(authUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const authUrl = new URL("/auth", request.url);
    authUrl.searchParams.set("next", nextPath);
    authUrl.searchParams.set("message", error.message);
    return NextResponse.redirect(authUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await ensureAdopterForUser(supabase, user);
  }

  return NextResponse.redirect(redirectTo);
}
