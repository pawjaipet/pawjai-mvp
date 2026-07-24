import { NextResponse, type NextRequest } from "next/server";
import { getAdminCookieDomainsForHost } from "@/utils/admin-cookie-scope";

const ADMIN_DRAFT_COOKIE = "pawjai_admin_draft_unlocked";
const ADMIN_DRAFT_PASSPHRASE = "pawjaiadmin!";
const ADMIN_DRAFT_COOKIE_PATHS = ["/", "/admindraft", "/booking"];

function getAdminDraftReturnPath(formData: FormData) {
  const requested = String(formData.get("returnTo") ?? "").trim();
  const isAllowedPath = requested === "/admindraft"
    || requested.startsWith("/admindraft?")
    || requested.startsWith("/admindraft/")
    || requested === "/booking"
    || requested.startsWith("/booking?")
    || requested.startsWith("/booking/");

  if (isAllowedPath) {
    return requested;
  }

  return "/admindraft";
}

function withUnlockFailed(path: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}unlock=failed`;
}

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const phrase = String(formData.get("adminPhrase") ?? "").trim();
  const returnTo = getAdminDraftReturnPath(formData);

  if (phrase !== ADMIN_DRAFT_PASSPHRASE) {
    return redirectTo(request, withUnlockFailed(returnTo));
  }

  const response = redirectTo(request, returnTo);
  const cookieDomains = getAdminCookieDomainsForHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));

  for (const path of ADMIN_DRAFT_COOKIE_PATHS) {
    for (const domain of cookieDomains) {
      response.cookies.set({
        ...(domain ? { domain } : {}),
        httpOnly: true,
        maxAge: 60 * 60 * 8,
        name: ADMIN_DRAFT_COOKIE,
        path,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        value: "1",
      });
    }
  }

  return response;
}
