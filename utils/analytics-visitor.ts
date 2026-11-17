// First-party analytics visitor cookie, shared by the analytics route and proxy.
// It is the existing PawJai product-analytics identifier (not Google Analytics).
// The photo experiment reuses it as its stable assignment unit, so no new
// identifier is introduced.

export const ANALYTICS_VISITOR_COOKIE = "pawjai_analytics_visitor";
export const ANALYTICS_VISITOR_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

const VISITOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isAnalyticsVisitorId(value: unknown): value is string {
  return typeof value === "string" && VISITOR_ID_PATTERN.test(value);
}

export function analyticsVisitorCookie(value: string) {
  return {
    httpOnly: true,
    maxAge: ANALYTICS_VISITOR_MAX_AGE_SECONDS,
    name: ANALYTICS_VISITOR_COOKIE,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    value,
  };
}

/** Dog feed pages, where photo-experiment assignment happens on the server. */
const FEED_PATHS = new Set(["/", "/dogs"]);

/**
 * True when proxy should issue the visitor cookie before rendering, so the
 * very first feed render already has a stable experiment unit. Existing
 * cookies are never replaced.
 */
export function shouldIssueVisitorCookie(method: string, pathname: string, existing: string | undefined) {
  return method === "GET" && FEED_PATHS.has(pathname) && !isAnalyticsVisitorId(existing);
}
