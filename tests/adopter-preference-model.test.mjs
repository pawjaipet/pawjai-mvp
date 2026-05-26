import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadPreferenceModel() {
  const source = readFileSync(new URL("../utils/adopter-preference-model.ts", import.meta.url), "utf8");
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

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("maps full filter answers into structured adopter preference columns", () => {
  const { buildPreferenceUpdate } = loadPreferenceModel();

  const update = buildPreferenceUpdate({
    ageRange: [2, 7],
    energyLevels: ["High"],
    fullAnswers: {
      0: ["Small"],
      2: ["Thai Bangkaew", "Mixed Breed"],
      4: ["Very chill - not reactive"],
      5: ["Very cuddly and affectionate", "Independent"],
      6: ["Dogs still in training"],
      7: ["Takes time to get to know new people"],
      11: ["Medical conditions", "Special diet requirements"],
    },
    goodWithCats: null,
    goodWithDogs: true,
    goodWithKids: false,
    questionLabels: { 2: "What about their breed?" },
    sizes: ["Small"],
  });

  assert.deepEqual(plain(update.preferred_breeds), ["Thai Bangkaew", "Mixed Breed"]);
  assert.equal(update.preferred_age_min_months, 24);
  assert.equal(update.preferred_age_max_months, null);
  assert.deepEqual(plain(update.preferred_protectiveness), ["Very chill - not reactive"]);
  assert.deepEqual(plain(update.preferred_affection_styles), ["Very cuddly and affectionate", "Independent"]);
  assert.deepEqual(plain(update.preferred_training_preferences), ["Dogs still in training"]);
  assert.deepEqual(plain(update.preferred_people_friendliness), ["Takes time to get to know new people"]);
  assert.deepEqual(plain(update.preferred_special_needs), ["Medical conditions", "Special diet requirements"]);
  assert.equal(update.preferred_size, "small");
  assert.equal(update.preferred_energy_level, "high");
  assert.equal(update.good_with_dogs, true);
  assert.equal(update.good_with_kids, false);
});

test("treats all breeds and empty multiselects as no structured filter", () => {
  const { buildPreferenceUpdate } = loadPreferenceModel();

  const update = buildPreferenceUpdate({
    ageRange: [0, 3],
    energyLevels: [],
    fullAnswers: {
      2: ["All Breeds", "Thai Bangkaew"],
      4: [],
      11: [],
    },
    goodWithCats: null,
    goodWithDogs: null,
    goodWithKids: null,
    questionLabels: {},
    sizes: [],
  });

  assert.deepEqual(plain(update.preferred_breeds), []);
  assert.equal(update.preferred_age_min_months, 0);
  assert.equal(update.preferred_age_max_months, 36);
  assert.deepEqual(plain(update.preferred_protectiveness), []);
  assert.deepEqual(plain(update.preferred_special_needs), []);
  assert.equal(update.preferred_size, null);
  assert.equal(update.preferred_energy_level, null);
});

test("restores full wizard answers from structured preference columns", () => {
  const { hasStructuredPreferenceAnswers, restoreAnswersFromPreference } = loadPreferenceModel();

  const answers = restoreAnswersFromPreference({
    good_with_cats: true,
    good_with_dogs: false,
    good_with_kids: true,
    preferred_affection_styles: ["Subtle"],
    preferred_age_max_months: 60,
    preferred_age_min_months: 12,
    preferred_breeds: ["Thai Dog"],
    preferred_energy_level: "medium",
    preferred_people_friendliness: ["Only stick to their owner"],
    preferred_protectiveness: ["Highly protective"],
    preferred_size: "large",
    preferred_special_needs: ["Behavioral challenges"],
    preferred_training_preferences: ["Well-trained dogs only"],
  });

  assert.equal(hasStructuredPreferenceAnswers({
    preferred_affection_styles: ["Subtle"],
  }), true);
  assert.deepEqual(plain(answers), {
    0: ["Large"],
    1: ["1-5 Years"],
    2: ["Thai Dog"],
    3: ["Medium"],
    4: ["Highly protective"],
    5: ["Subtle"],
    6: ["Well-trained dogs only"],
    7: ["Only stick to their owner"],
    8: ["Prefer to be solo"],
    9: ["Cat-friendly"],
    10: ["Kid-friendly"],
    11: ["Behavioral challenges"],
  });
});

test("does not treat legacy size and energy columns as new structured answers", () => {
  const { hasStructuredPreferenceAnswers } = loadPreferenceModel();

  assert.equal(hasStructuredPreferenceAnswers({
    good_with_cats: true,
    preferred_energy_level: "medium",
    preferred_size: "small",
  }), false);
});
