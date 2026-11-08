import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { ensureAdopterForUser } from "@/utils/adopter";
import { friendlyAuthMessage, sanitizeNextPath } from "@/utils/account-model";
import {
  AUTH_ANALYTICS_COOKIE,
  AUTH_ANALYTICS_COOKIE_MAX_AGE_SECONDS,
  authAnalyticsReceipt,
  authErrorReason,
  completeVerifiedEmailProfile,
  serializeAuthAnalyticsReceipts,
  type AuthAnalyticsReceipt,
} from "@/utils/auth-analytics";
import { createClient } from "@/utils/supabase/server";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
  "signup",
]);

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

async function verifyTokenHash(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tokenHash: string,
  type: EmailOtpType,
) {
  const typeAttempts: EmailOtpType[] =
    type === "email" ? ["email", "signup"] : type === "signup" ? ["signup", "email"] : [type];
  let lastError: { code?: string; message: string } | null = null;

  for (const typeAttempt of typeAttempts) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: typeAttempt,
    });

    if (!error) return null;
    lastError = error;
  }

  return lastError;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const redirectTo = new URL(nextPath, request.url);

  if (!tokenHash || !type || !EMAIL_OTP_TYPES.has(type)) {
    return redirectToAuth(
      request,
      nextPath,
      "This verification link is missing or expired. Please open the newest email from PawJai or sign in again.",
      [authAnalyticsReceipt({
        event: "auth_failed",
        method: "email",
        mode: "verify",
        reason: "missing_link_params",
        stage: "email_link",
      })],
    );
  }

  const supabase = await createClient();
  const error = await verifyTokenHash(supabase, tokenHash, type);

  if (error) {
    return redirectToAuth(request, nextPath, error.message, [authAnalyticsReceipt({
      event: "auth_failed",
      method: "email",
      mode: "verify",
      reason: authErrorReason(error),
      stage: "email_link",
    })]);
  }

  const receipts: AuthAnalyticsReceipt[] = [];
  const ensureProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { ok: false as const, error: "Your verified session could not be loaded." };

      await ensureAdopterForUser(supabase, user);
      return { ok: true as const };
    } catch (profileError) {
      console.error("Auth confirmation profile setup failed", profileError);
      return { ok: false as const, error: "PawJai could not finish preparing your profile." };
    }
  };

  if (type === "signup" || type === "email") {
    const completion = await completeVerifiedEmailProfile({
      emit: (receipt) => receipts.push(receipt),
      ensureProfile,
      stage: "email_link",
    });
    if (!completion.ok) {
      return redirectToAuth(
        request,
        nextPath,
        "Your email was verified, but PawJai could not finish preparing your profile. Please sign in once more.",
        receipts,
      );
    }
  } else {
    const profile = await ensureProfile();
    receipts.push(authAnalyticsReceipt({
      event: profile.ok ? "login" : "auth_failed",
      method: "email",
      mode: "login",
      reason: profile.ok ? "confirmed" : "profile_setup",
      stage: "profile_setup",
    }));
    if (!profile.ok) {
      return redirectToAuth(
        request,
        nextPath,
        "Your email link worked, but PawJai could not finish preparing your profile. Please sign in once more.",
        receipts,
      );
    }
  }

  return attachAuthReceipts(NextResponse.redirect(redirectTo), receipts);
}
