import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const execFileAsync = promisify(execFile);

const DEFAULT_SOURCE_DIR = "/Users/sudlabha/Downloads/Born 2025-2026";
const DOG_DATA_PATH = path.join(repoRoot, "data", "rescue-dog-thailand-dogs.json");
const DOG_PHOTOS_BUCKET = "dog-photos";
const DOG_MEDIA_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "video/mp4"];
const DEFAULT_B2_PUBLIC_BASE_URL = "https://media.pawjaipet.com/file/pawjai";
const SHELTER_NAME = "Rescue Dog Thailand";
const STORAGE_PREFIX = "rescue-dog-thailand";
const IMAGE_EXTENSIONS = new Set([".jpeg", ".jpg", ".png", ".webp"]);
const VIDEO_EXTENSIONS = new Set([".mov", ".mp4"]);
const MAX_DOG_PHOTO_WIDTH = 1800;
const MAX_DOG_PHOTO_HEIGHT = 2400;
const DOG_PHOTO_JPEG_QUALITY = 78;
const DOG_VIDEO_DURATION_SECONDS = 10;

function parseEnvFile(raw) {
  const values = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

async function loadLocalEnv() {
  const envFiles = [".env.local", ".env"];

  for (const filename of envFiles) {
    const fullPath = path.join(repoRoot, filename);

    try {
      const raw = await fs.readFile(fullPath, "utf8");
      const parsed = parseEnvFile(raw);

      for (const [key, value] of Object.entries(parsed)) {
        if (!(key in process.env)) {
          process.env[key] = value;
        }
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    sourceDir: DEFAULT_SOURCE_DIR,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (arg === "--source-dir") {
      const value = argv[index + 1];
      if (!value) throw new Error("--source-dir requires a path.");
      args.sourceDir = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function extensionOf(filename) {
  return path.extname(filename).toLowerCase();
}

function mimeFromExtension(extension) {
  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".mp4":
      return "video/mp4";
    case ".mov":
      return "video/quicktime";
    default:
      return "application/octet-stream";
  }
}

function getPublicBaseUrl() {
  return (process.env.PAWJAI_B2_PUBLIC_BASE_URL ?? DEFAULT_B2_PUBLIC_BASE_URL).replace(/\/+$/, "");
}

function buildBackblazePublicUrl(storagePath) {
  return `${getPublicBaseUrl()}/${storagePath}`;
}

function sha1Hex(buffer) {
  return createHash("sha1").update(buffer).digest("hex");
}

async function authorizeBackblaze() {
  const keyId = requireEnv("B2_KEY_ID");
  const applicationKey = requireEnv("B2_APPLICATION_KEY");
  const response = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${applicationKey}`).toString("base64")}`,
    },
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Backblaze authorization failed with status ${response.status}.`);
  }

  return response.json();
}

async function getBackblazeUploadUrl(auth, bucketId) {
  const apiUrl = auth.apiInfo?.storageApi?.apiUrl ?? auth.apiUrl;
  if (!apiUrl) throw new Error("Backblaze authorization did not return an API URL.");

  const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
    body: JSON.stringify({ bucketId }),
    headers: {
      Authorization: auth.authorizationToken,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Backblaze upload URL request failed with status ${response.status}.`);
  }

  return response.json();
}

async function uploadBufferToBackblaze({ auth, body, bucketId, contentType, desiredPath }) {
  const upload = await getBackblazeUploadUrl(auth, bucketId);
  const fileName = desiredPath.replace(/^\/+/, "");
  const resolvedContentType = contentType?.split(";")[0]?.trim() || "b2/x-auto";

  const response = await fetch(upload.uploadUrl, {
    body: new Uint8Array(body),
    headers: {
      Authorization: upload.authorizationToken,
      "Content-Length": String(body.byteLength),
      "Content-Type": resolvedContentType,
      "X-Bz-Content-Sha1": sha1Hex(body),
      "X-Bz-File-Name": encodeURIComponent(fileName),
    },
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backblaze upload failed with status ${response.status}: ${errorText}`);
  }

  return {
    publicUrl: buildBackblazePublicUrl(fileName),
    storagePath: fileName,
  };
}

async function optimizeDogPhoto(filePath) {
  const body = await sharp(filePath)
    .rotate()
    .resize({
      fit: "inside",
      height: MAX_DOG_PHOTO_HEIGHT,
      width: MAX_DOG_PHOTO_WIDTH,
      withoutEnlargement: true,
    })
    .jpeg({ mozjpeg: true, quality: DOG_PHOTO_JPEG_QUALITY })
    .toBuffer();

  return {
    body,
    contentType: "image/jpeg",
    extension: "jpg",
  };
}

async function optimizeDogVideo(filePath) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pawjai-rescue-video-"));
  const outputPath = path.join(tempDir, "output.mp4");

  try {
    const ffmpegModule = await import("ffmpeg-static");
    const ffmpegPath = ffmpegModule.default || "/usr/local/bin/ffmpeg";

    await execFileAsync(ffmpegPath, [
      "-y",
      "-i",
      filePath,
      "-t",
      String(DOG_VIDEO_DURATION_SECONDS),
      "-an",
      "-vf",
      "scale='if(gt(iw,ih),720,-2)':'if(gt(iw,ih),-2,720)'",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "28",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outputPath,
    ]);

    return {
      body: await fs.readFile(outputPath),
      contentType: "video/mp4",
      extension: "mp4",
    };
  } finally {
    await fs.rm(tempDir, { force: true, recursive: true });
  }
}

async function uploadMedia({ auth, bucketId, dog, filePath, mediaIndex, supabase, type }) {
  const originalExtension = extensionOf(filePath);
  const optimized = type === "photo" ? await optimizeDogPhoto(filePath) : await optimizeDogVideo(filePath);
  const originalSlug = slugify(path.basename(filePath, originalExtension)) || `media-${mediaIndex + 1}`;
  const desiredPath = `${STORAGE_PREFIX}/${slugify(dog.name)}/${String(mediaIndex + 1).padStart(2, "0")}-${originalSlug}.${optimized.extension}`;

  const { error: uploadError } = await supabase.storage.from(DOG_PHOTOS_BUCKET).upload(desiredPath, optimized.body, {
    contentType: optimized.contentType,
    upsert: true,
  });

  if (uploadError) {
    throw new Error(`Supabase media upload failed for ${dog.name}: ${uploadError.message}`);
  }

  const uploaded = await uploadBufferToBackblaze({
    auth,
    body: optimized.body,
    bucketId,
    contentType: optimized.contentType,
    desiredPath,
  });

  return {
    originalFilename: path.basename(filePath),
    publicUrl: uploaded.publicUrl,
    storagePath: uploaded.storagePath,
    type,
  };
}

async function listDogMediaFiles(sourceDir, dog) {
  const folderPath = path.join(sourceDir, dog.folder);
  const filenames = await fs.readdir(folderPath);

  const photos = filenames
    .filter((filename) => IMAGE_EXTENSIONS.has(extensionOf(filename)))
    .sort((a, b) => a.localeCompare(b))
    .map((filename) => ({ filePath: path.join(folderPath, filename), type: "photo" }));

  const videos = filenames
    .filter((filename) => VIDEO_EXTENSIONS.has(extensionOf(filename)))
    .sort((a, b) => a.localeCompare(b))
    .map((filename) => ({ filePath: path.join(folderPath, filename), type: "video" }));

  return [...photos, ...videos];
}

async function findShelterId(supabase) {
  const { data, error } = await supabase
    .from("shelters")
    .select("id, name")
    .eq("name", SHELTER_NAME)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error(`Shelter not found: ${SHELTER_NAME}`);

  return data.id;
}

async function upsertDogRow(supabase, shelterId, dog) {
  const payload = {
    adoption_status: "available",
    age_months: dog.ageMonths,
    animal_friendly: dog.goodWithDogs ?? null,
    background: dog.background,
    breed: dog.breed,
    dog_friendly: dog.dogFriendly ?? dog.goodWithDogs ?? null,
    energy_level: dog.energyLevel,
    gender: dog.gender,
    good_with_cats: dog.goodWithCats,
    good_with_dogs: dog.goodWithDogs,
    good_with_kids: dog.goodWithKids,
    house_trained: null,
    human_friendly: dog.humanFriendly,
    leash_trained: null,
    name: dog.name,
    shelter_id: shelterId,
    size: dog.size,
    special_needs: null,
    sterilized: false,
    weight_kg: dog.weightKg,
  };

  const { data: existingDog, error: findError } = await supabase
    .from("dogs")
    .select("id")
    .eq("shelter_id", shelterId)
    .eq("name", dog.name)
    .maybeSingle();

  if (findError) throw findError;

  if (existingDog) {
    const { data: updatedDog, error: updateError } = await supabase
      .from("dogs")
      .update(payload)
      .eq("id", existingDog.id)
      .select("id")
      .single();

    if (updateError) throw updateError;
    return updatedDog.id;
  }

  const { data: insertedDog, error: insertError } = await supabase
    .from("dogs")
    .insert(payload)
    .select("id")
    .single();

  if (insertError) throw insertError;
  return insertedDog.id;
}

function buildTraitRows(dogId, dog, mediaManifestItems) {
  const traits = [
    { trait_type: "source", trait_value: "Thai Rescue Dog Foundation import, July 2026" },
    { trait_type: "coat_color", trait_value: dog.coatColor },
    { trait_type: "size_note", trait_value: dog.sizeNote },
    { trait_type: "visual_note", trait_value: dog.visualNote },
    { trait_type: "birth_date", trait_value: dog.birthDate },
  ];

  for (const traitValue of dog.personality) {
    traits.push({ trait_type: "personality", trait_value: traitValue });
  }

  if (mediaManifestItems.length > 0) {
    traits.push({
      trait_type: "media_manifest",
      trait_value: JSON.stringify({ items: mediaManifestItems }),
    });
  }

  return traits.map((trait) => ({
    dog_id: dogId,
    ...trait,
  }));
}

async function replaceDogMetadata({ auth, bucketId, dog, dogId, mediaFiles, supabase }) {
  const { error: deletePhotosError } = await supabase
    .from("dog_photos")
    .delete()
    .eq("dog_id", dogId);

  if (deletePhotosError) throw deletePhotosError;

  const { error: deleteTraitsError } = await supabase
    .from("dog_traits")
    .delete()
    .eq("dog_id", dogId);

  if (deleteTraitsError) throw deleteTraitsError;

  const uploadedMedia = [];
  for (const [mediaIndex, media] of mediaFiles.entries()) {
    uploadedMedia.push(
      await uploadMedia({
        auth,
        bucketId,
        dog,
        filePath: media.filePath,
        mediaIndex,
        supabase,
        type: media.type,
      }),
    );
  }

  const photoRows = uploadedMedia
    .filter((item) => item.type === "photo")
    .map((item, index) => ({
      dog_id: dogId,
      is_cover: index === 0,
      public_url: item.publicUrl,
      sort_order: index,
      storage_path: item.storagePath,
    }));

  const { data: savedPhotos, error: photoError } = photoRows.length > 0
    ? await supabase
        .from("dog_photos")
        .insert(photoRows)
        .select("id, is_cover, public_url, sort_order, storage_path")
    : { data: [], error: null };

  if (photoError) throw photoError;

  const coverPhoto = savedPhotos?.find((photo) => photo.is_cover) ?? savedPhotos?.[0] ?? null;
  if (coverPhoto) {
    const { error: coverError } = await supabase
      .from("dogs")
      .update({ cover_photo_id: coverPhoto.id })
      .eq("id", dogId);

    if (coverError) throw coverError;
  }

  const savedPhotoByPath = new Map((savedPhotos ?? []).map((photo) => [photo.storage_path, photo]));
  const coverPhotoUrl = coverPhoto?.public_url ?? null;
  const mediaManifestItems = uploadedMedia.map((item, index) => {
    const savedPhoto = item.type === "photo" ? savedPhotoByPath.get(item.storagePath) : null;

    return {
      id: savedPhoto?.id ?? `${item.type}-${index}`,
      isCover: index === 0,
      posterUrl: item.type === "video" ? coverPhotoUrl : null,
      publicUrl: item.publicUrl,
      sortOrder: index,
      storagePath: item.storagePath,
      type: item.type,
    };
  });

  const traitRows = buildTraitRows(dogId, dog, mediaManifestItems);
  if (traitRows.length > 0) {
    const { error: traitError } = await supabase.from("dog_traits").insert(traitRows);
    if (traitError) throw traitError;
  }

  return {
    mediaCount: uploadedMedia.length,
    photoCount: photoRows.length,
    videoCount: uploadedMedia.filter((item) => item.type === "video").length,
  };
}

async function main() {
  await loadLocalEnv();
  const args = parseArgs(process.argv.slice(2));
  const dogs = JSON.parse(await fs.readFile(DOG_DATA_PATH, "utf8"));

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const bucketId = requireEnv("B2_BUCKET_ID");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const shelterId = await findShelterId(supabase);
  console.log(`Using shelter "${SHELTER_NAME}" (${shelterId}).`);
  console.log(`Prepared ${dogs.length} dog profiles from ${args.sourceDir}.`);

  if (args.dryRun) {
    for (const dog of dogs) {
      const mediaFiles = await listDogMediaFiles(args.sourceDir, dog);
      console.log(`${dog.name}: ${mediaFiles.length} media file(s), no upload in dry run.`);
    }
    return;
  }

  const { error: bucketError } = await supabase.storage.updateBucket(DOG_PHOTOS_BUCKET, {
    allowedMimeTypes: DOG_MEDIA_MIME_TYPES,
    fileSizeLimit: "26214400",
    public: true,
  });

  if (bucketError) {
    throw new Error(`Supabase media bucket update failed: ${bucketError.message}`);
  }

  const auth = await authorizeBackblaze();
  const summary = [];

  for (const dog of dogs) {
    const mediaFiles = await listDogMediaFiles(args.sourceDir, dog);
    if (mediaFiles.length === 0) {
      throw new Error(`No media files found for ${dog.name}.`);
    }

    const dogId = await upsertDogRow(supabase, shelterId, dog);
    const result = await replaceDogMetadata({
      auth,
      bucketId,
      dog,
      dogId,
      mediaFiles,
      supabase,
    });

    summary.push({
      dogId,
      mediaCount: result.mediaCount,
      name: dog.name,
      photoCount: result.photoCount,
      videoCount: result.videoCount,
    });
    console.log(
      `${dog.name}: saved ${result.photoCount} photo(s), ${result.videoCount} video(s), dog id ${dogId}.`,
    );
  }

  console.log("Import complete:");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
