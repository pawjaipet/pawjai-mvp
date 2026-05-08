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

export function formatAppointmentDateTime(date: string, time: string): string {
  const [hour = "0", minute = "0"] = time.split(":");
  const appointment = new Date(`${date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00`);

  const dateLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(appointment);
  const timeLabel = new Intl.DateTimeFormat("en-US", { timeStyle: "short" }).format(appointment);

  return `${dateLabel} at ${timeLabel}`;
}
