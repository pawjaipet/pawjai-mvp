type AccountCredentialInput = {
  email: FormDataEntryValue | string | null;
  password: FormDataEntryValue | string | null;
  confirmPassword?: FormDataEntryValue | string | null;
  fullName?: FormDataEntryValue | string | null;
};

export type AccountCredentials = {
  email: string;
  password: string;
  fullName: string | null;
};

export function parseAccountCredentials(input: AccountCredentialInput): AccountCredentials {
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");
  const confirmPassword = input.confirmPassword == null ? null : String(input.confirmPassword);
  const fullName = String(input.fullName ?? "").trim() || null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  if (confirmPassword !== null && password !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  return { email, password, fullName };
}

export function optionalString(value: FormDataEntryValue | null): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

export function optionalBoolean(value: FormDataEntryValue | null): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export const AUTH_PROTECTED_PATH_PREFIXES = [
  "/appointments",
  "/documents",
  "/filter",
  "/messages",
  "/profile",
  "/schedule",
] as const;

export function isAuthProtectedPath(pathname: string): boolean {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;

  return AUTH_PROTECTED_PATH_PREFIXES.some((prefix) => {
    return normalized === prefix || normalized.startsWith(`${prefix}/`);
  });
}

export function sanitizeNextPath(value: string | null | undefined): string {
  const fallback = "/swipe";
  const candidate = String(value ?? "").trim();

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, "http://pawjai.local");

    if (parsed.origin !== "http://pawjai.local") {
      return fallback;
    }

    const pathWithQuery = `${parsed.pathname}${parsed.search}`;

    if (parsed.pathname === "/auth" || parsed.pathname.startsWith("/auth/")) {
      return fallback;
    }

    return pathWithQuery || fallback;
  } catch {
    return fallback;
  }
}

export function buildAuthPath({
  nextPath,
  reason,
}: {
  nextPath?: string | null;
  reason?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set("next", sanitizeNextPath(nextPath));

  if (reason) {
    params.set("message", reason);
  }

  return `/auth?${params.toString()}`;
}

export function friendlyAuthMessage(message: string | null | undefined): string {
  const normalized = String(message ?? "").trim();
  const lower = normalized.toLowerCase();

  if (!normalized) return "We could not finish signing you in. Please try again.";

  if (
    lower.includes("rate limit")
    || lower.includes("over email send rate")
    || lower.includes("only request this after")
    || lower.includes("too many")
  ) {
    return "Too many signup or verification emails were requested. Please wait a minute, then try again or continue with Google.";
  }

  if (lower.includes("email not confirmed") || lower.includes("confirm your email")) {
    return "Please verify your email first, then come back to sign in.";
  }

  if (
    lower.includes("invalid login credentials")
    || lower.includes("invalid credentials")
    || lower.includes("invalid email or password")
  ) {
    return "Email or password did not match. Please try again.";
  }

  if (
    lower.includes("otp")
    || lower.includes("token")
    || lower.includes("expired")
    || lower.includes("invalid grant")
    || lower.includes("invalid_grant")
    || lower.includes("auth code")
    || lower.includes("code verifier")
    || lower.includes("flow state")
  ) {
    return "This verification link is expired or already used. Please open the newest email from PawJai or sign in again.";
  }

  return normalized;
}

export function formatAppointmentDateTime(date: string, time: string): string {
  const [hour = "0", minute = "0"] = time.split(":");
  const appointment = new Date(`${date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00`);

  const dateLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(appointment);
  const timeLabel = new Intl.DateTimeFormat("en-US", { timeStyle: "short" }).format(appointment);

  return `${dateLabel} at ${timeLabel}`;
}
