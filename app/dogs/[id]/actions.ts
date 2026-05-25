"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { ensureAdopterForUser } from "@/utils/adopter";
import { canBookAppointment, getAdopterVerificationSnapshot } from "@/utils/adopter";
import { optionalString } from "@/utils/account-model";
import {
  createSignedCheckInToken,
  formatBookingCode,
  getCheckInTokenSecret,
  hashCheckInToken,
} from "@/utils/booking";
import { normalizeAppointmentTime } from "@/utils/appointments-model";
import { getShelterDaySlots } from "@/utils/shelter-availability";
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
    .select("id, shelter_id, adoption_status")
    .eq("id", dogId)
    .single();

  if (dogError || !dog) {
    redirect(`/dogs/${dogId}?message=${encodeURIComponent("Could not find that dog.")}`);
  }

  if (dog.adoption_status !== "available") {
    redirect(`/dogs/${dogId}?message=${encodeURIComponent("This dog is no longer available for visit bookings.")}`);
  }

  if (!appointmentDate || !appointmentTime) {
    redirect(`/schedule?dogId=${encodeURIComponent(dogId)}&message=${encodeURIComponent("Choose a visit date and time first.")}`);
  }

  const normalizedAppointmentTime = normalizeAppointmentTime(appointmentTime);
  const availableSlots = await getShelterDaySlots({
    admin,
    date: appointmentDate,
    shelterId: dog.shelter_id,
  });

  if (!availableSlots.includes(normalizedAppointmentTime)) {
    redirect(`/schedule?dogId=${encodeURIComponent(dogId)}&message=${encodeURIComponent("That visit time is no longer available. Please choose another time.")}`);
  }

  const { data: existingAppointment } = await admin
    .from("appointments")
    .select("id")
    .eq("shelter_id", dog.shelter_id)
    .eq("appointment_date", appointmentDate)
    .eq("appointment_time", normalizedAppointmentTime)
    .neq("status", "cancelled")
    .neq("status", "no_show")
    .limit(1)
    .maybeSingle();

  if (existingAppointment) {
    redirect(`/dogs/${dogId}?message=${encodeURIComponent("That visit time was just booked. Please choose another time.")}`);
  }

  const appointmentId = randomUUID();
  const checkInToken = createSignedCheckInToken({
    appointmentId,
    secret: getCheckInTokenSecret(),
  });

  const appointmentPayload = {
    adopter_id: adopter.id,
    appointment_date: appointmentDate,
    appointment_time: normalizedAppointmentTime,
    dog_id: dog.id,
    id: appointmentId,
    shelter_id: dog.shelter_id,
    visitor_note: visitorNote,
  };

  let { error } = await (admin as any).from("appointments").insert({
    ...appointmentPayload,
    booking_code: formatBookingCode(appointmentId),
    check_in_token_hash: hashCheckInToken(checkInToken),
  });

  if (error?.message.includes("Could not find") || error?.message.includes("column")) {
    const fallback = await (admin as any).from("appointments").insert(appointmentPayload);
    error = fallback.error;
  }

  if (error) {
    const message = error.message.includes("appointments_active_slot_unique_idx")
      ? "That visit time was just booked. Please choose another time."
      : error.message;
    redirect(`/dogs/${dogId}?message=${encodeURIComponent(message)}`);
  }

  revalidatePath("/appointments");
  redirect(`/appointments/${appointmentId}`);
}
