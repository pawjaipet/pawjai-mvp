"use server";

import { revalidatePath } from "next/cache";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Database } from "@/types/database";
import {
  closeAdminGate,
  openAdminGate,
  validateAdminPassphrase,
} from "@/utils/admin-auth";
import { fetchRemoteAsset } from "@/utils/onedrive";
import { slugify } from "@/utils/slug";
import { createAdminClient } from "@/utils/supabase/admin";
import type { AdminGateState, CreateDogListingState } from "./form-state";

type DogInsert = Database["public"]["Tables"]["dogs"]["Insert"];
type DogPhotoInsert = Database["public"]["Tables"]["dog_photos"]["Insert"];
type DogTraitInsert = Database["public"]["Tables"]["dog_traits"]["Insert"];

const DOG_GENDERS = new Set<Database["public"]["Enums"]["dog_gender"]>([
  "female",
  "male",
  "unknown",
]);

const DOG_SIZES = new Set<Database["public"]["Enums"]["dog_size"]>([
  "small",
  "medium",
  "large",
  "extra_large",
]);

const DOG_ENERGY_LEVELS = new Set<Database["public"]["Enums"]["dog_energy_level"]>([
  "low",
  "medium",
  "high",
]);

const DOG_ADOPTION_STATUSES = new Set<Database["public"]["Enums"]["dog_adoption_status"]>([
  "draft",
  "available",
  "reserved",
  "adopted",
  "unavailable",
]);

const IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);
const DOG_PHOTOS_BUCKET = "dog-photos";

type UploadedPhoto = {
  publicUrl: string;
  storagePath: string;
};

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, name: string) {
  const value = getString(formData, name);
  return value.length > 0 ? value : null;
}

