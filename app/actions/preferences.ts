"use server";

import { createClient } from "@/utils/supabase/server";
import { ensureAdopterForUser } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Database } from "@/types/database";

type DogSize = Database["public"]["Enums"]["dog_size"];
type DogEnergy = Database["public"]["Enums"]["dog_energy_level"];

interface FilterAnswers {
  sizes: string[];         // Small, Medium, Large
  energyLevels: string[];  // Low, Medium, High
  goodWithKids: boolean | null;
  goodWithDogs: boolean | null;
  goodWithCats: boolean | null;
}

export type SavedFilterAnswers = Record<number, string[]>;

function mapSize(label: string): DogSize {
  const map: Record<string, DogSize> = {
    Small: "small",
    Medium: "medium",
    Large: "large",
  };
  return map[label] ?? "medium";
}

function mapEnergy(label: string): DogEnergy {
  const map: Record<string, DogEnergy> = {
    Low: "low",
    Medium: "medium",
    High: "high",
  };
  return map[label] ?? "medium";
}

function sizeLabel(size: DogSize | null): string | null {
  if (!size) return null;
  return size.charAt(0).toUpperCase() + size.slice(1);
}

function energyLabel(energy: DogEnergy | null): string | null {
  if (!energy) return null;
  return energy.charAt(0).toUpperCase() + energy.slice(1);
}

export async function getSavedFilterPreferences(): Promise<SavedFilterAnswers | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();
  const { data: preferences } = await admin
    .from("adopter_preferences")
    .select("preferred_size, preferred_energy_level, good_with_kids, good_with_dogs, good_with_cats")
    .eq("adopter_id", adopter.id)
    .maybeSingle();

  if (!preferences) return null;

  const answers: SavedFilterAnswers = {};
  const size = sizeLabel(preferences.preferred_size);
  const energy = energyLabel(preferences.preferred_energy_level);

  // Question indices match current filter page order:
  // 0=Size, 1=Age, 2=Breed, 3=Activity, 4=Protect, 5=Affection,
  // 6=Training, 7=People, 8=Dogs, 9=Cats, 10=Kids, 11=Special
  if (size) answers[0] = [size];
  if (energy) answers[3] = [energy];
  if (preferences.good_with_dogs !== null) {
    answers[8] = [preferences.good_with_dogs ? "Friendly and playful" : "Prefer to be solo"];
  }
  if (preferences.good_with_cats !== null) {
    answers[9] = [preferences.good_with_cats ? "Cat-friendly" : "Not sure / No"];
  }
  if (preferences.good_with_kids !== null) {
    answers[10] = [preferences.good_with_kids ? "Kid-friendly" : "Not sure / No"];
  }

  return Object.keys(answers).length ? answers : null;
}

export async function saveFilterPreferences(answers: FilterAnswers) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // not logged in — silently skip

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();

  const preferred_size: DogSize | null = answers.sizes.length === 1 ? mapSize(answers.sizes[0]) : null;
  const preferred_energy_level: DogEnergy | null = answers.energyLevels.length === 1 ? mapEnergy(answers.energyLevels[0]) : null;

  const updates = {
    preferred_size,
    preferred_energy_level,
    good_with_kids: answers.goodWithKids,
    good_with_dogs: answers.goodWithDogs,
    good_with_cats: answers.goodWithCats,
  };

  const { data: existing } = await admin
    .from("adopter_preferences")
    .select("adopter_id")
    .eq("adopter_id", adopter.id)
    .maybeSingle();

  if (existing) {
    await admin.from("adopter_preferences").update(updates).eq("adopter_id", adopter.id);
  } else {
    await admin.from("adopter_preferences").insert({ adopter_id: adopter.id, ...updates });
  }
}
