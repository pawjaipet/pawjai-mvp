import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadDogBreeds() {
  const source = readFileSync(new URL("../utils/dog-breeds.ts", import.meta.url), "utf8");
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

test("recent dog breed selections are unique and limited to three", () => {
  const { recordRecentBreedSelection } = loadDogBreeds();

  assert.deepEqual(
    plain(recordRecentBreedSelection("Thai Dog", ["Mixed Breed", "Thai Ridgeback", "Beagle"])),
    ["Thai Dog", "Mixed Breed", "Thai Ridgeback"],
  );
  assert.deepEqual(
    plain(recordRecentBreedSelection(" mixed   breed ", ["Thai Dog", "Mixed Breed", "Beagle"])),
    ["Mixed Breed", "Thai Dog", "Beagle"],
  );
});

test("breed picker options keep recent breeds first and fold legacy aliases into the canonical list", () => {
  const { buildBreedPickerOptions } = loadDogBreeds();

  assert.deepEqual(
    plain(buildBreedPickerOptions({
      currentBreed: "Poodle Terrier Mix",
      options: ["Mixed Breed", "Thai Dog"],
      recentBreeds: ["Thai Ridgeback", "Mixed Breed"],
    })),
    ["Thai Ridgeback", "Mixed Breed", "Thai Dog"],
  );
});

test("adopter filter breed list includes all-breeds plus the admin picker vocabulary", () => {
  const { DOG_BREED_OPTIONS, DOG_FILTER_BREED_OPTIONS } = loadDogBreeds();

  assert.equal(DOG_FILTER_BREED_OPTIONS[0], "All Breeds");
  assert.equal(DOG_BREED_OPTIONS.includes("Thai Mix"), false);
  assert.equal(DOG_BREED_OPTIONS.includes("Corgi"), true);
  assert.deepEqual(plain(DOG_FILTER_BREED_OPTIONS.slice(1)), plain(DOG_BREED_OPTIONS));
});

test("breed selections canonicalize aliases before saving filters", () => {
  const { canonicalizeBreedSelections } = loadDogBreeds();

  assert.deepEqual(
    plain(canonicalizeBreedSelections(["Thai Mix", "Pembroke Welsh Corgi", "Mixed breed", "All Breeds"])),
    [],
  );
  assert.deepEqual(
    plain(canonicalizeBreedSelections(["Thai Mix", "Pembroke Welsh Corgi", "Miniature Schnauzer"])),
    ["Mixed Breed", "Corgi", "Schnauzer"],
  );
});

test("legacy live dog breed labels canonicalize for display", () => {
  const { canonicalizeBreedLabel } = loadDogBreeds();

  assert.equal(canonicalizeBreedLabel("Thai Mix"), "Mixed Breed");
  assert.equal(canonicalizeBreedLabel("Poodle Terrier Mix"), "Mixed Breed");
  assert.equal(canonicalizeBreedLabel("Corgi Ridgeback Mixed"), "Mixed Breed");
  assert.equal(canonicalizeBreedLabel("German Shepard Mixed"), "Mixed Breed");
  assert.equal(canonicalizeBreedLabel("Ridgeback"), "Thai Ridgeback");
  assert.equal(canonicalizeBreedLabel("Rodge Back"), "Thai Ridgeback");
});