function getStringValues(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

function getOptionalNumber(formData: FormData, name: string) {
  const value = getString(formData, name);
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function getBoolean(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function getOptionalBooleanValue(formData: FormData, name: string) {
  const value = getString(formData, name);
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function getEnumValue<T extends string>(formData: FormData, name: string, allowed: Set<T>, fallback?: T) {
  const value = getString(formData, name);
  if (allowed.has(value as T)) {
    return value as T;
  }

  return fallback ?? null;
}

function extensionFromContentType(contentType: string | null) {
  const type = contentType?.split(";")[0]?.trim().toLowerCase();

  switch (type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    default:
      return "bin";
  }
}

function normalizePhotoUrls(formData: FormData) {
  return formData
    .getAll("photo_url")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

function normalizeTraitPairs(formData: FormData) {
  const types = formData
    .getAll("trait_type")
    .map((value) => (typeof value === "string" ? value.trim() : ""));
  const values = formData
    .getAll("trait_value")
    .map((value) => (typeof value === "string" ? value.trim() : ""));

  const rows = [];

  for (let index = 0; index < Math.max(types.length, values.length); index += 1) {
    const traitType = types[index] ?? "";
    const traitValue = values[index] ?? "";

    if (!traitType && !traitValue) continue;

    rows.push({ traitType, traitValue });
  }

  return rows;
}

function normalizeStructuredTraits(formData: FormData) {
  const traits = [
    ["training_preference_match", getOptionalString(formData, "training_preference_match")],
    ["people_friendliness", getOptionalString(formData, "people_friendliness")],
    ["dog_social_style", getOptionalString(formData, "dog_social_style")],
    ["intake_note", getOptionalString(formData, "intake_note")],
  ];

  const structuredTraits = traits
    .filter(([, traitValue]) => Boolean(traitValue))
    .map(([traitType, traitValue]) => ({
      traitType: traitType!,
      traitValue: traitValue!,
    }));

  const personalityTraits = getStringValues(formData, "personality_tag").map((traitValue) => ({
    traitType: "personality",
    traitValue,
  }));

  const careTraits = getStringValues(formData, "care_tag")
    .filter((traitValue) => traitValue !== "No medical needs")
    .map((traitValue) => ({
      traitType: "medical_needs",
      traitValue,
    }));

  return [...structuredTraits, ...personalityTraits, ...careTraits];
}

function guessExtensionFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]{2,5})$/);
    return match?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

async function uploadPhotoFromSourceUrl({
  dogName,
  photoIndex,
  sourceUrl,
  supabase,
}: {
  dogName: string;
  photoIndex: number;
  sourceUrl: string;
  supabase: ReturnType<typeof createAdminClient>;
}) {
  const response = await fetchRemoteAsset(sourceUrl);
  const contentType = response.headers.get("content-type");

  if (!contentType?.startsWith("image/")) {
    throw new Error(
      `Photo ${photoIndex + 1} did not resolve to an image file. Received ${contentType ?? "unknown content type"}.`,
    );
  }

  const slug = slugify(dogName) || "dog";
  const extension =
    guessExtensionFromUrl(sourceUrl) ?? extensionFromContentType(contentType);

  return uploadPhotoBuffer({
    body: Buffer.from(await response.arrayBuffer()),
    contentType,
    dogName,
    extension,
    photoIndex,
    supabase,
  });
}

async function uploadPhotoBuffer({
  body,
  contentType,
  dogName,
  extension,
  photoIndex,
  supabase,
}: {
  body: Buffer;
  contentType: string | null;
  dogName: string;
  extension: string | null;
  photoIndex: number;
  supabase: ReturnType<typeof createAdminClient>;
}): Promise<UploadedPhoto> {
  const slug = slugify(dogName) || "dog";
  const normalizedExtension = extension?.replace(/^\./, "") || extensionFromContentType(contentType);
  const fileName = `${slug}-${Date.now()}-${photoIndex + 1}-${randomUUID().slice(0, 8)}.${normalizedExtension}`;
  const desiredPath = `pawjaidogs/${fileName}`;
  const resolvedContentType = contentType?.split(";")[0]?.trim() || "application/octet-stream";

  const { error: uploadError } = await supabase.storage.from(DOG_PHOTOS_BUCKET).upload(desiredPath, body, {
    contentType: resolvedContentType,
    upsert: true,
  });

  if (uploadError) {
    throw new Error(`Supabase photo upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(DOG_PHOTOS_BUCKET).getPublicUrl(desiredPath);

  return {
    publicUrl: data.publicUrl,
    storagePath: desiredPath,
  };
}

function normalizePhotoFiles(formData: FormData) {
  return formData
    .getAll("photo_files")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

async function readLocalPhotoFolder(folderInput: string) {
  if (!folderInput) return [];

  const repoRoot = process.cwd();
  const baseDir = path.join(repoRoot, "pawjaidogs");
  const requestedDir = path.resolve(baseDir, folderInput);
  const normalizedBaseDir = path.resolve(baseDir);

  if (requestedDir !== normalizedBaseDir && !requestedDir.startsWith(`${normalizedBaseDir}${path.sep}`)) {
    throw new Error("Local photo folder must be inside the pawjaidogs directory.");
  }

  const entries = await fs.readdir(requestedDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(requestedDir, entry.name))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b), undefined, { numeric: true }));

  if (files.length === 0) {
    throw new Error("No image files were found in that folder.");
  }

  return Promise.all(
    files.map(async (filePath) => ({
      body: await fs.readFile(filePath),
      contentType: contentTypeFromExtension(path.extname(filePath)),
      extension: path.extname(filePath).replace(/^\./, ""),
    })),
  );
}

function contentTypeFromExtension(extension: string) {
  switch (extension.toLowerCase()) {
    case ".avif":
      return "image/avif";
    case ".gif":
      return "image/gif";
    case ".jpeg":
    case ".jpg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

export async function unlockAdminGateAction(
  _prevState: AdminGateState,
  formData: FormData,
): Promise<AdminGateState> {
  const passphrase = getString(formData, "passphrase");

  if (!validateAdminPassphrase(passphrase)) {
    return {
      message: "That passphrase is incorrect.",
      status: "error",
    };
  }

  await openAdminGate();

  return {
    message: "Access granted. Reloading admin tools...",
    status: "success",
  };
}

export async function lockAdminGateAction() {
  await closeAdminGate();
}

export async function createDogListingAction(
  _prevState: CreateDogListingState,
  formData: FormData,
): Promise<CreateDogListingState> {
  const supabase = createAdminClient();

  const fieldErrors: Record<string, string> = {};
  const name = getString(formData, "name");
  const shelterId = getString(formData, "shelter_id");
  const ageMonths = getOptionalNumber(formData, "age_months");
  const weightKg = getOptionalNumber(formData, "weight_kg");
  const photoUrls = normalizePhotoUrls(formData);
  const photoFiles = normalizePhotoFiles(formData);
  const localPhotoFolder = getString(formData, "local_photo_folder");
  const careTags = getStringValues(formData, "care_tag");
  const traitPairs = [
    ...normalizeStructuredTraits(formData),
    ...normalizeTraitPairs(formData),
  ];

  if (!name) {
    fieldErrors.name = "Dog name is required.";
  }

  if (!shelterId) {
    fieldErrors.shelter_id = "Choose a shelter for this listing.";
  }

  if (Number.isNaN(ageMonths) || (typeof ageMonths === "number" && ageMonths < 0)) {
    fieldErrors.age_months = "Age must be a non-negative number of months.";
  }

  if (Number.isNaN(weightKg) || (typeof weightKg === "number" && weightKg < 0)) {
    fieldErrors.weight_kg = "Weight must be a non-negative number.";
  }

  for (const [index, url] of photoUrls.entries()) {
    try {
      // Validate formatting while still allowing any public host.
      new URL(url);
    } catch {
      fieldErrors[`photo_url_${index}`] = `Photo ${index + 1} needs a valid URL.`;
    }
  }

  for (const [index, file] of photoFiles.entries()) {
    if (!file.type.startsWith("image/")) {
      fieldErrors[`photo_file_${index}`] = `${file.name} is not an image file.`;
    }
  }

  for (const [index, pair] of traitPairs.entries()) {
    if (!pair.traitType || !pair.traitValue) {
      fieldErrors[`trait_${index}`] = "Each trait needs both a label and a value.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
      message: "Please fix the highlighted fields and try again.",
      status: "error",
    };
  }

  const dogSocialStyle = getOptionalString(formData, "dog_social_style");
  const peopleFriendliness = getOptionalString(formData, "people_friendliness");
  const goodWithDogs =
    getOptionalBooleanValue(formData, "good_with_dogs_value") ??
    (dogSocialStyle === "Friendly and playful"
      ? true
      : dogSocialStyle === "Prefer to be solo"
        ? false
        : null);
  const goodWithCats = getOptionalBooleanValue(formData, "good_with_cats_value");
  const goodWithKids = getOptionalBooleanValue(formData, "good_with_kids_value");
  const humanFriendly =
    getOptionalBooleanValue(formData, "human_friendly_value") ??
    (peopleFriendliness === "Comfortable being petted by strangers"
      ? true
      : peopleFriendliness
        ? false
        : null);
  const visibleCareTags = careTags.filter((tag) => tag !== "No medical needs");
  const specialNeeds =
    getOptionalString(formData, "special_needs") ??
    (visibleCareTags.length > 0 ? visibleCareTags.join(", ") : null);

  const dogPayload: DogInsert = {
    adoption_status: getEnumValue(formData, "adoption_status", DOG_ADOPTION_STATUSES, "draft") ?? "draft",
    age_months: ageMonths,
    animal_friendly: getBoolean(formData, "animal_friendly"),
    background: getOptionalString(formData, "background"),
    breed: getOptionalString(formData, "breed"),
    dog_friendly: goodWithDogs,
    energy_level: getEnumValue(formData, "energy_level", DOG_ENERGY_LEVELS) ?? null,
    gender: getEnumValue(formData, "gender", DOG_GENDERS, "unknown") ?? "unknown",
    good_with_cats: goodWithCats,
    good_with_dogs: goodWithDogs,
    good_with_kids: goodWithKids,
    house_trained: getOptionalBooleanValue(formData, "house_trained_value") ?? getBoolean(formData, "house_trained"),
    human_friendly: humanFriendly,
    leash_trained: getBoolean(formData, "leash_trained"),
    name,
    shelter_id: shelterId,
    size: getEnumValue(formData, "size", DOG_SIZES) ?? null,
    special_needs: specialNeeds,
    sterilized: getBoolean(formData, "sterilized"),
    weight_kg: weightKg,
  };

  const { data: insertedDog, error: insertDogError } = await supabase
    .from("dogs")
    .insert(dogPayload)
    .select("id")
    .single();

  if (insertDogError || !insertDogError && !insertedDog) {
    return {
      message:
        insertDogError?.message ??
        "Something went wrong while creating the dog listing.",
      status: "error",
    };
  }

  if (photoUrls.length > 0 || photoFiles.length > 0 || localPhotoFolder) {
    const uploadedPhotos: UploadedPhoto[] = [];
    let photoIndex = 0;

    if (localPhotoFolder) {
      try {
        const localPhotos = await readLocalPhotoFolder(localPhotoFolder);

        for (const photo of localPhotos) {
          const uploaded = await uploadPhotoBuffer({
            body: photo.body,
            contentType: photo.contentType,
            dogName: name,
            extension: photo.extension,
            photoIndex,
            supabase,
          });
          uploadedPhotos.push(uploaded);
          photoIndex += 1;
        }
      } catch (error) {
        return {
          dogId: insertedDog.id,
          message: `The dog was created, but the local photo folder could not be imported: ${
            error instanceof Error ? error.message : "Unknown folder import error"
          }`,
          status: "error",
        };
      }
    }

    for (const file of photoFiles) {
      try {
        const uploaded = await uploadPhotoBuffer({
          body: Buffer.from(await file.arrayBuffer()),
          contentType: file.type,
          dogName: name,
          extension: guessExtensionFromUrl(file.name) ?? extensionFromContentType(file.type),
          photoIndex,
          supabase,
        });
        uploadedPhotos.push(uploaded);
        photoIndex += 1;
      } catch (error) {
        return {
          dogId: insertedDog.id,
          message: `The dog was created, but ${file.name} could not be uploaded to public photo storage: ${
            error instanceof Error ? error.message : "Unknown upload error"
          }`,
          status: "error",
        };
      }
    }

    for (const [index, url] of photoUrls.entries()) {
      try {
        const uploaded = await uploadPhotoFromSourceUrl({
          dogName: name,
          photoIndex,
          sourceUrl: url,
          supabase,
        });
        uploadedPhotos.push(uploaded);
        photoIndex += 1;
      } catch (error) {
        return {
          dogId: insertedDog.id,
          message: `The dog was created, but photo URL ${index + 1} could not be moved to public photo storage: ${
            error instanceof Error ? error.message : "Unknown upload error"
          }`,
          status: "error",
        };
      }
    }

    const photoRows: DogPhotoInsert[] = uploadedPhotos.map((photo, index) => ({
      dog_id: insertedDog.id,
      is_cover: index === 0,
      public_url: photo.publicUrl,
      sort_order: index,
      storage_path: photo.storagePath,
    }));

    const { error: photoError } = await supabase.from("dog_photos").insert(photoRows);

    if (photoError) {
      return {
        dogId: insertedDog.id,
        message: `The dog was created, but saving the photos failed: ${photoError.message}`,
        status: "error",
      };
    }
  }

  if (traitPairs.length > 0) {
    const traitRows: DogTraitInsert[] = traitPairs.map((pair) => ({
      dog_id: insertedDog.id,
      trait_type: pair.traitType,
      trait_value: pair.traitValue,
    }));

    const { error: traitError } = await supabase.from("dog_traits").insert(traitRows);

    if (traitError) {
      return {
        dogId: insertedDog.id,
        message: `The dog was created, but saving the custom traits failed: ${traitError.message}`,
        status: "error",
      };
    }
  }

  revalidatePath("/");
  revalidatePath("/dogs");
  revalidatePath("/");
  revalidatePath("/admin/dogs/new");
  revalidatePath(`/dogs/${insertedDog.id}`);

  return {
    dogId: insertedDog.id,
    message: "Dog listing created successfully.",
    status: "success",
  };
}
