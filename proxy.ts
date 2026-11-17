import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import {
  ANALYTICS_VISITOR_COOKIE,
  analyticsVisitorCookie,
  shouldIssueVisitorCookie,
} from "@/utils/analytics-visitor";

export async function proxy(request: NextRequest) {
  // Feed pages assign photo-experiment variants on the server. Issue the
  // existing first-party analytics visitor cookie before rendering so a new
  // visitor's first feed view is already stable across refreshes.
  const issuedVisitorId = shouldIssueVisitorCookie(
    request.method,
    request.nextUrl.pathname,
    request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value,
  ) ? crypto.randomUUID() : null;
  if (issuedVisitorId) request.cookies.set(ANALYTICS_VISITOR_COOKIE, issuedVisitorId);

  const response = await updateSession(request);
  if (issuedVisitorId) response.cookies.set(analyticsVisitorCookie(issuedVisitorId));
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
