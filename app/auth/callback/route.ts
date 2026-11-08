import { NextResponse, type NextRequest } from "next/server";
import { ensureAdopterForUser } from "@/utils/adopter";
import { friendlyAuthMessage, sanitizeNextPath } from "@/utils/account-model";
import {
  AUTH_ANALYTICS_COOKIE,
  AUTH_ANALYTICS_COOKIE_MAX_AGE_SECONDS,
  authAnalyticsReceipt,
  authErrorReason,
  serializeAuthAnalyticsReceipts,
  type AuthAnalyticsReceipt,
} from "@/utils/auth-analytics";
import { createClient } from "@/utils/supabase/server";

function attachAuthReceipts(response: NextResponse, receipts: AuthAnalyticsReceipt[]) {
  const value = serializeAuthAnalyticsReceipts(receipts);
  if (!value) return response;
  response.cookies.set(AUTH_ANALYTICS_COOKIE, value, {
    maxAge: AUTH_ANALYTICS_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

function redirectToAuth(
  request: NextRequest,
  nextPath: string,
  message: string,
  receipts: AuthAnalyticsReceipt[] = [],
) {
  const authUrl = new URL("/auth", request.url);
  authUrl.searchParams.set("next", nextPath);
  authUrl.searchParams.set("message", friendlyAuthMessage(message));
  return attachAuthReceipts(NextResponse.redirect(authUrl), receipts);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const redirectTo = new URL(nextPath, request.url);

  if (!code) {
    return redirectToAuth(
      request,
      nextPath,
      "This sign-in or verification link is missing or expired. Please open the newest email from PawJai or sign in again.",
      [authAnalyticsReceipt({
        event: "auth_failed",
        method: "google",
        mode: "login",
        reason: "missing_link_params",
        stage: "oauth_callback",
      })],
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectToAuth(request, nextPath, error.message, [authAnalyticsReceipt({
      event: "auth_failed",
      method: "google",
      mode: "login",
      reason: authErrorReason(error),
      stage: "oauth_callback",
    })]);
  }

  let profileReady = false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Authenticated user was unavailable after callback.");
    await ensureAdopterForUser(supabase, user);
    profileReady = true;
  } catch (error) {
    console.error("Auth callback profile setup failed", error);
    return redirectToAuth(
      request,
      nextPath,
      "Your email was verified, but PawJai could not finish preparing your profile. Please sign in once more.",
      [authAnalyticsReceipt({
        event: "auth_failed",
        method: "google",
        mode: "login",
        reason: "profile_setup",
        stage: "profile_setup",
      })],
    );
  }

  return attachAuthReceipts(NextResponse.redirect(redirectTo), profileReady ? [authAnalyticsReceipt({
    event: "login",
    method: "google",
    mode: "login",
    reason: "confirmed",
    stage: "profile_setup",
  })] : []);
}
