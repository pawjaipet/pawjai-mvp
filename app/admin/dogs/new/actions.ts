"use server";

import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database";
import {
  closeAdminGate,
  openAdminGate,
  validateAdminPassphrase,
} from "@/utils/admin-auth";
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

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, name: string) {
  const value = getString(formData, name);
  return value.length > 0 ? value : null;
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

function getEnumValue<T extends string>(formData: FormData, name: string, allowed: Set<T>, fallback?: T) {
  const value = getString(formData, name);
  if (allowed.has(value as T)) {
    return value as T;
  }

  return fallback ?? null;
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
  const traitPairs = normalizeTraitPairs(formData);

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

  const dogPayload: DogInsert = {
    adoption_status: getEnumValue(formData, "adoption_status", DOG_ADOPTION_STATUSES, "draft") ?? "draft",
    age_months: ageMonths,
    animal_friendly: getBoolean(formData, "animal_friendly"),
    background: getOptionalString(formData, "background"),
    breed: getOptionalString(formData, "breed"),
    dog_friendly: getBoolean(formData, "dog_friendly"),
    energy_level: getEnumValue(formData, "energy_level", DOG_ENERGY_LEVELS) ?? null,
    gender: getEnumValue(formData, "gender", DOG_GENDERS, "unknown") ?? "unknown",
    good_with_cats: getBoolean(formData, "good_with_cats"),
    good_with_dogs: getBoolean(formData, "good_with_dogs"),
    good_with_kids: getBoolean(formData, "good_with_kids"),
    house_trained: getBoolean(formData, "house_trained"),
    human_friendly: getBoolean(formData, "human_friendly"),
    leash_trained: getBoolean(formData, "leash_trained"),
    name,
    shelter_id: shelterId,
    size: getEnumValue(formData, "size", DOG_SIZES) ?? null,
    special_needs: getOptionalString(formData, "special_needs"),
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

  if (photoUrls.length > 0) {
    const photoRows: DogPhotoInsert[] = photoUrls.map((url, index) => ({
      dog_id: insertedDog.id,
      is_cover: index === 0,
      public_url: url,
      sort_order: index,
      storage_path: url,
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
  revalidatePath("/swipe");
  revalidatePath("/admin/dogs/new");
  revalidatePath(`/dogs/${insertedDog.id}`);

  return {
    dogId: insertedDog.id,
    message: "Dog listing created successfully.",
    status: "success",
  };
}
