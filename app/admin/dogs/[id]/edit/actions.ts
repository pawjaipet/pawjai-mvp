"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";
import { isAdminGateOpen } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";
import type { EditDogProfileState } from "./form-state";

type DogUpdate = Database["public"]["Tables"]["dogs"]["Update"];
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

const EDITABLE_TRAIT_TYPES = [
  "training_preference_match",
  "people_friendliness",
  "dog_social_style",
  "intake_note",
  "personality",
  "medical_needs",
];

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
  revalidatePath("/admin/dogs/new");
  revalidatePath("/onboarding");
  revalidatePath(`/admin/dogs/${dogId}/edit`);
  revalidatePath(`/onboarding/dogs/${dogId}/edit`);
}

export async function updateDogProfileAction(
  _prevState: EditDogProfileState,
  formData: FormData,
): Promise<EditDogProfileState> {
  if (!(await isAdminGateOpen())) {
    return {
      message: "Admin access expired. Please unlock the onboarding page again.",
      status: "error",
    };
  }

  const supabase = createAdminClient();
  const fieldErrors: Record<string, string> = {};
  const dogId = getString(formData, "dog_id");
  const name = getString(formData, "name");
  const shelterId = getString(formData, "shelter_id");
  const ageMonths = getOptionalNumber(formData, "age_months");
  const weightKg = getOptionalNumber(formData, "weight_kg");

  if (!dogId) fieldErrors.dog_id = "Missing dog profile id.";
  if (!name) fieldErrors.name = "Dog name is required.";
  if (!shelterId) fieldErrors.shelter_id = "Choose a shelter for this dog.";
  if (Number.isNaN(ageMonths) || (typeof ageMonths === "number" && ageMonths < 0)) {
    fieldErrors.age_months = "Age must be a non-negative number of months.";
  }
  if (Number.isNaN(weightKg) || (typeof weightKg === "number" && weightKg < 0)) {
    fieldErrors.weight_kg = "Weight must be a non-negative number.";
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

  const { error: updateError } = await supabase.from("dogs").update(dogPayload).eq("id", dogId);
  if (updateError) {
    return {
      message: `Could not update this dog profile: ${updateError.message}`,
      status: "error",
    };
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

  revalidateDogManagementPaths(dogId);

  return {
    message: "Dog profile updated successfully.",
    status: "success",
  };
}

export async function deleteDogProfileAction(formData: FormData) {
  if (!(await isAdminGateOpen())) {
    return;
  }

  const dogId = getString(formData, "dog_id");
  if (!dogId) return;

  const supabase = createAdminClient();
  const [{ data: photos }, { data: mediaTraits }] = await Promise.all([
    supabase.from("dog_photos").select("storage_path").eq("dog_id", dogId),
    supabase
      .from("dog_traits")
      .select("trait_value")
      .eq("dog_id", dogId)
      .in("trait_type", ["cover_video_storage_path"]),
  ]);

  const storagePaths = [
    ...(photos ?? []).map((photo) => photo.storage_path),
    ...(mediaTraits ?? []).map((trait) => trait.trait_value),
  ].filter(Boolean);

  if (storagePaths.length > 0) {
    await supabase.storage.from("dog-photos").remove(storagePaths);
  }

  const { error: deleteDogError } = await supabase.from("dogs").delete().eq("id", dogId);
  if (deleteDogError) {
    throw new Error(`Could not delete duplicate dog profile: ${deleteDogError.message}`);
  }

  revalidateDogManagementPaths(dogId);
  redirect("/onboarding");
}
