type AccountCredentialInput = {
  email: FormDataEntryValue | string | null;
  password: FormDataEntryValue | string | null;
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
  const fullName = String(input.fullName ?? "").trim() || null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
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

export function formatAppointmentDateTime(date: string, time: string): string {
  const [hour = "0", minute = "0"] = time.split(":");
  const appointment = new Date(`${date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00`);

  const dateLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(appointment);
  const timeLabel = new Intl.DateTimeFormat("en-US", { timeStyle: "short" }).format(appointment);

  return `${dateLabel} at ${timeLabel}`;
}
