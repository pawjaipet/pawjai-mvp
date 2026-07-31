export const DEFAULT_PERSONALITY_TAGS = [
  "Happy",
  "Lucky",
  "Sweet",
  "Playful",
  "Adventurous",
  "Curious",
  "Cuddly",
  "Smart",
  "Gentle",
  "Calm",
  "Serene",
  "Graceful",
  "Brave",
  "Social",
  "Friendly",
  "Loving",
  "Funny",
  "Goofy",
  "Chill",
  "Loyal",
  "Independent",
  "Affectionate",
  "Protective",
];

export function normalizePersonalityTag(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function personalityTagKey(value: string) {
  return normalizePersonalityTag(value).toLocaleLowerCase("en");
}

export function dedupePersonalityTags(tags: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const tag of tags) {
    const normalized = normalizePersonalityTag(tag);
    if (!normalized) continue;

    const key = personalityTagKey(normalized);
    if (seen.has(key)) continue;

    seen.add(key);
    unique.push(normalized);
  }

  return unique;
}

export function mergePersonalityTags(extraTags: string[]) {
  return dedupePersonalityTags([...DEFAULT_PERSONALITY_TAGS, ...extraTags]);
}
