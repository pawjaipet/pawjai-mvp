"use server";

import { cookies } from "next/headers";
import { GUEST_FILTER_COOKIE, readGuestPreferences } from "@/utils/guest-preferences";
import { createClient } from "@/utils/supabase/server";
import { ensureAdopterForUser } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  buildPreferenceUpdate,
  hasStructuredPreferenceAnswers,
  restoreAnswersFromPreference,
  restoreAnswersFromSnapshot,
  type FilterAnswers,
  type SavedFilterAnswers,
} from "@/utils/adopter-preference-model";

export type { SavedFilterAnswers } from "@/utils/adopter-preference-model";

export async function getSavedFilterPreferences(): Promise<SavedFilterAnswers | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();
  const { data: preferences } = await admin
    .from("adopter_preferences")
    .select("*")
    .eq("adopter_id", adopter.id)
    .maybeSingle();

  if (!preferences) return null;

  const snapshotAnswers = restoreAnswersFromSnapshot(preferences.filter_answers);
  if (snapshotAnswers) return snapshotAnswers;

  if (hasStructuredPreferenceAnswers(preferences)) {
    const structuredAnswers = restoreAnswersFromPreference(preferences);
    if (Object.keys(structuredAnswers).length) return structuredAnswers;
  }

  const legacyAnswers = restoreAnswersFromPreference(preferences);
  return Object.keys(legacyAnswers).length ? legacyAnswers : null;
}

export async function saveFilterPreferences(answers: FilterAnswers) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const raw = JSON.stringify({ ...answers, questionLabels: undefined });
    if (!readGuestPreferences(raw)) return { error: "Your filters could not be saved. Please try again." };
    (await cookies()).set(GUEST_FILTER_COOKIE, raw, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
    revalidatePath("/");
    revalidatePath("/swipe");
    return { error: null };
  }

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();

  const updates = buildPreferenceUpdate(answers);

  const { error } = await admin.from("adopter_preferences")
    .upsert({ adopter_id: adopter.id, ...updates }, { onConflict: "adopter_id" });
  if (error) return { error: "Your filters could not be saved. Your selections are still here; please try again." };
  revalidatePath("/");
  revalidatePath("/swipe");
  revalidatePath("/filter");
  return { error: null };
}
