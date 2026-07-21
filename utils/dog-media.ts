import type { DogPhoto, DogTrait } from "@/types/database";

export type DogMediaItem = {
  id: string;
  isCover: boolean;
  posterUrl: string | null;
  publicUrl: string | null;
  sortOrder: number;
  storagePath?: string | null;
  type: "photo" | "video";
};

type MediaManifest = {
  items?: DogMediaItem[];
};

const DOG_MEDIA_PUBLIC_BASE_URL = "https://media.pawjaipet.com/file/pawjai";

function normalizeDogMediaUrl(url: string | null | undefined, storagePath?: string | null) {
  const path = storagePath?.replace(/^\/+/, "");
  if (path) return `${DOG_MEDIA_PUBLIC_BASE_URL}/${path}`;
  if (!url) return null;

  return url
    .replace(/^https?:\/\/media\.pawjai\.co\.th\/file\/pawjai/i, DOG_MEDIA_PUBLIC_BASE_URL)
    .replace(/^https?:\/\/f006\.backblazeb2\.com\/file\/pawjai/i, DOG_MEDIA_PUBLIC_BASE_URL);
}

export function parseDogMediaManifest(traits: Pick<DogTrait, "trait_type" | "trait_value">[]) {
  const manifestValue = traits.find((trait) => trait.trait_type === "media_manifest")?.trait_value;
  if (!manifestValue) return [];

  try {
    const parsed = JSON.parse(manifestValue) as MediaManifest;
    if (!Array.isArray(parsed.items)) return [];

    return parsed.items
      .filter((item): item is DogMediaItem => {
        return (
          Boolean(item) &&
          (item.type === "photo" || item.type === "video") &&
          typeof item.id === "string" &&
          typeof item.sortOrder === "number"
        );
      })
      .map((item) => ({
        ...item,
        posterUrl: normalizeDogMediaUrl(item.posterUrl),
        publicUrl: normalizeDogMediaUrl(item.publicUrl, item.storagePath),
      }))
      .sort((a, b) => {
        if (a.isCover) return -1;
        if (b.isCover) return 1;
        return a.sortOrder - b.sortOrder;
      });
  } catch {
    return [];
  }
}

export function buildDogMediaItems({
  photos,
  traits,
}: {
  photos: Pick<DogPhoto, "id" | "is_cover" | "public_url" | "sort_order" | "storage_path">[];
  traits: Pick<DogTrait, "trait_type" | "trait_value">[];
}) {
  const manifestItems = parseDogMediaManifest(traits);
  if (manifestItems.length > 0) return manifestItems;

  const coverVideoUrl = traits.find((trait) => trait.trait_type === "cover_video_url")?.trait_value ?? null;
  const coverVideoPosterUrl =
    traits.find((trait) => trait.trait_type === "cover_video_poster_url")?.trait_value ?? null;
  const normalizedCoverVideoUrl = normalizeDogMediaUrl(coverVideoUrl);
  const normalizedCoverVideoPosterUrl = normalizeDogMediaUrl(coverVideoPosterUrl);

  const orderedPhotos = [...photos]
    .map((photo) => ({
      id: photo.id,
      isCover: photo.is_cover,
      posterUrl: null,
      publicUrl: normalizeDogMediaUrl(photo.public_url, photo.storage_path),
      sortOrder: photo.sort_order,
      storagePath: photo.storage_path,
      type: "photo" as const,
    }))
    .sort((a, b) => {
      if (a.isCover) return -1;
      if (b.isCover) return 1;
      return a.sortOrder - b.sortOrder;
    });

  if (!normalizedCoverVideoUrl) return orderedPhotos;

  return [
    {
      id: "legacy-cover-video",
      isCover: true,
      posterUrl: normalizedCoverVideoPosterUrl ?? orderedPhotos[0]?.publicUrl ?? null,
      publicUrl: normalizedCoverVideoUrl,
      sortOrder: -1,
      type: "video" as const,
    },
    ...orderedPhotos.map((photo, index) => ({
      ...photo,
      isCover: false,
      sortOrder: index,
    })),
  ];
}
