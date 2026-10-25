import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Zip, ZipPassThrough, strToU8 } from "fflate";
import { exportCsv, allowedExportMedia } from "@/utils/export-format";
import { buildDogMediaItems } from "@/utils/dog-media";
import type { DogPhoto, DogTrait } from "@/types/database";

export async function readExportRows(db: SupabaseClient, table: string, columns: string, limit: number) {
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; offset <= limit; offset += 500) {
    const { data, error } = await db.from(table).select(columns).order("id").range(offset, offset + 499);
    if (error) throw new Error("Export records could not be loaded.");
    rows.push(...(data as unknown as Record<string, unknown>[] ?? []));
    if (rows.length > limit) throw new Error(`Export exceeds the ${limit}-record limit. Please contact PawJai support.`);
    if (!data || data.length < 500) break;
  }
  return rows;
}

const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif", "image/heic": "heic", "image/heif": "heif" };
async function fetchPhoto(url: string, signal: AbortSignal) {
  if (!allowedExportMedia(url)) throw new Error("unsupported_media_host");
  const response = await fetch(url, { redirect: "error", signal, cache: "no-store" });
  if (!response.ok) throw new Error(`http_${response.status}`);
  const extension = extensions[response.headers.get("content-type")?.split(";")[0] ?? ""];
  if (!extension || !response.body) throw new Error("unsupported_media_type");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 15 * 1024 * 1024) throw new Error("photo_exceeds_15MB");
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return { bytes, extension };
}

export async function* dogArchive(
  dogs: Record<string, unknown>[], photos: DogPhoto[], traits: DogTrait[], shelters: Record<string, unknown>[], signal: AbortSignal,
) {
  const pending: Uint8Array[] = [];
  const zip = new Zip((error, data) => { if (error) throw error; pending.push(data); });
  const add = (name: string, bytes: Uint8Array) => { const file = new ZipPassThrough(name); zip.add(file); file.push(bytes, true); };
  const manifest: Record<string, unknown>[] = [];
  const rows: Record<string, unknown>[] = [];
  const started = Date.now();
  let total = 0;
  let complete = true;
  try {
    for (const dog of dogs) {
      if (signal.aborted) return;
      const dogTraits = traits.filter(trait => trait.dog_id === dog.id);
      const media = buildDogMediaItems({ photos: photos.filter(photo => photo.dog_id === dog.id), traits: dogTraits });
      const filenames: string[] = [];
      let order = 0;
      for (const item of media.filter(item => item.type === "photo")) {
        order++;
        let filename = "";
        try {
          if (Date.now() - started > 230000 || total >= 500 * 1024 * 1024) throw new Error("archive_runtime_or_size_limit");
          if (!item.publicUrl) throw new Error("missing_url");
          const photo = await fetchPhoto(item.publicUrl, AbortSignal.any([signal, AbortSignal.timeout(10000)]));
          if (total + photo.bytes.length > 500 * 1024 * 1024) throw new Error("archive_size_limit");
          filename = `images/${dog.id}-${String(order).padStart(4, "0")}.${photo.extension}`;
          total += photo.bytes.length;
          add(filename, photo.bytes);
          filenames.push(filename);
          while (pending.length) yield pending.shift()!;
          manifest.push({ dog_id: dog.id, url: item.publicUrl, filename, status: "included" });
        } catch (error) {
          complete = false;
          manifest.push({ dog_id: dog.id, url: item.publicUrl, filename, status: "failed", reason: error instanceof Error ? error.message : "fetch_failed" });
        }
      }
      rows.push({ ...dog, shelter: shelters.find(shelter => shelter.id === dog.shelter_id)?.name ?? "", tags: dogTraits.filter(trait => !/media|video/.test(trait.trait_type)).map(trait => ({ type: trait.trait_type, value: trait.trait_value })), images: filenames.join(";"), media_references: media.map(item => item.publicUrl) });
    }
    add("dogs.csv", strToU8(exportCsv(["id", "name", "shelter_id", "shelter", "adoption_status", "breed", "size", "age_months", "gender", "weight_kg", "energy_level", "background", "tags", "images", "media_references"], rows)));
    add("manifest.json", strToU8(JSON.stringify({ complete, generated_at: new Date().toISOString(), dog_count: dogs.length, limits: "2000 dogs; 10000 photos/traits; 15MB/photo; 500MB/archive; 230 seconds fetching. Unsupported hosts and failed images are listed below.", media: manifest }, null, 2)));
    zip.end();
    while (pending.length) yield pending.shift()!;
  } finally { zip.terminate(); }
}
