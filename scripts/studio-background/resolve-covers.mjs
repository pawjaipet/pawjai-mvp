// Resolve what the app actually displays for every dog, using the app's own
// utils/dog-media.ts (buildDogMediaItems + normalizeDogMediaUrl), fed with the
// same shapes DogFeedPage builds (photos ordered by sort_order, traits by created_at).
import { readFileSync, writeFileSync } from "node:fs";
const [, , worktree, snapshotPath, outPath] = process.argv;
const { buildDogMediaItems, normalizeDogMediaUrl, DOG_MEDIA_PUBLIC_BASE_URL } = await import(`${worktree}/utils/dog-media.ts`);
// Usage: node resolve-covers.mjs <repo-root> <db-snapshot.json> <resolved-media.json>
const snap = JSON.parse(readFileSync(snapshotPath, "utf8"));
const out = [];
for (const dog of snap.dogs) {
  const photos = dog.photos.map((p) => {
    const rawUrl = p.public_url_override ?? `${DOG_MEDIA_PUBLIC_BASE_URL}/${p.storage_path.replace(/^\/+/, "")}`;
    return { id: p.id, is_cover: p.is_cover, sort_order: p.sort_order, storage_path: p.storage_path,
             public_url: normalizeDogMediaUrl(rawUrl, p.storage_path) };
  });
  const traits = dog.media_traits.map((t) => ({ trait_type: t.trait_type, trait_value: t.trait_value }));
  const media = buildDogMediaItems({ photos, traits });
  out.push({ id: dog.id, name: dog.name, adoption_status: dog.adoption_status, shelter_name: dog.shelter_name,
    cover: media[0] ?? null, media, photo_rows: photos });
}
writeFileSync(outPath, JSON.stringify(out, null, 1));
const types = {};
for (const d of out) types[d.cover?.type ?? "none"] = (types[d.cover?.type ?? "none"] ?? 0) + 1;
console.log("resolved", out.length, "cover types", JSON.stringify(types));
