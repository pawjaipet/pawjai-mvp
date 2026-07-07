"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { Database } from "@/types/database";
import { logAdminAuditEvent } from "@/utils/admin-audit";
import { requireAdminWorkspace, requireShelterAccess } from "@/utils/admin-auth";
import { uploadBufferToBackblaze } from "@/utils/backblaze";
import { buildDogMediaItems, parseDogMediaManifest } from "@/utils/dog-media";
import { slugify } from "@/utils/slug";
import { createAdminClient } from "@/utils/supabase/admin";
import type { EditDogProfileState } from "./form-state";

type DogUpdate = Database["public"]["Tables"]["dogs"]["Update"];
type DogPhotoInsert = Database["public"]["Tables"]["dog_photos"]["Insert"];
type DogTraitInsert = Database["public"]["Tables"]["dog_traits"]["Insert"];
type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

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

const EDITABLE_TRAIT_TYPES = [
  "protectiveness",
  "affection_style",
  "training_preference_match",
  "people_friendliness",
  "dog_social_style",
  "intake_note",
  "personality",
  "medical_needs",
];
const DOG_PHOTOS_BUCKET = "dog-photos";
const DOG_STORAGE_IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_DOG_PHOTO_HEIGHT = 2400;
const MAX_DOG_PHOTO_WIDTH = 1800;
const DOG_PHOTO_JPEG_QUALITY = 78;
const execFileAsync = promisify(execFile);

type OptimizedPhoto = {
  body: Buffer;
  contentType: string;
  extension: string;
};

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

