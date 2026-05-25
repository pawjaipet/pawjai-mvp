import { NextResponse, type NextRequest } from "next/server";
import { ensureAdopterForUser } from "@/utils/adopter";
import { friendlyAuthMessage, sanitizeNextPath } from "@/utils/account-model";
import { createClient } from "@/utils/supabase/server";

function redirectToAuth(request: NextRequest, nextPath: string, message: string) {
  const authUrl = new URL("/auth", request.url);
  authUrl.searchParams.set("next", nextPath);
  authUrl.searchParams.set("message", friendlyAuthMessage(message));
  return NextResponse.redirect(authUrl);
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
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

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
    console.error("Auth callback profile setup failed", error);
    return redirectToAuth(
      request,
      nextPath,
      "Your email was verified, but PawJai could not finish preparing your profile. Please sign in once more.",
    );
  }

  return NextResponse.redirect(redirectTo);
}
