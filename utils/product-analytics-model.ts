export const PRODUCT_ANALYTICS_EVENT_NAMES = [
  "page_view",
  "dog_profile_view",
  "dog_feed_impression",
  "dog_shared",
  "feed_session_summary",
  "booking_started",
  "booking_succeeded",
  "booking_failed",
  "subscription_limit_prompt",
  "subscription_changed",
] as const;

export type ProductAnalyticsEventName = (typeof PRODUCT_ANALYTICS_EVENT_NAMES)[number];

const PRIVATE_PATH_PREFIXES = [
  "/admin",
  "/admindraft",
  "/ads",
  "/api",
  "/booking",
  "/shelter",
];

export function isProductAnalyticsEventName(value: unknown): value is ProductAnalyticsEventName {
  return typeof value === "string"
    && PRODUCT_ANALYTICS_EVENT_NAMES.includes(value as ProductAnalyticsEventName);
}

export function isTrackablePublicPath(path: string) {
  return path.startsWith("/")
    && path.length <= 500
    && !PRIVATE_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function dogIdFromPublicPath(path: string) {
  const match = path.match(/^\/dogs\/([0-9a-f-]{36})\/?$/i);
  return match?.[1] ?? null;
}

export function dogIdFromSchedulePath(path: string, search = "") {
  const routeMatch = path.match(/^\/schedule\/([0-9a-f-]{36})\/?$/i);
  if (routeMatch?.[1]) return routeMatch[1];

  if (path !== "/schedule") return null;
  const queryDogId = new URLSearchParams(search).get("dogId");
  return queryDogId && /^[0-9a-f-]{36}$/i.test(queryDogId) ? queryDogId : null;
}
