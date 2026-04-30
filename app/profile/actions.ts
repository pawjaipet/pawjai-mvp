"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureAdopterForUser } from "@/utils/adopter";
import { optionalBoolean, optionalString } from "@/utils/account-model";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/types/database";

type DogSize = Database["public"]["Enums"]["dog_size"];
type DogEnergy = Database["public"]["Enums"]["dog_energy_level"];

const dogSizes = new Set(["small", "medium", "large", "extra_large"]);
const energyLevels = new Set(["low", "medium", "high"]);

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const adopter = await ensureAdopterForUser(supabase, user);
  const fullName = optionalString(formData.get("fullName"));
  const phoneNumber = optionalString(formData.get("phoneNumber"));

  await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone_number: phoneNumber,
    })
    .eq("id", user.id);

  await supabase
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
  const size = optionalString(formData.get("preferredSize"));
  const energy = optionalString(formData.get("preferredEnergy"));

  await supabase.from("adopter_preferences").upsert({
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
