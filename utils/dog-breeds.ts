export const ALL_BREEDS_FILTER_LABEL = "All Breeds";

export const DOG_BREED_OPTIONS = [
  "Mixed Breed",
  "Thai Dog",
  "Thai Bangkaew",
  "Thai Ridgeback",
  "Golden Retriever",
  "Labrador Retriever",
  "German Shepherd",
  "Siberian Husky",
  "Poodle",
  "Shih Tzu",
  "Pomeranian",
  "Chihuahua",
  "Beagle",
  "Dachshund",
  "French Bulldog",
  "Bulldog",
  "Pug",
  "Yorkshire Terrier",
  "Cocker Spaniel",
  "Border Collie",
  "Australian Shepherd",
  "Rottweiler",
  "Doberman Pinscher",
  "Belgian Malinois",
  "Boxer",
  "Bull Terrier",
  "Shiba Inu",
  "Akita",
  "Corgi",
  "Schnauzer",
] as const;

export type DogBreedOption = (typeof DOG_BREED_OPTIONS)[number];

export const DOG_FILTER_BREED_OPTIONS = [ALL_BREEDS_FILTER_LABEL, ...DOG_BREED_OPTIONS] as const;

export const RECENT_DOG_BREED_LIMIT = 3;

const DOG_BREED_KEYS = new Map(
  DOG_BREED_OPTIONS.map((breed) => [toBreedKey(breed), breed] as const),
);

const DOG_BREED_ALIASES = new Map<string, DogBreedOption>([
  ["mixed", "Mixed Breed"],
  ["mutt", "Mixed Breed"],
  ["mongrel", "Mixed Breed"],
  ["crossbreed", "Mixed Breed"],
  ["cross breed", "Mixed Breed"],
  ["thai mix", "Mixed Breed"],
  ["thai mixed", "Mixed Breed"],
  ["thai mixed breed", "Mixed Breed"],
  ["thai mixed-breed", "Mixed Breed"],
  ["poodle terrier mix", "Mixed Breed"],
  ["thai local dog", "Thai Dog"],
  ["local thai dog", "Thai Dog"],
  ["thai street dog", "Thai Dog"],
  ["street dog", "Thai Dog"],
  ["ridgeback", "Thai Ridgeback"],
  ["rodge back", "Thai Ridgeback"],
  ["thai ridgeback dog", "Thai Ridgeback"],
  ["husky", "Siberian Husky"],
  ["welsh corgi", "Corgi"],
  ["pembroke welsh corgi", "Corgi"],
  ["cardigan welsh corgi", "Corgi"],
  ["miniature schnauzer", "Schnauzer"],
  ["standard schnauzer", "Schnauzer"],
]);

function cleanBreedLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function toBreedKey(value: string) {
  return cleanBreedLabel(value).toLocaleLowerCase();
}

export function normalizeBreedLabel(value: string) {
  return canonicalizeBreedLabel(value);
}

export function canonicalizeBreedLabel(value: string | null | undefined) {
  const label = cleanBreedLabel(value ?? "");
  if (!label) return "";

  const key = toBreedKey(label);
  const exact = DOG_BREED_KEYS.get(key);
  if (exact) return exact;

  if (/\bmix(ed)?\b/.test(key) || key.includes("mixed-breed")) {
    return "Mixed Breed";
  }

  return DOG_BREED_ALIASES.get(key) ?? label;
}

export function isCanonicalDogBreed(value: string | null | undefined): value is DogBreedOption {
  return DOG_BREED_KEYS.has(toBreedKey(canonicalizeBreedLabel(value)));
}

export function isAllBreedsLabel(value: string | null | undefined) {
  return toBreedKey(value ?? "") === toBreedKey(ALL_BREEDS_FILTER_LABEL);
}

export function canonicalizeBreedSelections(values: readonly string[] | null | undefined) {
  if ((values ?? []).some(isAllBreedsLabel)) return [];
  return uniqueBreedLabels(values ?? []).filter(isCanonicalDogBreed);
}

function uniqueBreedLabels(values: readonly string[]) {
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const value of values) {
    const label = canonicalizeBreedLabel(value);
    if (!label) continue;
    const key = toBreedKey(label);
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }

  return labels;
}

export function recordRecentBreedSelection(
  breed: string,
  currentRecentBreeds: readonly string[],
  limit = RECENT_DOG_BREED_LIMIT,
) {
  const label = canonicalizeBreedLabel(breed);
  if (!label) return uniqueBreedLabels(currentRecentBreeds).filter(isCanonicalDogBreed).slice(0, limit);
  return uniqueBreedLabels([label, ...currentRecentBreeds]).filter(isCanonicalDogBreed).slice(0, limit);
}

export function buildBreedPickerOptions({
  currentBreed,
  recentBreeds,
  options = DOG_BREED_OPTIONS,
}: {
  currentBreed?: string | null;
  options?: readonly string[];
  recentBreeds?: readonly string[];
}) {
  return uniqueBreedLabels([
    ...(recentBreeds ?? []),
    ...(currentBreed ? [currentBreed] : []),
    ...options,
  ]);
}
