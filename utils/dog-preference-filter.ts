type Nullable<T> = T | null | undefined;

export interface DogForPreferenceFilter {
  age_months?: Nullable<number>;
  breed?: Nullable<string>;
  energy_level?: Nullable<string>;
  good_with_cats?: Nullable<boolean>;
  good_with_dogs?: Nullable<boolean>;
  good_with_kids?: Nullable<boolean>;
  id: string;
  size?: Nullable<string>;
  special_needs?: Nullable<string>;
}

export interface DogTraitForPreferenceFilter {
  dog_id: string;
  trait_type: string;
  trait_value: string;
}

export interface PreferenceForDogFilter {
  good_with_cats?: Nullable<boolean>;
  good_with_dogs?: Nullable<boolean>;
  good_with_kids?: Nullable<boolean>;
  preferred_affection_styles?: Nullable<string[]>;
  preferred_age_max_months?: Nullable<number>;
  preferred_age_min_months?: Nullable<number>;
  preferred_breeds?: Nullable<string[]>;
  preferred_energy_level?: Nullable<string>;
  preferred_people_friendliness?: Nullable<string[]>;
  preferred_protectiveness?: Nullable<string[]>;
  preferred_size?: Nullable<string>;
  preferred_special_needs?: Nullable<string[]>;
  preferred_training_preferences?: Nullable<string[]>;
}

function clean(values: Nullable<string[]>) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

function hasAny(values: Nullable<string[]>) {
  return clean(values).length > 0;
}

export function hasActiveDogPreference(preference: Nullable<PreferenceForDogFilter>) {
  if (!preference) return false;
  return Boolean(
    preference.preferred_size ||
      preference.preferred_energy_level ||
      preference.good_with_cats !== null && preference.good_with_cats !== undefined ||
      preference.good_with_dogs !== null && preference.good_with_dogs !== undefined ||
      preference.good_with_kids !== null && preference.good_with_kids !== undefined ||
      preference.preferred_age_min_months !== null && preference.preferred_age_min_months !== undefined ||
      preference.preferred_age_max_months !== null && preference.preferred_age_max_months !== undefined ||
      hasAny(preference.preferred_breeds) ||
      hasAny(preference.preferred_protectiveness) ||
      hasAny(preference.preferred_affection_styles) ||
      hasAny(preference.preferred_training_preferences) ||
      hasAny(preference.preferred_people_friendliness) ||
      hasAny(preference.preferred_special_needs),
  );
}

function buildTraitMap(traits: DogTraitForPreferenceFilter[]) {
  const map = new Map<string, Map<string, Set<string>>>();
  for (const trait of traits) {
    if (!map.has(trait.dog_id)) map.set(trait.dog_id, new Map());
    const dogTraits = map.get(trait.dog_id)!;
    if (!dogTraits.has(trait.trait_type)) dogTraits.set(trait.trait_type, new Set());
    dogTraits.get(trait.trait_type)!.add(trait.trait_value);
  }
  return map;
}

function matchesOneOf(value: Nullable<string>, allowed: Nullable<string[]>) {
  const labels = clean(allowed);
  if (!labels.length) return true;
  if (!value) return false;
  const normalizedValue = normalize(value);
  return labels.some((label) => normalize(label) === normalizedValue);
}

function matchesBoolean(value: Nullable<boolean>, required: Nullable<boolean>) {
  if (required === null || required === undefined) return true;
  return value === required;
}

function matchesTrait(
  dogTraits: Map<string, Set<string>> | undefined,
  traitType: string,
  allowed: Nullable<string[]>,
) {
  const labels = clean(allowed);
  if (!labels.length) return true;
  const values = dogTraits?.get(traitType);
  if (!values?.size) return false;
  const normalizedValues = [...values].map(normalize);
  return labels.some((label) => normalizedValues.includes(normalize(label)));
}

function medicalTraits(dogTraits: Map<string, Set<string>> | undefined) {
  return [...(dogTraits?.get("medical_needs") ?? new Set<string>())];
}

function matchesSpecialNeeds(dog: DogForPreferenceFilter, dogTraits: Map<string, Set<string>> | undefined, allowed: Nullable<string[]>) {
  const labels = clean(allowed);
  if (!labels.length) return true;

  const traits = medicalTraits(dogTraits);
  const normalizedTraits = traits.map(normalize);
  const hasSpecialNeedsText = Boolean(dog.special_needs?.trim());
  const hasMedicalTrait = traits.length > 0;

  return labels.some((label) => {
    if (label === "No special needs preferred") {
      return !hasSpecialNeedsText && !hasMedicalTrait;
    }
    if (label === "Behavioral challenges") {
      return normalizedTraits.includes("behavioral support");
    }
    if (label === "Special diet requirements") {
      return normalizedTraits.includes("special diet");
    }
    if (label === "Medical conditions") {
      return hasSpecialNeedsText || traits.some((trait) => {
        const normalized = normalize(trait);
        return normalized !== "special diet" && normalized !== "behavioral support";
      });
    }
    return false;
  });
}

function matchesAge(dog: DogForPreferenceFilter, preference: PreferenceForDogFilter) {
  const min = preference.preferred_age_min_months;
  const max = preference.preferred_age_max_months;
  if (min === null && max === null || min === undefined && max === undefined) return true;
  if (dog.age_months === null || dog.age_months === undefined) return false;
  if (min !== null && min !== undefined && dog.age_months < min) return false;
  if (max !== null && max !== undefined && dog.age_months > max) return false;
  return true;
}

export function filterDogsByPreferences<TDog extends DogForPreferenceFilter>(
  dogs: TDog[],
  traits: DogTraitForPreferenceFilter[],
  preference: Nullable<PreferenceForDogFilter>,
) {
  if (!hasActiveDogPreference(preference)) return dogs;

  const traitMap = buildTraitMap(traits);
  return dogs.filter((dog) => {
    const dogTraits = traitMap.get(dog.id);
    return (
      matchesOneOf(dog.breed, preference!.preferred_breeds) &&
      matchesAge(dog, preference!) &&
      matchesOneOf(dog.size, preference!.preferred_size ? [preference!.preferred_size] : []) &&
      matchesOneOf(dog.energy_level, preference!.preferred_energy_level ? [preference!.preferred_energy_level] : []) &&
      matchesBoolean(dog.good_with_dogs, preference!.good_with_dogs) &&
      matchesBoolean(dog.good_with_cats, preference!.good_with_cats) &&
      matchesBoolean(dog.good_with_kids, preference!.good_with_kids) &&
      matchesTrait(dogTraits, "protectiveness", preference!.preferred_protectiveness) &&
      matchesTrait(dogTraits, "affection_style", preference!.preferred_affection_styles) &&
      matchesTrait(dogTraits, "training_preference_match", preference!.preferred_training_preferences) &&
      matchesTrait(dogTraits, "people_friendliness", preference!.preferred_people_friendliness) &&
      matchesSpecialNeeds(dog, dogTraits, preference!.preferred_special_needs)
    );
  });
}
