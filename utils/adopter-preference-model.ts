import type { Json } from "@/types/database";
import { canonicalizeBreedSelections } from "@/utils/dog-breeds";

export type SavedFilterAnswers = Record<number, string[]>;

export interface FilterAnswers {
  ageRange?: [number, number];
  energyLevels: string[];
  fullAnswers?: SavedFilterAnswers;
  goodWithCats: boolean | null;
  goodWithDogs: boolean | null;
  goodWithKids: boolean | null;
  questionLabels?: Record<number, string>;
  sizes: string[];
}

type DogSize = "small" | "medium" | "large" | "extra_large";
type DogEnergy = "low" | "medium" | "high";

export interface StructuredPreference {
  filter_answers: Json;
  filter_summary: string | null;
  good_with_cats: boolean | null;
  good_with_dogs: boolean | null;
  good_with_kids: boolean | null;
  preferred_affection_styles: string[];
  preferred_age_max_months: number | null;
  preferred_age_min_months: number | null;
  preferred_breeds: string[];
  preferred_energy_level: DogEnergy | null;
  preferred_people_friendliness: string[];
  preferred_protectiveness: string[];
  preferred_size: DogSize | null;
  preferred_special_needs: string[];
  preferred_training_preferences: string[];
}

export interface PreferenceRowLike {
  filter_answers?: unknown;
  good_with_cats?: boolean | null;
  good_with_dogs?: boolean | null;
  good_with_kids?: boolean | null;
  preferred_affection_styles?: string[] | null;
  preferred_age_max_months?: number | null;
  preferred_age_min_months?: number | null;
  preferred_breeds?: string[] | null;
  preferred_energy_level?: DogEnergy | null;
  preferred_people_friendliness?: string[] | null;
  preferred_protectiveness?: string[] | null;
  preferred_size?: DogSize | null;
  preferred_special_needs?: string[] | null;
  preferred_training_preferences?: string[] | null;
}

const QUESTION = {
  size: 0,
  age: 1,
  breed: 2,
  energy: 3,
  protectiveness: 4,
  affection: 5,
  training: 6,
  people: 7,
  dogs: 8,
  cats: 9,
  kids: 10,
  specialNeeds: 11,
} as const;

function mapSize(label: string): DogSize {
  const map: Record<string, DogSize> = {
    Large: "large",
    Medium: "medium",
    Small: "small",
  };
  return map[label] ?? "medium";
}

function mapEnergy(label: string): DogEnergy {
  const map: Record<string, DogEnergy> = {
    High: "high",
    Low: "low",
    Medium: "medium",
  };
  return map[label] ?? "medium";
}

function sizeLabel(size: DogSize | null | undefined): string | null {
  if (!size) return null;
  return size === "extra_large" ? "Extra Large" : size.charAt(0).toUpperCase() + size.slice(1);
}

function energyLabel(energy: DogEnergy | null | undefined): string | null {
  if (!energy) return null;
  return energy.charAt(0).toUpperCase() + energy.slice(1);
}

