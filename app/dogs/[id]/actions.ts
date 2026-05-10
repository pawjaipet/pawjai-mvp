"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureAdopterForUser } from "@/utils/adopter";
import { canBookAppointment, getAdopterVerificationSnapshot } from "@/utils/adopter";
import { optionalString } from "@/utils/account-model";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

async function getAdopter() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const adopter = await ensureAdopterForUser(supabase, user);
  return { adopter, supabase, user };
}

export async function toggleWishlist(formData: FormData) {
  const dogId = String(formData.get("dogId") ?? "");
  const isSaved = formData.get("isSaved") === "true";
  const ctx = await getAdopter();

  if (!ctx) {
    redirect(`/auth?message=${encodeURIComponent("Sign in to save dogs to your wishlist.")}`);
  }

  const { adopter, supabase, user } = ctx;
  const verification = await getAdopterVerificationSnapshot(supabase, user);

  if (!canBookAppointment(verification)) {
    redirect(`/documents?message=${encodeURIComponent("Complete your verification details once before booking shelter visits.")}`);
  }

  const admin = createAdminClient();

  if (isSaved) {
    await admin.from("wishlists").delete().eq("adopter_id", adopter.id).eq("dog_id", dogId);
  } else {
    await admin.from("wishlists").upsert({ adopter_id: adopter.id, dog_id: dogId });
  }

  revalidatePath(`/dogs/${dogId}`);
  revalidatePath("/profile");
}

export async function bookAppointment(formData: FormData) {
  const dogId = String(formData.get("dogId") ?? "");
  const appointmentDate = String(formData.get("appointmentDate") ?? "");
  const appointmentTime = String(formData.get("appointmentTime") ?? "");
  const visitorNote = optionalString(formData.get("visitorNote"));

  const ctx = await getAdopter();

  if (!ctx) {
    redirect(`/auth?message=${encodeURIComponent("Sign in to book a shelter visit.")}`);
  }

  const { adopter } = ctx;
  const admin = createAdminClient();

  const { data: dog, error: dogError } = await admin
    .from("dogs")
    .select("id, shelter_id")
    .eq("id", dogId)
    .single();

  if (dogError || !dog) {
    redirect(`/dogs/${dogId}?message=${encodeURIComponent("Could not find that dog.")}`);
  }

  const { error } = await admin.from("appointments").insert({
    adopter_id: adopter.id,
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
    dog_id: dog.id,
    shelter_id: dog.shelter_id,
    visitor_note: visitorNote,
  });

  if (error) {
    redirect(`/dogs/${dogId}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/appointments");
  redirect("/appointments?message=Appointment requested. The shelter will follow up by email.");
}
