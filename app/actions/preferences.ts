"use server";

import { createClient } from "@/utils/supabase/server";
import { ensureAdopterForUser } from "@/utils/adopter";
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

export async function saveFilterPreferences(answers: FilterAnswers) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // not logged in — silently skip

  const adopter = await ensureAdopterForUser(supabase, user);

  const preferred_size: DogSize | null = answers.sizes.length === 1 ? mapSize(answers.sizes[0]) : null;
  const preferred_energy_level: DogEnergy | null = answers.energyLevels.length === 1 ? mapEnergy(answers.energyLevels[0]) : null;

  const updates = {
    preferred_size,
    preferred_energy_level,
    good_with_kids: answers.goodWithKids,
    good_with_dogs: answers.goodWithDogs,
    good_with_cats: answers.goodWithCats,
  };

  const { data: existing } = await supabase
    .from("adopter_preferences")
    .select("adopter_id")
    .eq("adopter_id", adopter.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("adopter_preferences").update(updates).eq("adopter_id", adopter.id);
  } else {
    await supabase.from("adopter_preferences").insert({ adopter_id: adopter.id, ...updates });
  }
}
