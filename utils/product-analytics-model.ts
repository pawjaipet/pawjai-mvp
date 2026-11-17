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
  "dog_photo_exposure",
] as const;

export type ProductAnalyticsEventName = (typeof PRODUCT_ANALYTICS_EVENT_NAMES)[number];

// Experiment measurement stays first-party: never forwarded to Google Analytics.
export const FIRST_PARTY_ONLY_EVENT_NAMES: readonly ProductAnalyticsEventName[] = ["dog_photo_exposure"];

// Inserted separately from other events. Until migration
// 20261117160000_photo_experiment_exposure_event.sql is applied, the database
// constraint rejects these rows; isolation keeps that from discarding the
// page views and other events that arrived in the same batch.
export const ISOLATED_EVENT_NAMES: readonly ProductAnalyticsEventName[] = ["dog_photo_exposure"];

export function isFirstPartyOnlyEvent(eventName: ProductAnalyticsEventName) {
  return FIRST_PARTY_ONLY_EVENT_NAMES.includes(eventName);
}

export function partitionEventsForInsert<T extends { eventName: ProductAnalyticsEventName }>(events: T[]) {
  const isolated = events.filter((event) => ISOLATED_EVENT_NAMES.includes(event.eventName));
  const regular = events.filter((event) => !ISOLATED_EVENT_NAMES.includes(event.eventName));
  return { isolated, regular };
}

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