function cleanLabels(values: string[] | null | undefined) {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

function selected(fullAnswers: SavedFilterAnswers, index: number) {
  return cleanLabels(fullAnswers[index]);
}

function monthsFromYears(years: number) {
  return Math.max(0, Math.round(years * 12));
}

function ageLabel(minMonths: number | null | undefined, maxMonths: number | null | undefined) {
  if (minMonths === null || minMonths === undefined) return null;
  const minYears = Math.floor(minMonths / 12);
  if (maxMonths === null || maxMonths === undefined) return `${minYears}+ Years`;
  const maxYears = Math.floor(maxMonths / 12);
  return minYears === maxYears ? `${minYears} Year${minYears === 1 ? "" : "s"}` : `${minYears}-${maxYears} Years`;
}

export function buildPreferenceUpdate(answers: FilterAnswers): StructuredPreference {
  const fullAnswers = answers.fullAnswers ?? {};
  const questionLabels = answers.questionLabels ?? {};
  const ageRange = answers.ageRange ?? null;
  const breeds = selected(fullAnswers, QUESTION.breed);
  const preferredBreeds = canonicalizeBreedSelections(breeds);
  const normalizedFullAnswers: SavedFilterAnswers = {
    ...fullAnswers,
    [QUESTION.breed]: preferredBreeds.length > 0 ? preferredBreeds : breeds,
  };
  const preferredSize = answers.sizes.length === 1 ? mapSize(answers.sizes[0]) : null;
  const preferredEnergy = answers.energyLevels.length === 1 ? mapEnergy(answers.energyLevels[0]) : null;
  const filterSnapshot = {
    ageRange,
    answers: normalizedFullAnswers,
    questions: questionLabels,
    savedAt: new Date().toISOString(),
  } satisfies Json;
  const filterSummary = Object.entries(normalizedFullAnswers)
    .map(([index, values]) => {
      const question = questionLabels[Number(index)] ?? `Question ${Number(index) + 1}`;
      return `${question}: ${values.join(", ")}`;
    })
    .join("\n");

  return {
    filter_answers: filterSnapshot,
    filter_summary: filterSummary || null,
    good_with_cats: answers.goodWithCats,
    good_with_dogs: answers.goodWithDogs,
    good_with_kids: answers.goodWithKids,
    preferred_affection_styles: selected(fullAnswers, QUESTION.affection),
    preferred_age_max_months: ageRange && ageRange[1] < 7 ? monthsFromYears(ageRange[1]) : null,
    preferred_age_min_months: ageRange ? monthsFromYears(ageRange[0]) : null,
    preferred_breeds: preferredBreeds,
    preferred_energy_level: preferredEnergy,
    preferred_people_friendliness: selected(fullAnswers, QUESTION.people),
    preferred_protectiveness: selected(fullAnswers, QUESTION.protectiveness),
    preferred_size: preferredSize,
    preferred_special_needs: selected(fullAnswers, QUESTION.specialNeeds),
    preferred_training_preferences: selected(fullAnswers, QUESTION.training),
  };
}

export function restoreAnswersFromPreference(preferences: PreferenceRowLike): SavedFilterAnswers {
  const answers: SavedFilterAnswers = {};
  const size = sizeLabel(preferences.preferred_size);
  const energy = energyLabel(preferences.preferred_energy_level);
  const age = ageLabel(preferences.preferred_age_min_months, preferences.preferred_age_max_months);

  if (size) answers[QUESTION.size] = [size];
  if (age) answers[QUESTION.age] = [age];
  if (preferences.preferred_breeds?.length) {
    const breeds = canonicalizeBreedSelections(preferences.preferred_breeds);
    if (breeds.length) answers[QUESTION.breed] = breeds;
  }
  if (energy) answers[QUESTION.energy] = [energy];
  if (preferences.preferred_protectiveness?.length) answers[QUESTION.protectiveness] = preferences.preferred_protectiveness;
  if (preferences.preferred_affection_styles?.length) answers[QUESTION.affection] = preferences.preferred_affection_styles;
  if (preferences.preferred_training_preferences?.length) answers[QUESTION.training] = preferences.preferred_training_preferences;
  if (preferences.preferred_people_friendliness?.length) answers[QUESTION.people] = preferences.preferred_people_friendliness;
  if (preferences.good_with_dogs !== null && preferences.good_with_dogs !== undefined) {
    answers[QUESTION.dogs] = [preferences.good_with_dogs ? "Friendly and playful" : "Prefer to be solo"];
  }
  if (preferences.good_with_cats !== null && preferences.good_with_cats !== undefined) {
    answers[QUESTION.cats] = [preferences.good_with_cats ? "Cat-friendly" : "Not sure / No"];
  }
  if (preferences.good_with_kids !== null && preferences.good_with_kids !== undefined) {
    answers[QUESTION.kids] = [preferences.good_with_kids ? "Kid-friendly" : "Not sure / No"];
  }
  if (preferences.preferred_special_needs?.length) answers[QUESTION.specialNeeds] = preferences.preferred_special_needs;

  return answers;
}

export function hasStructuredPreferenceAnswers(preferences: PreferenceRowLike): boolean {
  return Boolean(
    preferences.preferred_age_min_months !== null && preferences.preferred_age_min_months !== undefined ||
      preferences.preferred_age_max_months !== null && preferences.preferred_age_max_months !== undefined ||
      preferences.preferred_breeds?.length ||
      preferences.preferred_protectiveness?.length ||
      preferences.preferred_affection_styles?.length ||
      preferences.preferred_training_preferences?.length ||
      preferences.preferred_people_friendliness?.length ||
      preferences.preferred_special_needs?.length,
  );
}

export function restoreAnswersFromSnapshot(filterAnswers: unknown): SavedFilterAnswers | null {
  if (!filterAnswers || typeof filterAnswers !== "object" || Array.isArray(filterAnswers)) return null;
  const rawAnswers = (filterAnswers as { answers?: unknown }).answers;
  if (!rawAnswers || typeof rawAnswers !== "object" || Array.isArray(rawAnswers)) return null;

  const restored: SavedFilterAnswers = {};
  for (const [key, value] of Object.entries(rawAnswers)) {
    if (Array.isArray(value)) restored[Number(key)] = value.map(String);
  }
  return Object.keys(restored).length ? restored : null;
}
