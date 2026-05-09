"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureAdopterForUser } from "@/utils/adopter";
import { optionalBoolean, optionalString } from "@/utils/account-model";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/types/database";

type DogSize = Database["public"]["Enums"]["dog_size"];
type DogEnergy = Database["public"]["Enums"]["dog_energy_level"];

const dogSizes = new Set(["small", "medium", "large", "extra_large"]);
const energyLevels = new Set(["low", "medium", "high"]);

const BUCKET = "profile-pictures";
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function safeExt(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

async function uploadProfileMedia(
  userId: string,
  file: File,
  kind: "avatar" | "cover",
): Promise<string | null> {
  if (!ALLOWED_TYPES.has(file.type)) return null;
  if (file.size <= 0 || file.size > MAX_FILE_BYTES) return null;

  const admin = createAdminClient();
  const path = `${userId}/${kind}-${Date.now()}.${safeExt(file)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (error) return null;

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl ?? null;
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const admin = createAdminClient();
  const fullName = optionalString(formData.get("fullName"));
  const avatarFile = formData.get("avatar");
  const coverFile = formData.get("cover");

  const updates: Database["public"]["Tables"]["profiles"]["Update"] = {};
  if (fullName !== undefined) updates.full_name = fullName;

  if (avatarFile instanceof File && avatarFile.size > 0) {
    const url = await uploadProfileMedia(user.id, avatarFile, "avatar");
    if (url) updates.profile_picture_url = url;
  }
  if (coverFile instanceof File && coverFile.size > 0) {
    const url = await uploadProfileMedia(user.id, coverFile, "cover");
    if (url) updates.cover_photo_url = url;
  }

  if (Object.keys(updates).length > 0) {
    await admin.from("profiles").update(updates).eq("id", user.id);
  }

  revalidatePath("/profile");
}

// Kept for backward compatibility — old endpoints elsewhere may still reference these
export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();
  const fullName = optionalString(formData.get("fullName"));
  const phoneNumber = optionalString(formData.get("phoneNumber"));

  await admin
    .from("profiles")
    .update({
      full_name: fullName,
      phone_number: phoneNumber,
    })
    .eq("id", user.id);

  await admin
    .from("adopters")
    .update({
      email: user.email ?? adopter.email,
      phone_number: phoneNumber,
    })
    .eq("id", adopter.id);

  revalidatePath("/profile");
  redirect("/profile?message=Profile saved.");
}

export async function savePreferences(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();
  const size = optionalString(formData.get("preferredSize"));
  const energy = optionalString(formData.get("preferredEnergy"));

  await admin.from("adopter_preferences").upsert({
    adopter_id: adopter.id,
    good_with_cats: optionalBoolean(formData.get("goodWithCats")),
    good_with_dogs: optionalBoolean(formData.get("goodWithDogs")),
    good_with_kids: optionalBoolean(formData.get("goodWithKids")),
    notes: optionalString(formData.get("notes")),
    preferred_energy_level: energyLevels.has(energy ?? "") ? (energy as DogEnergy) : null,
    preferred_size: dogSizes.has(size ?? "") ? (size as DogSize) : null,
  });

  revalidatePath("/profile");
  redirect("/profile?message=Preferences saved.");
}
