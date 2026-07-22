export const DOG_BREED_OPTIONS = [
  "Mixed Breed",
  "Thai Dog",
  "Thai Mix",
  "Thai Bangkaew",
  "Thai Ridgeback",
  "Golden Retriever",
  "Labrador Retriever",
  "German Shepherd",
  "French Bulldog",
  "Poodle",
  "Chihuahua",
  "Siberian Husky",
  "Shih Tzu",
  "Pug",
  "Rottweiler",
  "Beagle",
  "Dachshund",
  "Yorkshire Terrier",
  "Boxer",
  "Pomeranian",
  "Australian Shepherd",
  "Great Dane",
  "Doberman Pinscher",
  "Pembroke Welsh Corgi",
  "Miniature Schnauzer",
  "Shiba Inu",
  "Boston Terrier",
  "Border Collie",
  "Bulldog",
  "Akita",
  "Cavalier King Charles Spaniel",
  "Havanese",
  "Shetland Sheepdog",
  "Bernese Mountain Dog",
  "English Springer Spaniel",
  "Brittany",
  "Cocker Spaniel",
  "Mastiff",
  "Cane Corso",
  "West Highland White Terrier",
  "Basset Hound",
  "Vizsla",
  "Newfoundland",
  "Rhodesian Ridgeback",
  "Belgian Malinois",
  "Bloodhound",
  "Bull Terrier",
  "Chesapeake Bay Retriever",
  "Weimaraner",
  "Collie",
  "Saint Bernard",
  "Whippet",
] as const;

export const DOG_FILTER_BREED_OPTIONS = ["All Breeds", ...DOG_BREED_OPTIONS] as const;

export const RECENT_DOG_BREED_LIMIT = 3;

export function normalizeBreedLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function breedKey(value: string) {
  return normalizeBreedLabel(value).toLocaleLowerCase();
}

function uniqueBreedLabels(values: readonly string[]) {
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const value of values) {
    const label = normalizeBreedLabel(value);
    if (!label) continue;
    const key = breedKey(label);
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
  const label = normalizeBreedLabel(breed);
  if (!label) return uniqueBreedLabels(currentRecentBreeds).slice(0, limit);
  return uniqueBreedLabels([label, ...currentRecentBreeds]).slice(0, limit);
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
