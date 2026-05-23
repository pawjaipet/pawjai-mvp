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

export function mergePersonalityTags(extraTags: string[]) {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const tag of [...DEFAULT_PERSONALITY_TAGS, ...extraTags]) {
    const normalized = tag.trim();
    if (!normalized) continue;

    const key = normalized.toLocaleLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    merged.push(normalized);
  }

  return merged;
}
