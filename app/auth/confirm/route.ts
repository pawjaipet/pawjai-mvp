import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { ensureAdopterForUser } from "@/utils/adopter";
import { friendlyAuthMessage, sanitizeNextPath } from "@/utils/account-model";
import { createClient } from "@/utils/supabase/server";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
  "signup",
]);

function redirectToAuth(request: NextRequest, nextPath: string, message: string) {
  const authUrl = new URL("/auth", request.url);
  authUrl.searchParams.set("next", nextPath);
  authUrl.searchParams.set("message", friendlyAuthMessage(message));
  return NextResponse.redirect(authUrl);
}

async function verifyTokenHash(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tokenHash: string,
  type: EmailOtpType,
) {
  const typeAttempts: EmailOtpType[] =
    type === "email" ? ["email", "signup"] : type === "signup" ? ["signup", "email"] : [type];
  let lastError: { message: string } | null = null;

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
    );
  }

  const supabase = await createClient();
  const error = await verifyTokenHash(supabase, tokenHash, type);

  if (error) {
    return redirectToAuth(request, nextPath, error.message);
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await ensureAdopterForUser(supabase, user);
    }
  } catch (error) {
    console.error("Auth confirmation profile setup failed", error);
    return redirectToAuth(
      request,
      nextPath,
      "Your email was verified, but PawJai could not finish preparing your profile. Please sign in once more.",
    );
  }

  return NextResponse.redirect(redirectTo);
}
