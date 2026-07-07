import { createHash, createHmac, randomBytes } from "node:crypto";

const CHECK_IN_TOKEN_BYTES = 32;

export function formatBookingCode(appointmentId: string) {
  const compact = appointmentId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `APT-${compact.slice(0, 5)}`;
}

export function normalizeBookingCodeSearch(value: string) {
  const compact = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!compact) return "";
  return compact.startsWith("APT") ? `APT-${compact.slice(3)}` : `APT-${compact}`;
}

export function createCheckInToken() {
  return randomBytes(CHECK_IN_TOKEN_BYTES).toString("base64url");
}

export function hashCheckInToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSignedCheckInToken({
  appointmentId,
  secret,
}: {
  appointmentId: string;
  secret: string;
}) {
  const payload = Buffer.from(appointmentId).toString("base64url");
  const signature = createHmac("sha256", secret).update(appointmentId).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySignedCheckInToken({
  token,
  secret,
}: {
  token: string;
  secret: string;
}) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  try {
    const appointmentId = Buffer.from(payload, "base64url").toString("utf8");
    if (!appointmentId) return null;

    const expected = createHmac("sha256", secret).update(appointmentId).digest("base64url");
    return signature === expected ? appointmentId : null;
  } catch {
    return null;
  }
}

export function getCheckInTokenSecret() {
  const secret = process.env.PAWJAI_BOOKING_TOKEN_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("Missing PAWJAI_BOOKING_TOKEN_SECRET or SUPABASE_SERVICE_ROLE_KEY for booking QR tokens.");
  }
  return secret;
}

export function buildCheckInUrl({
  origin,
  token,
}: {
  origin: string;
  token: string;
}) {
  const url = new URL("/booking/check-in", origin);
  url.searchParams.set("token", token);
  return url.toString();
}

export function buildAdminBookingDetailPath({
  appointmentId,
  token,
}: {
  appointmentId: string;
  token?: string;
}) {
  const path = `/admin/bookings/${appointmentId}`;
  if (!token) return path;

  const params = new URLSearchParams();
  params.set("token", token);
  return `${path}?${params.toString()}`;
}
