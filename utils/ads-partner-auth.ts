import "server-only";

import { cookies } from "next/headers";

const ADS_PARTNER_COOKIE = "pawjai_ads_partner_unlocked";
const ADS_PARTNER_COOKIE_PATH = "/ads";
const DEFAULT_ADS_PARTNER_USERNAME = "pawjaiads";
const DEFAULT_ADS_PARTNER_PASSWORD = "pawjaiadmin";

function adsPartnerUsername() {
  return (process.env.ADS_PARTNER_USERNAME ?? DEFAULT_ADS_PARTNER_USERNAME).trim().toLowerCase();
}

function adsPartnerPasswords() {
  return new Set([
    process.env.ADS_PARTNER_PASSWORD ?? DEFAULT_ADS_PARTNER_PASSWORD,
    process.env.ADS_PARTNER_FALLBACK_PASSWORD,
  ].filter((value): value is string => Boolean(value)).map((value) => value.trim()));
}

export async function isAdsPartnerGateOpen() {
  const cookieStore = await cookies();
  return cookieStore.get(ADS_PARTNER_COOKIE)?.value === "1";
}

export async function openAdsPartnerGate() {
  const cookieStore = await cookies();
  cookieStore.set({
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    name: ADS_PARTNER_COOKIE,
    path: ADS_PARTNER_COOKIE_PATH,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    value: "1",
  });
}

export async function closeAdsPartnerGate() {
  const cookieStore = await cookies();
  cookieStore.set({
    httpOnly: true,
    maxAge: 0,
    name: ADS_PARTNER_COOKIE,
    path: ADS_PARTNER_COOKIE_PATH,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    value: "",
  });
}

export function validateAdsPartnerCredentials(username: string, password: string) {
  return (
    username.trim().toLowerCase() === adsPartnerUsername() &&
    adsPartnerPasswords().has(password.trim())
  );
}