function getOptionalBooleanValue(formData: FormData, name: string) {
  const value = getString(formData, name);
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function getBoolean(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function getEnumValue<T extends string>(formData: FormData, name: string, allowed: Set<T>, fallback?: T) {
  const value = getString(formData, name);
  if (allowed.has(value as T)) return value as T;
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
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    default:
      return "bin";
  }
}

function guessExtensionFromFileName(fileName: string) {
  const extension = path.extname(fileName).replace(/^\./, "").toLowerCase();
  return extension || null;
}

function isHeicImage(contentType: string | null, extension: string | null) {
  const normalizedType = contentType?.split(";")[0]?.trim().toLowerCase();
  const normalizedExtension = extension?.replace(/^\./, "").toLowerCase();

  return (
    normalizedType === "image/heic" ||
    normalizedType === "image/heif" ||
    normalizedExtension === "heic" ||
    normalizedExtension === "heif"
  );
}

function isHeicFile(file: File) {
  return isHeicImage(file.type, guessExtensionFromFileName(file.name));
}

function normalizeNewPhotoFiles(formData: FormData) {
  return formData
    .getAll("new_photo_files")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

async function convertHeicToJpeg(body: Buffer) {
  try {
    const heicConvert = (await import("heic-convert")).default;
    const jpeg = await heicConvert({
      buffer: body as unknown as ArrayBufferLike,
      format: "JPEG",
      quality: DOG_PHOTO_JPEG_QUALITY / 100,
    });

    return Buffer.from(jpeg);
  } catch (heicConvertError) {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pawjai-heic-"));
    const inputPath = path.join(tempDir, "input.heic");
    const outputPath = path.join(tempDir, "output.jpg");

    try {
      await fs.writeFile(inputPath, body);
      await execFileAsync("/usr/bin/sips", ["-s", "format", "jpeg", inputPath, "--out", outputPath]);
      return await fs.readFile(outputPath);
    } catch {
      throw new Error(
        `This HEIC photo could not be converted to JPG. Please try a different export of the same photo. ${
          heicConvertError instanceof Error ? heicConvertError.message : ""
        }`,
      );
    } finally {
      await fs.rm(tempDir, { force: true, recursive: true });
    }
  }
}

async function optimizeDogPhoto({
  body,
  contentType,
  extension,
}: {
  body: Buffer;
  contentType: string | null;
  extension: string | null;
}): Promise<OptimizedPhoto> {
  const isHeic = isHeicImage(contentType, extension);
  const sourceBody = isHeic ? await convertHeicToJpeg(body) : body;
  const sourceContentType = isHeic ? "image/jpeg" : contentType;
  const sourceExtension = isHeic ? "jpg" : extension;

  try {
    const { default: sharp } = await import("sharp");
    const optimizedBody = await sharp(sourceBody, { failOn: "none" })
      .rotate()
      .resize({
        fit: "inside",
        height: MAX_DOG_PHOTO_HEIGHT,
        width: MAX_DOG_PHOTO_WIDTH,
        withoutEnlargement: true,
      })
      .jpeg({
        mozjpeg: true,
        quality: DOG_PHOTO_JPEG_QUALITY,
      })
      .toBuffer();

    return {
      body: optimizedBody,
      contentType: "image/jpeg",
      extension: "jpg",
    };
  } catch {
    const fallbackContentType = sourceContentType?.split(";")[0]?.trim() || "application/octet-stream";

    if (!DOG_STORAGE_IMAGE_MIME_TYPES.has(fallbackContentType)) {
      throw new Error("This image format could not be converted to JPG. Please upload a JPG, PNG, WEBP, or HEIC image.");
    }

    return {
      body: sourceBody,
      contentType: fallbackContentType,
      extension: sourceExtension?.replace(/^\./, "") || extensionFromContentType(sourceContentType),
    };
  }
}

function photoLetter(photoIndex: number) {
  let index = photoIndex;
  let label = "";

  do {
    label = String.fromCharCode(97 + (index % 26)) + label;
    index = Math.floor(index / 26) - 1;
  } while (index >= 0);

  return label;
}

function photoIndexFromLetter(label: string) {
  return label.split("").reduce((total, letter) => total * 26 + (letter.charCodeAt(0) - 96), 0) - 1;
}

function buildDogMediaBaseName(dogName: string, dogNumber: number) {
  const fullNameSlug = slugify(dogName);
  if (fullNameSlug) return `${fullNameSlug}-dog${dogNumber}`;

  const romanizedAlias = dogName.match(/\(([^)]+)\)/)?.[1];
  const aliasSlug = romanizedAlias ? slugify(romanizedAlias) : "";
  if (aliasSlug) return `${aliasSlug}-dog${dogNumber}`;

  return `dog-${dogNumber}`;
}

function buildDogPhotoPath({
  dogName,
  dogNumber,
  extension,
  photoIndex,
}: {
  dogName: string;
  dogNumber: number;
  extension: string | null;
  photoIndex: number;
}) {
  const slug = buildDogMediaBaseName(dogName, dogNumber);
  const normalizedExtension = extension?.replace(/^\./, "") || "jpg";

  return `pawjaidogs/${slug}-photo${photoLetter(photoIndex)}.${normalizedExtension}`;
}

function inferDogNumberFromMedia(items: ReturnType<typeof buildDogMediaItems>) {
  for (const item of items) {
    const match = item.storagePath?.match(/(?:^|-)dog(\d+)-/);
    if (match?.[1]) return Number(match[1]);
  }

  return null;
}

async function getFallbackDogNumber(supabase: SupabaseAdminClient) {
  const { count } = await supabase.from("dogs").select("id", { count: "exact", head: true });
  return (count ?? 0) + 1;
}

function getNextPhotoIndex(items: ReturnType<typeof buildDogMediaItems>) {
  const photoIndexes = items
    .map((item) => item.storagePath?.match(/photo([a-z]+)\.[a-z0-9]+$/i)?.[1]?.toLowerCase())
    .filter((label): label is string => Boolean(label))
    .map(photoIndexFromLetter);

  if (photoIndexes.length > 0) return Math.max(...photoIndexes) + 1;

  return items.filter((item) => item.type === "photo").length;
}

async function uploadPhotoBuffer({
  body,
  contentType,
  dogName,
  dogNumber,
  extension,
  photoIndex,
  supabase,
}: {
  body: Buffer;
  contentType: string | null;
  dogName: string;
  dogNumber: number;
  extension: string | null;
  photoIndex: number;
  supabase: SupabaseAdminClient;
}): Promise<UploadedPhoto> {
  const optimizedPhoto = await optimizeDogPhoto({ body, contentType, extension });
  const desiredPath = buildDogPhotoPath({
    dogName,
    dogNumber,
    extension: optimizedPhoto.extension,
    photoIndex,
  });

  const { error: uploadError } = await supabase.storage.from(DOG_PHOTOS_BUCKET).upload(desiredPath, optimizedPhoto.body, {
    contentType: optimizedPhoto.contentType,
    upsert: true,
  });

  if (uploadError) {
    throw new Error(`Supabase photo upload failed: ${uploadError.message}`);
  }

  const uploaded = await uploadBufferToBackblaze({
    body: optimizedPhoto.body,
    contentType: optimizedPhoto.contentType,
    desiredPath,
  });

  return {
    publicUrl: uploaded.publicUrl,
    storagePath: desiredPath,
  };
}

function normalizeStructuredTraits(formData: FormData) {
  const traits = [
    ["protectiveness", getOptionalString(formData, "protectiveness")],
    ["affection_style", getOptionalString(formData, "affection_style")],
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

  const customPersonalityTraits = getStringValues(formData, "custom_personality_tags")
    .flatMap((traitValue) => traitValue.split(/[\n,]+/))
    .map((traitValue) => traitValue.trim())
    .filter(Boolean)
    .map((traitValue) => ({
      traitType: "personality",
      traitValue,
    }));

  const careTraits = getStringValues(formData, "care_tag")
    .filter((traitValue) => traitValue !== "No medical needs")
    .map((traitValue) => ({
      traitType: "medical_needs",
      traitValue,
    }));

  const unique = new Map<string, { traitType: string; traitValue: string }>();
  for (const trait of [...structuredTraits, ...personalityTraits, ...customPersonalityTraits, ...careTraits]) {
    unique.set(`${trait.traitType}:${trait.traitValue.toLowerCase()}`, trait);
  }

  return [...unique.values()];
}

function revalidateDogManagementPaths(dogId: string) {
  revalidatePath("/");
  revalidatePath("/dogs");
  revalidatePath(`/dogs/${dogId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/admin/dogs/new");
  revalidatePath(`/admin/dogs/${dogId}/edit`);
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getUniqueSubmittedOrder(values: string[]) {
  const seen = new Set<string>();
  const order: string[] = [];

  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    order.push(value);
  }

  return order;
}

async function updateDogMediaOrder({
  coverMediaId,
  dogId,
  dogName,
  mediaOrderIds,
  newPhotoFiles,
  supabase,
}: {
  coverMediaId: string;
  dogId: string;
  dogName: string;
  mediaOrderIds: string[];
  newPhotoFiles: File[];
  supabase: SupabaseAdminClient;
}) {
  if (mediaOrderIds.length === 0 && !coverMediaId && newPhotoFiles.length === 0) return;

  const [{ data: photos, error: photosError }, { data: traits, error: traitsError }] = await Promise.all([
    supabase.from("dog_photos").select("*").eq("dog_id", dogId).order("sort_order"),
    supabase
      .from("dog_traits")
      .select("trait_type, trait_value")
      .eq("dog_id", dogId)
      .in("trait_type", ["media_manifest", "cover_video_url", "cover_video_storage_path", "cover_video_poster_url"]),
  ]);

  if (photosError) {
    throw new Error(`Could not read current photos: ${photosError.message}`);
  }
  if (traitsError) {
    throw new Error(`Could not read current media metadata: ${traitsError.message}`);
  }

  const currentItems = buildDogMediaItems({ photos: photos ?? [], traits: traits ?? [] });
  const newlyUploadedItems: ReturnType<typeof buildDogMediaItems> = [];

  if (newPhotoFiles.length > 0) {
    const dogNumber = inferDogNumberFromMedia(currentItems) ?? (await getFallbackDogNumber(supabase));
    let nextPhotoIndex = getNextPhotoIndex(currentItems);
    const nextSortOrder =
      currentItems.length > 0
        ? Math.max(...currentItems.map((item) => item.sortOrder)) + 1
        : 0;
    const photoRows: DogPhotoInsert[] = [];

    for (const [index, file] of newPhotoFiles.entries()) {
      const uploaded = await uploadPhotoBuffer({
        body: Buffer.from(await file.arrayBuffer()),
        contentType: file.type,
        dogName,
        dogNumber,
        extension: guessExtensionFromFileName(file.name) ?? extensionFromContentType(file.type),
        photoIndex: nextPhotoIndex,
        supabase,
      });

      photoRows.push({
        dog_id: dogId,
        is_cover: currentItems.length === 0 && index === 0 && !coverMediaId,
        public_url: uploaded.publicUrl,
        sort_order: nextSortOrder + index,
        storage_path: uploaded.storagePath,
      });
      nextPhotoIndex += 1;
    }

    const { data: insertedPhotos, error: insertPhotosError } = photoRows.length > 0
      ? await supabase
          .from("dog_photos")
          .insert(photoRows)
          .select("id, is_cover, public_url, sort_order, storage_path")
      : { data: [], error: null };

    if (insertPhotosError) {
      throw new Error(`Could not save new photos: ${insertPhotosError.message}`);
    }

    for (const photo of insertedPhotos ?? []) {
      newlyUploadedItems.push({
        id: photo.id,
        isCover: photo.is_cover,
        posterUrl: null,
        publicUrl: photo.public_url,
        sortOrder: photo.sort_order,
        storagePath: photo.storage_path,
        type: "photo" as const,
      });
    }
  }

  const allItems = [...currentItems, ...newlyUploadedItems];
  if (allItems.length === 0) return;

  const currentById = new Map(allItems.map((item) => [item.id, item]));
  const validRequestedOrder = getUniqueSubmittedOrder(mediaOrderIds).filter((id) => currentById.has(id));
  const remainingIds = allItems
    .map((item) => item.id)
    .filter((id) => !validRequestedOrder.includes(id));
  const finalOrderIds = [...validRequestedOrder, ...remainingIds];
  const selectedCoverId = currentById.has(coverMediaId)
    ? coverMediaId
    : allItems.find((item) => item.isCover)?.id ?? finalOrderIds[0];
  const firstPhotoUrl =
    allItems.find((item) => item.type === "photo" && item.publicUrl)?.publicUrl ?? null;

  const orderedItems = finalOrderIds.map((id, index) => {
    const item = currentById.get(id)!;
    return {
      ...item,
      isCover: id === selectedCoverId,
      posterUrl:
        item.type === "video"
          ? item.posterUrl ?? firstPhotoUrl
          : null,
      sortOrder: index,
    };
  });

  const photoUpdates = orderedItems
    .filter((item) => item.type === "photo")
    .map((item) =>
      supabase
        .from("dog_photos")
        .update({
          is_cover: item.isCover,
          sort_order: item.sortOrder,
        })
        .eq("id", item.id)
        .eq("dog_id", dogId),
    );

  const photoUpdateResults = await Promise.all(photoUpdates);
  const failedPhotoUpdate = photoUpdateResults.find((result) => result.error);
  if (failedPhotoUpdate?.error) {
    throw new Error(`Could not save photo order: ${failedPhotoUpdate.error.message}`);
  }

  const { error: deleteMediaTraitsError } = await supabase
    .from("dog_traits")
    .delete()
    .eq("dog_id", dogId)
    .in("trait_type", ["media_manifest", "cover_video_url", "cover_video_storage_path", "cover_video_poster_url"]);

  if (deleteMediaTraitsError) {
    throw new Error(`Could not replace media metadata: ${deleteMediaTraitsError.message}`);
  }

  const mediaTraitRows: DogTraitInsert[] = [
    {
      dog_id: dogId,
      trait_type: "media_manifest",
      trait_value: JSON.stringify({ items: orderedItems }),
    },
  ];
  const coverVideo = orderedItems.find((item) => item.isCover && item.type === "video");

  if (coverVideo?.publicUrl) {
    mediaTraitRows.push(
      {
        dog_id: dogId,
        trait_type: "cover_video_url",
        trait_value: coverVideo.publicUrl,
      },
      {
        dog_id: dogId,
        trait_type: "cover_video_storage_path",
        trait_value: coverVideo.storagePath ?? "",
      },
    );

    if (coverVideo.posterUrl) {
      mediaTraitRows.push({
        dog_id: dogId,
        trait_type: "cover_video_poster_url",
        trait_value: coverVideo.posterUrl,
      });
    }
  }

  const { error: insertMediaTraitsError } = await supabase.from("dog_traits").insert(mediaTraitRows);
  if (insertMediaTraitsError) {
    throw new Error(`Could not save media order: ${insertMediaTraitsError.message}`);
  }
}

export async function updateDogProfileAction(
  _prevState: EditDogProfileState,
  formData: FormData,
): Promise<EditDogProfileState> {
  const fieldErrors: Record<string, string> = {};
  const dogId = getString(formData, "dog_id");
  const returnTo = getString(formData, "returnTo");
  const name = getString(formData, "name");
  const shelterId = getString(formData, "shelter_id");
  const ageMonths = getOptionalNumber(formData, "age_months");
  const weightKg = getOptionalNumber(formData, "weight_kg");
  const coverMediaId = getString(formData, "cover_media_id");
  const mediaOrderIds = getStringValues(formData, "media_order");
  const newPhotoFiles = normalizeNewPhotoFiles(formData);

  if (!dogId) fieldErrors.dog_id = "Missing dog profile id.";
  if (!name) fieldErrors.name = "Dog name is required.";
  if (!shelterId) fieldErrors.shelter_id = "Choose a shelter for this dog.";
  if (Number.isNaN(ageMonths) || (typeof ageMonths === "number" && ageMonths < 0)) {
    fieldErrors.age_months = "Age must be a non-negative number of months.";
  }
  if (Number.isNaN(weightKg) || (typeof weightKg === "number" && weightKg < 0)) {
    fieldErrors.weight_kg = "Weight must be a non-negative number.";
  }
  for (const [index, file] of newPhotoFiles.entries()) {
    if (!isHeicFile(file) && !file.type.startsWith("image/")) {
      fieldErrors[`new_photo_${index}`] = `${file.name} is not a supported photo. Upload JPG, PNG, WEBP, or HEIC.`;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
      message: "Please fix the highlighted fields and try again.",
      status: "error",
    };
  }

  const accessRedirectPath = returnTo.startsWith("/shelter/") || returnTo.startsWith("/admindraft")
    ? returnTo
    : `/admin/dogs/${dogId}/edit`;
  const adminContext = await requireShelterAccess(shelterId, accessRedirectPath);
  const supabase = createAdminClient();

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
  const careTags = getStringValues(formData, "care_tag").filter((tag) => tag !== "No medical needs");
  const specialNeeds = getOptionalString(formData, "special_needs") ?? (careTags.length > 0 ? careTags.join(", ") : null);

  const dogPayload: DogUpdate = {
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
    house_trained: getOptionalBooleanValue(formData, "house_trained_value"),
    human_friendly: humanFriendly,
    leash_trained: getBoolean(formData, "leash_trained"),
    name,
    shelter_id: shelterId,
    size: getEnumValue(formData, "size", DOG_SIZES) ?? null,
    special_needs: specialNeeds,
    sterilized: getBoolean(formData, "sterilized"),
    weight_kg: weightKg,
  };

  const { data: currentDog, error: currentDogError } = await supabase
    .from("dogs")
    .select("adoption_status")
    .eq("id", dogId)
    .maybeSingle();

  if (currentDogError) {
    return {
      message: `Could not read this dog's current status: ${currentDogError.message}`,
      status: "error",
    };
  }

  const { error: updateError } = await supabase.from("dogs").update(dogPayload).eq("id", dogId);
  if (updateError) {
    return {
      message: `Could not update this dog profile: ${updateError.message}`,
      status: "error",
    };
  }

  let cancelledFutureAppointments = 0;

  if (dogPayload.adoption_status === "adopted" && currentDog?.adoption_status !== "adopted") {
    const { data: cancelledAppointments, error: cancelAppointmentsError } = await supabase
      .from("appointments")
      .update({
        shelter_note: "This dog has already been adopted.",
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("dog_id", dogId)
      .in("status", ["requested", "confirmed"])
      .gte("appointment_date", formatDateKey(new Date()))
      .select("id");

    if (cancelAppointmentsError) {
      return {
        message: `Dog profile was updated, but future appointments could not be cancelled: ${cancelAppointmentsError.message}`,
        status: "error",
      };
    }

    cancelledFutureAppointments = cancelledAppointments?.length ?? 0;
  }

  const { error: deleteTraitError } = await supabase
    .from("dog_traits")
    .delete()
    .eq("dog_id", dogId)
    .in("trait_type", EDITABLE_TRAIT_TYPES);
  if (deleteTraitError) {
    return {
      message: `Profile details were updated, but replacing public tags failed: ${deleteTraitError.message}`,
      status: "error",
    };
  }

  const traitRows: DogTraitInsert[] = normalizeStructuredTraits(formData).map((trait) => ({
    dog_id: dogId,
    trait_type: trait.traitType,
    trait_value: trait.traitValue,
  }));

  if (traitRows.length > 0) {
    const { error: insertTraitError } = await supabase.from("dog_traits").insert(traitRows);
    if (insertTraitError) {
      return {
        message: `Profile details were updated, but saving public tags failed: ${insertTraitError.message}`,
        status: "error",
      };
    }
  }

  try {
    await updateDogMediaOrder({
      coverMediaId,
      dogId,
      dogName: name,
      mediaOrderIds,
      newPhotoFiles,
      supabase,
    });
  } catch (error) {
    return {
      message: `Profile details were updated, but saving photo/video order failed: ${
        error instanceof Error ? error.message : "Unknown media order error"
      }`,
      status: "error",
    };
  }

  revalidateDogManagementPaths(dogId);
  revalidatePath("/appointments");
  revalidatePath("/admin/bookings");
  await logAdminAuditEvent({
    action: "dog.update",
    context: adminContext,
    metadata: {
      cancelledFutureAppointments,
      name,
      status: dogPayload.adoption_status,
    },
    shelterId,
    targetId: dogId,
    targetTable: "dogs",
  });

  return {
    message: cancelledFutureAppointments > 0
      ? `Dog profile updated successfully. ${cancelledFutureAppointments} future appointment${cancelledFutureAppointments === 1 ? "" : "s"} cancelled because this dog is adopted.`
      : "Dog profile updated successfully.",
    status: "success",
  };
}

export async function deleteDogProfileAction(formData: FormData) {
  const dogId = getString(formData, "dog_id");
  const returnTo = getString(formData, "returnTo");
  if (!dogId) return;

  await requireAdminWorkspace(`/admin/dogs/${dogId}/edit`);
  const supabase = createAdminClient();
  const { data: dog } = await supabase
    .from("dogs")
    .select("shelter_id")
    .eq("id", dogId)
    .maybeSingle();

  if (!dog) return;

  const adminContext = await requireShelterAccess(dog.shelter_id, `/admin/dogs/${dogId}/edit`);

  const [{ data: photos }, { data: mediaTraits }] = await Promise.all([
    supabase.from("dog_photos").select("storage_path").eq("dog_id", dogId),
    supabase
      .from("dog_traits")
      .select("trait_type, trait_value")
      .eq("dog_id", dogId)
      .in("trait_type", ["cover_video_storage_path", "media_manifest"]),
  ]);
  const mediaManifestItems = parseDogMediaManifest(mediaTraits ?? []);

  const storagePaths = [
    ...(photos ?? []).map((photo) => photo.storage_path),
    ...(mediaTraits ?? [])
      .filter((trait) => trait.trait_type === "cover_video_storage_path")
      .map((trait) => trait.trait_value),
    ...mediaManifestItems
      .map((item) => item.storagePath)
      .filter((path): path is string => Boolean(path)),
  ].filter(Boolean);

  if (storagePaths.length > 0) {
    await supabase.storage.from("dog-photos").remove(storagePaths);
  }

  const { error: deleteDogError } = await supabase.from("dogs").delete().eq("id", dogId);
  if (deleteDogError) {
    throw new Error(`Could not delete duplicate dog profile: ${deleteDogError.message}`);
  }

  await logAdminAuditEvent({
    action: "dog.delete",
    context: adminContext,
    metadata: {
      removedStoragePaths: storagePaths.length,
    },
    shelterId: dog.shelter_id,
    targetId: dogId,
    targetTable: "dogs",
  });

  revalidateDogManagementPaths(dogId);
  if (returnTo.startsWith("/shelter/") || returnTo.startsWith("/admindraft")) {
    redirect(returnTo);
  }
  redirect("/admin/listings");
}
