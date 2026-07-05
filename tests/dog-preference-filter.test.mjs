import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadDogPreferenceFilter() {
  const source = readFileSync(new URL("../utils/dog-preference-filter.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  new Script(outputText).runInNewContext({
    exports: module.exports,
    module,
  });
  return module.exports;
}

const dogs = [
  {
    age_months: 96,
    breed: "Thai Bangkaew",
    energy_level: "high",
    good_with_cats: true,
    good_with_dogs: true,
    good_with_kids: true,
    id: "match",
    size: "medium",
    special_needs: "Needs monthly medication",
  },
  {
    age_months: 24,
    breed: "Beagle",
    energy_level: "low",
    good_with_cats: false,
    good_with_dogs: false,
    good_with_kids: false,
    id: "young",
    size: "small",
    special_needs: null,
  },
  {
    age_months: null,
    breed: "Mixed Breed",
    energy_level: "medium",
    good_with_cats: true,
    good_with_dogs: true,
    good_with_kids: true,
    id: "unknown-age",
    size: "large",
    special_needs: null,
  },
  {
    age_months: 36,
    breed: "Thai Ridgeback",
    energy_level: "medium",
    good_with_cats: true,
    good_with_dogs: true,
    good_with_kids: true,
    id: "ridgeback",
    size: "large",
    special_needs: null,
  },
  {
    age_months: 18,
    breed: "Thai mix",
    energy_level: "medium",
    good_with_cats: true,
    good_with_dogs: true,
    good_with_kids: true,
    id: "thai-mix",
    size: "medium",
    special_needs: null,
  },
];

const traits = [
  { dog_id: "match", trait_type: "protectiveness", trait_value: "Highly protective" },
  { dog_id: "match", trait_type: "affection_style", trait_value: "Independent" },
  { dog_id: "match", trait_type: "training_preference_match", trait_value: "Dogs still in training" },
  { dog_id: "match", trait_type: "people_friendliness", trait_value: "Takes time to get to know new people" },
  { dog_id: "match", trait_type: "medical_needs", trait_value: "Medication" },
  { dog_id: "young", trait_type: "protectiveness", trait_value: "Very chill - not reactive" },
  { dog_id: "young", trait_type: "affection_style", trait_value: "Very cuddly and affectionate" },
  { dog_id: "young", trait_type: "training_preference_match", trait_value: "Well-trained dogs only" },
  { dog_id: "young", trait_type: "people_friendliness", trait_value: "Comfortable being petted by strangers" },
  { dog_id: "young", trait_type: "medical_needs", trait_value: "Behavioral support" },
];

test("returns all dogs when there are no active preference filters", () => {
  const { filterDogsByPreferences } = loadDogPreferenceFilter();

  const result = filterDogsByPreferences(dogs, traits, null);

  assert.deepEqual(result.map((dog) => dog.id), ["match", "young", "unknown-age", "ridgeback", "thai-mix"]);
});

test("filters by age range and trait-backed preferences", () => {
  const { filterDogsByPreferences } = loadDogPreferenceFilter();

  const result = filterDogsByPreferences(dogs, traits, {
    good_with_cats: true,
    good_with_dogs: true,
    good_with_kids: true,
    preferred_affection_styles: ["Independent"],
    preferred_age_max_months: null,
    preferred_age_min_months: 84,
    preferred_breeds: ["Thai Bangkaew"],
    preferred_energy_level: "high",
    preferred_people_friendliness: ["Takes time to get to know new people"],
    preferred_protectiveness: ["Highly protective"],
    preferred_size: "medium",
    preferred_special_needs: ["Medical conditions"],
    preferred_training_preferences: ["Dogs still in training"],
  });

  assert.deepEqual(result.map((dog) => dog.id), ["match"]);
});

test("excludes unknown ages when an age preference is active", () => {
  const { filterDogsByPreferences } = loadDogPreferenceFilter();

  const result = filterDogsByPreferences(dogs, traits, {
    preferred_age_max_months: 36,
    preferred_age_min_months: 12,
  });

  assert.deepEqual(result.map((dog) => dog.id), ["young", "ridgeback", "thai-mix"]);
});

test("matches no-special-needs preference against dogs without medical traits", () => {
  const { filterDogsByPreferences } = loadDogPreferenceFilter();

  const result = filterDogsByPreferences(dogs, traits, {
    preferred_special_needs: ["No special needs preferred"],
  });

  assert.deepEqual(result.map((dog) => dog.id), ["unknown-age", "ridgeback", "thai-mix"]);
});

test("matches behavioral and diet special-needs categories through medical traits", () => {
  const { filterDogsByPreferences } = loadDogPreferenceFilter();
  const dietDogs = [{ id: "diet", special_needs: null }];
  const dietTraits = [{ dog_id: "diet", trait_type: "medical_needs", trait_value: "Special diet" }];

  assert.deepEqual(
    filterDogsByPreferences(dogs, traits, { preferred_special_needs: ["Behavioral challenges"] }).map((dog) => dog.id),
    ["young"],
  );
  assert.deepEqual(
    filterDogsByPreferences(dietDogs, dietTraits, { preferred_special_needs: ["Special diet requirements"] }).map((dog) => dog.id),
    ["diet"],
  );
});

test("mixed breed preference matches mixed labels without leaking named ridgebacks", () => {
  const { filterDogsByPreferences } = loadDogPreferenceFilter();

  const result = filterDogsByPreferences(dogs, traits, {
    preferred_breeds: ["Mixed Breed"],
  });

  assert.deepEqual(result.map((dog) => dog.id), ["unknown-age", "thai-mix"]);
});

test("named ridgeback preference only matches exact ridgeback breed", () => {
  const { filterDogsByPreferences } = loadDogPreferenceFilter();

  const result = filterDogsByPreferences(dogs, traits, {
    preferred_breeds: ["Thai Ridgeback"],
  });

  assert.deepEqual(result.map((dog) => dog.id), ["ridgeback"]);
});
