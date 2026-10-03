"use client";

// Public measurement identifier, not a credential. No paid analytics services.
export const GA_ID = "G-PPD6QKJEHR";
export const GA_CONSENT_KEY = "pawjai_ga_consent_v1";
export const GA_CHANGE_EVENT = "pawjai:analytics-consent";
type Gtag = (...args: unknown[]) => void;
type GAWindow = Window & { "ga-disable-G-PPD6QKJEHR"?: boolean; dataLayer?: unknown[]; gtag?: Gtag };
let initialized = false;
let lastPage: string | null = null;
let memoryConsent: string | null = null;

export function analyticsHost() {
  return typeof window !== "undefined" && ["www.pawjaipet.com", "pawjaipet.com"].includes(window.location.hostname);
}

export function analyticsConsent() {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(GA_CONSENT_KEY) ?? memoryConsent; } catch { return memoryConsent; }
}

export function analyticsPath(path: string) {
  const clean = path.split(/[?#]/)[0];
  if (!clean.startsWith("/") || clean.startsWith("//") || /^\/(admin|admindraft|shelter|ads|api|booking|doglistings)(\/|$)/.test(clean)) return null;
  // Private resource identifiers and arbitrary paths never go to Google.
  if (/^\/dogs\/[0-9a-f-]{36}(\/donate)?$/i.test(clean)) return clean;
  if (/^\/schedule\/[0-9a-f-]{36}$/i.test(clean)) return "/schedule";
  if (/^\/appointments\//.test(clean)) return "/appointments/detail";
  if (/^\/adopted\//.test(clean)) return "/adopted/detail";
  const routes = ["/", "/swipe", "/dogs", "/filter", "/profile", "/appointments", "/schedule", "/documents", "/adopted", "/about", "/more", "/settings", "/settings/subscription", "/donations", "/auth", "/privacy", "/terms"];
  return routes.includes(clean) ? clean : null;
}

export function safeAnalyticsLocation(path: string, search = "") {
  const url = new URL(analyticsPath(path) ?? "/", "https://www.pawjaipet.com");
  const params = new URLSearchParams(search);
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const value = params.get(key);
    if (value && /^[\p{L}\p{N} _.-]{1,100}$/u.test(value)) url.searchParams.set(key, value);
  }
  return url.toString();
}

export function setAnalyticsConsent(value: "granted" | "denied") {
  memoryConsent = value;
  try { window.localStorage.setItem(GA_CONSENT_KEY, value); } catch { /* Optional storage. */ }
  const w = window as GAWindow;
  w["ga-disable-G-PPD6QKJEHR"] = value !== "granted";
  if (initialized) w.gtag?.("consent", "update", { analytics_storage: value, ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  if (value === "denied") {
    lastPage = null;
    // Remove GA cookies when consent is withdrawn, including domain cookies.
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.trim().split("=")[0];
      if (!/^_ga($|_)/.test(name)) continue;
      for (const domain of ["", ";domain=.pawjaipet.com", `;domain=${window.location.hostname}`]) {
        document.cookie = `${name}=;Max-Age=0;path=/${domain};SameSite=Lax`;
      }
    }
  }
  window.dispatchEvent(new Event(GA_CHANGE_EVENT));
}

export function syncAnalyticsConsent(enabled: boolean) {
  const w = window as GAWindow;
  w["ga-disable-G-PPD6QKJEHR"] = !enabled;
  if (initialized) w.gtag?.("consent", "update", { analytics_storage: enabled ? "granted" : "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  if (!enabled) lastPage = null;
}

export function initializeAnalytics() {
  if (!analyticsHost() || analyticsConsent() !== "granted" || !analyticsPath(window.location.pathname)) return false;
  (window as GAWindow)["ga-disable-G-PPD6QKJEHR"] = false;
  if (initialized) return true;
  const w = window as GAWindow;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () { w.dataLayer!.push(arguments); };
  w.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  w.gtag("js", new Date());
  w.gtag("config", GA_ID, {
    send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
    page_location: safeAnalyticsLocation(window.location.pathname, window.location.search),
    page_referrer: safeReferrer(), page_title: "PawJai",
  });
  initialized = true;
  return true;
}

function safeReferrer() {
  try { return new URL(document.referrer).origin; } catch { return ""; }
}

const PARAMS = new Set(["method", "mode", "step", "reason", "feature", "dog_id", "dogs_viewed", "swipes", "duration_seconds", "answered_count", "destination", "surface"]);
export function trackGA(name: string, params: Record<string, string | number | boolean | null> = {}) {
  try {
    if (!initializeAnalytics()) return;
    const path = analyticsPath(window.location.pathname);
    if (!path) return;
    const safe = Object.fromEntries(Object.entries(params).filter(([key, value]) => PARAMS.has(key) && (typeof value === "number" ? Number.isFinite(value) : typeof value === "string" && /^[a-zA-Z0-9_/.:-]{1,100}$/.test(value))));
    (window as GAWindow).gtag?.("event", name, { ...safe, page_location: safeAnalyticsLocation(path, window.location.search), page_title: path, page_referrer: safeReferrer(), send_to: GA_ID });
  } catch { /* Analytics never blocks adoption. */ }
}

export function trackGAPage(path: string) {
  if (analyticsConsent() !== "granted") return;
  const safe = analyticsPath(path);
  if (!safe) { lastPage = null; return; }
  const location = safeAnalyticsLocation(safe, window.location.search);
  if (lastPage === location) return;
  if (!initializeAnalytics()) return;
  lastPage = location;
  (window as GAWindow).gtag?.("set", { page_location: location, page_title: safe, page_referrer: safeReferrer() });
  trackGA("page_view");
}

export function authErrorReason(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  return ["invalid_credentials", "email_not_confirmed", "user_already_exists", "weak_password", "over_request_rate_limit", "over_email_send_rate_limit", "otp_expired", "email_address_invalid", "signup_disabled"].includes(code) ? code : "auth_error";
}
