import { buildPreferenceUpdate, type FilterAnswers } from "@/utils/adopter-preference-model";

export const GUEST_FILTER_COOKIE = "pawjai.guest-filters";

// Guest input only affects discovery. It never grants an account entitlement.
export function readGuestPreferences(raw: string | undefined) {
  if (!raw || raw.length > 3800) return null;
  try {
    const value = JSON.parse(raw) as FilterAnswers;
    if (!value || typeof value !== "object") return null;
    const validList = (list: unknown) => Array.isArray(list) && list.length <= 30 && list.every(item => typeof item === "string" && item.length <= 150);
    if (!validList(value.sizes) || !validList(value.energyLevels)) return null;
    if ([value.goodWithCats, value.goodWithDogs, value.goodWithKids].some(flag => flag !== null && typeof flag !== "boolean")) return null;
    if (value.ageRange && (!Array.isArray(value.ageRange) || value.ageRange.length !== 2 || value.ageRange.some(age => !Number.isFinite(age) || age < 0 || age > 30))) return null;
    if (value.fullAnswers && (typeof value.fullAnswers !== "object" || Object.entries(value.fullAnswers).some(([key, list]) => !/^([0-9]|1[01])$/.test(key) || !validList(list)))) return null;
    return buildPreferenceUpdate({ ...value, questionLabels: undefined });
  } catch {
    return null;
  }
}
