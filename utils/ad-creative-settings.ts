import "server-only";

import type { Json } from "@/types/database";
import { createAdminClient } from "@/utils/supabase/admin";

export type AdCreativeSettings = {
  height: number;
  maxUploadMb: number;
  maxVideoSeconds: number;
  width: number;
};

export const AD_CREATIVE_SETTINGS_KEY = "ads_creative_specs";

export const DEFAULT_AD_CREATIVE_SETTINGS: AdCreativeSettings = {
  height: 560,
  maxUploadMb: 100,
  maxVideoSeconds: 30,
  width: 370,
};

function clampInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), min), max);
}

function gcd(left: number, right: number): number {
  return right === 0 ? left : gcd(right, left % right);
}

export function normalizeAdCreativeSettings(value: unknown): AdCreativeSettings {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  return {
    height: clampInteger(source.height, DEFAULT_AD_CREATIVE_SETTINGS.height, 320, 1200),
    maxUploadMb: clampInteger(source.maxUploadMb, DEFAULT_AD_CREATIVE_SETTINGS.maxUploadMb, 10, 200),
    maxVideoSeconds: clampInteger(source.maxVideoSeconds, DEFAULT_AD_CREATIVE_SETTINGS.maxVideoSeconds, 5, 30),
    width: clampInteger(source.width, DEFAULT_AD_CREATIVE_SETTINGS.width, 240, 900),
  };
}

export function adCreativeRatioLabel(settings: AdCreativeSettings) {
  const divisor = gcd(settings.width, settings.height);
  return `${settings.width / divisor}:${settings.height / divisor}`;
}

export function adCreativeSpecLines(settings: AdCreativeSettings) {
  return [
    `Best size: ${settings.width} x ${settings.height} px vertical`,
    `Safe ratio: ${adCreativeRatioLabel(settings)} portrait`,
    "Images: JPG, PNG, WebP, HEIC, or HEIF",
    `Videos: MP4 or MOV, ${settings.maxVideoSeconds}s max, under ${settings.maxUploadMb} MB`,
  ];
}

export async function fetchAdCreativeSettings(): Promise<AdCreativeSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", AD_CREATIVE_SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    console.error("ad creative settings fetch failed", error);
    return DEFAULT_AD_CREATIVE_SETTINGS;
  }

  return normalizeAdCreativeSettings(data?.value);
}

export async function saveAdCreativeSettings(settings: AdCreativeSettings) {
  const supabase = createAdminClient();
  return supabase
    .from("site_settings")
    .upsert({
      key: AD_CREATIVE_SETTINGS_KEY,
      updated_at: new Date().toISOString(),
      value: settings as unknown as Json,
    }, {
      onConflict: "key",
    });
}
