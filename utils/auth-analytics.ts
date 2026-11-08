export const AUTH_ANALYTICS_COOKIE = "pawjai_ga_auth";
export const AUTH_ANALYTICS_COOKIE_MAX_AGE_SECONDS = 60;

export type AuthAnalyticsEventName = "auth_failed" | "email_verified" | "login";
export type AuthAnalyticsMethod = "email" | "google";
export type AuthAnalyticsMode = "login" | "signup" | "verify";
export type AuthAnalyticsStage =
  | "code_entry"
  | "credentials"
  | "email_link"
  | "oauth_callback"
  | "profile_setup"
  | "resend";

export type AuthAnalyticsReceipt = {
  event: AuthAnalyticsEventName;
  method: AuthAnalyticsMethod;
  mode: AuthAnalyticsMode;
  reason: string;
  stage: AuthAnalyticsStage;
};

type ProfilePreparationResult = { ok: true } | { ok: false; error: string };
type ReceiptStore = {
  read: (name: string) => string | null;
  remove: (name: string) => void;
};

const EVENTS = new Set<AuthAnalyticsEventName>(["auth_failed", "email_verified", "login"]);
const METHODS = new Set<AuthAnalyticsMethod>(["email", "google"]);
const MODES = new Set<AuthAnalyticsMode>(["login", "signup", "verify"]);
const STAGES = new Set<AuthAnalyticsStage>([
  "code_entry",
  "credentials",
  "email_link",
  "oauth_callback",
  "profile_setup",
  "resend",
]);
const REASONS = new Set([
  "auth_error",
  "browser_validation",
  "confirmed",
  "email_address_invalid",
  "email_not_confirmed",
  "invalid_code_format",
  "invalid_credentials",
  "missing_credential",
  "missing_link_params",
  "otp_expired",
  "over_email_send_rate_limit",
  "over_request_rate_limit",
  "profile_setup",
  "signup_disabled",
  "user_already_exists",
  "validation",
  "weak_password",
]);
const RECEIPT_VERSION = "v1";
const MAX_RECEIPTS = 3;

function isSetValue<T extends string>(values: Set<T>, value: string): value is T {
  return values.has(value as T);
}

export function safeAuthAnalyticsReason(reason: unknown) {
  return typeof reason === "string" && REASONS.has(reason) ? reason : "auth_error";
}

export function authErrorReason(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (REASONS.has(code)) return code;

  const message = error instanceof Error
    ? error.message
    : error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "";
  return /expired|otp_expired/i.test(message) ? "otp_expired" : "auth_error";
}

export function authAnalyticsReceipt(input: {
  event: AuthAnalyticsEventName;
  method: AuthAnalyticsMethod;
  mode: AuthAnalyticsMode;
  reason?: unknown;
  stage: AuthAnalyticsStage;
}): AuthAnalyticsReceipt {
  return {
    event: input.event,
    method: input.method,
    mode: input.mode,
    reason: safeAuthAnalyticsReason(input.reason ?? "confirmed"),
    stage: input.stage,
  };
}

export async function completeVerifiedEmailProfile(options: {
  ensureProfile: () => Promise<ProfilePreparationResult>;
  emit: (receipt: AuthAnalyticsReceipt) => void;
  stage: "code_entry" | "email_link";
}) {
  options.emit(authAnalyticsReceipt({
    event: "email_verified",
    method: "email",
    mode: "verify",
    reason: "confirmed",
    stage: options.stage,
  }));

  const profile = await options.ensureProfile();
  if (!profile.ok) {
    options.emit(authAnalyticsReceipt({
      event: "auth_failed",
      method: "email",
      mode: "verify",
      reason: "profile_setup",
      stage: "profile_setup",
    }));
    return profile;
  }

  options.emit(authAnalyticsReceipt({
    event: "login",
    method: "email",
    mode: "verify",
    reason: "confirmed",
    stage: "profile_setup",
  }));
  return profile;
}

export function serializeAuthAnalyticsReceipts(receipts: AuthAnalyticsReceipt[]) {
  const serialized = receipts
    .filter((receipt) => (
      EVENTS.has(receipt.event)
      && METHODS.has(receipt.method)
      && MODES.has(receipt.mode)
      && STAGES.has(receipt.stage)
    ))
    .slice(0, MAX_RECEIPTS)
    .map((receipt) => [
      receipt.event,
      receipt.method,
      receipt.mode,
      receipt.stage,
      safeAuthAnalyticsReason(receipt.reason),
    ].join("."));

  return serialized.length > 0 ? `${RECEIPT_VERSION}!${serialized.join("~")}` : "";
}

function parseLegacyReceipt(value: string): AuthAnalyticsReceipt[] {
  const [event, reason] = value.split(":");
  if (event === "email_verified") {
    return [authAnalyticsReceipt({
      event,
      method: "email",
      mode: "verify",
      reason,
      stage: "email_link",
    })];
  }

  return [];
}

export function parseAuthAnalyticsReceipts(value: string): AuthAnalyticsReceipt[] {
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return [];
  }

  if (!decoded.startsWith(`${RECEIPT_VERSION}!`)) return parseLegacyReceipt(decoded);

  return decoded
    .slice(RECEIPT_VERSION.length + 1)
    .split("~")
    .slice(0, MAX_RECEIPTS)
    .flatMap((item) => {
      const [event, method, mode, stage, reason] = item.split(".");
      if (
        !isSetValue(EVENTS, event)
        || !isSetValue(METHODS, method)
        || !isSetValue(MODES, mode)
        || !isSetValue(STAGES, stage)
        || !REASONS.has(reason)
      ) return [];

      return [{ event, method, mode, stage, reason }];
    });
}

export function consumeAuthAnalyticsReceipts(store: ReceiptStore) {
  const value = store.read(AUTH_ANALYTICS_COOKIE);
  if (!value) return [];

  // Removal happens before parsing or dispatch so malformed data and analytics failures cannot replay.
  store.remove(AUTH_ANALYTICS_COOKIE);
  return parseAuthAnalyticsReceipts(value);
}
