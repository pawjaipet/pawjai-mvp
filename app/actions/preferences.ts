"use server";

import { createClient } from "@/utils/supabase/server";
import { ensureAdopterForUser } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";
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

  if (hasStructuredPreferenceAnswers(preferences)) {
    const structuredAnswers = restoreAnswersFromPreference(preferences);
    if (Object.keys(structuredAnswers).length) return structuredAnswers;
  }

  const snapshotAnswers = restoreAnswersFromSnapshot((preferences as unknown as { filter_answers?: unknown }).filter_answers);
  if (snapshotAnswers) return snapshotAnswers;

  const legacyAnswers = restoreAnswersFromPreference(preferences);
  return Object.keys(legacyAnswers).length ? legacyAnswers : null;
}

export async function saveFilterPreferences(answers: FilterAnswers) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // not logged in — silently skip

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();

  const updates = buildPreferenceUpdate(answers);

  const { data: existing } = await admin
    .from("adopter_preferences")
    .select("adopter_id")
    .eq("adopter_id", adopter.id)
    .maybeSingle();

  if (existing) {
    const { error } = await (admin as any).from("adopter_preferences").update(updates).eq("adopter_id", adopter.id);
    if (error && (error.message.includes("filter_answers") || error.message.includes("filter_summary") || error.message.includes("preferred_") || error.message.includes("schema cache"))) {
      const { filter_answers: _filterAnswers, filter_summary: _filterSummary, preferred_affection_styles: _affection, preferred_age_max_months: _ageMax, preferred_age_min_months: _ageMin, preferred_breeds: _breeds, preferred_people_friendliness: _people, preferred_protectiveness: _protectiveness, preferred_special_needs: _specialNeeds, preferred_training_preferences: _training, ...legacyUpdates } = updates;
      await admin.from("adopter_preferences").update(legacyUpdates).eq("adopter_id", adopter.id);
    }
  } else {
    const { error } = await (admin as any).from("adopter_preferences").insert({ adopter_id: adopter.id, ...updates });
    if (error && (error.message.includes("filter_answers") || error.message.includes("filter_summary") || error.message.includes("preferred_") || error.message.includes("schema cache"))) {
      const { filter_answers: _filterAnswers, filter_summary: _filterSummary, preferred_affection_styles: _affection, preferred_age_max_months: _ageMax, preferred_age_min_months: _ageMin, preferred_breeds: _breeds, preferred_people_friendliness: _people, preferred_protectiveness: _protectiveness, preferred_special_needs: _specialNeeds, preferred_training_preferences: _training, ...legacyUpdates } = updates;
      await admin.from("adopter_preferences").insert({ adopter_id: adopter.id, ...legacyUpdates });
    }
  }
}
