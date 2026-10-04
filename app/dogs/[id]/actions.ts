"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
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
import { sendBookingNotificationForAppointment } from "@/utils/booking-email";
import { normalizeAppointmentTime } from "@/utils/appointments-model";
import {
  ANALYTICS_VISITOR_COOKIE,
  recordProductAnalyticsEvent,
} from "@/utils/product-analytics";
import { assertRateLimit } from "@/utils/rate-limit";
import { getShelterMonthAvailability } from "@/utils/shelter-availability";
import { bookingSlotConflictReason, isBookingSlotUniqueConflict, type BookingSlotConflict } from "@/utils/booking-recovery";
import { getSubscriptionLimits } from "@/utils/subscription-limits";
import { resolveSubscriptionEntitlementForUser } from "@/utils/subscription-entitlements";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

async function getAdopter() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const adopter = await ensureAdopterForUser(supabase, user);
  return { adopter, supabase, user };
}

async function recordBookingOutcome({
  appointmentId,
  dogId,
  eventName,
  reason,
  userId,
  writeGaReceipt = true,
}: {
  appointmentId?: string;
  dogId: string;
  eventName: "booking_failed" | "booking_succeeded";
  reason?: string;
  userId?: string | null;
  writeGaReceipt?: boolean;
}) {
  const cookieStore = await cookies();
  if (writeGaReceipt) {
    cookieStore.set("pawjai_ga_booking", `${eventName}:${reason ?? "confirmed"}`, {
      path: "/", maxAge: 60, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    });
  }
  await recordProductAnalyticsEvent({
    appointmentId: appointmentId ?? null,
    dogId,
    eventName,
    metadata: reason ? { reason } : {},
    path: "/schedule",
    userId: userId ?? null,
    visitorId: cookieStore.get(ANALYTICS_VISITOR_COOKIE)?.value ?? null,
  });
}

export async function toggleWishlist(formData: FormData) {
  const dogId = String(formData.get("dogId") ?? "");
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

  const { tier } = await resolveSubscriptionEntitlementForUser(user);
  const { wishlistLimit } = getSubscriptionLimits(tier);
  const { data, error } = await admin.rpc("toggle_subscription_wishlist_for_user", {
    p_adopter_id: adopter.id,
    p_dog_id: dogId,
    p_tier: tier,
    p_user_id: user.id,
  });
  if (error || !data?.[0]) throw error ?? new Error("Wishlist could not be updated.");
  if (data[0].limit_reached) {
    await recordProductAnalyticsEvent({
      dogId,
      eventName: "subscription_limit_prompt",
      metadata: { limit: wishlistLimit, limitType: "wishlist", tier },
      path: `/dogs/${dogId}`,
      userId: user.id,
    });
    redirect(`/settings/subscription?message=${encodeURIComponent("Wishlist limit reached. Upgrade to save more dogs.")}`);
  }

  revalidatePath(`/dogs/${dogId}`);
  revalidatePath("/profile");
}

export async function bookAppointment(formData: FormData): Promise<BookingSlotConflict> {
  const dogId = String(formData.get("dogId") ?? "");
  const appointmentDate = String(formData.get("appointmentDate") ?? "");
  const appointmentTime = String(formData.get("appointmentTime") ?? "");
  const visitorNote = optionalString(formData.get("visitorNote"));

  const ctx = await getAdopter();

  if (!ctx) {
    await recordBookingOutcome({ dogId, eventName: "booking_failed", reason: "signed_out" });
    redirect(`/auth?message=${encodeURIComponent("Sign in to book a shelter visit.")}`);
  }

  const { adopter, supabase, user } = ctx;
  const verification = await getAdopterVerificationSnapshot(supabase, user);
  if (!canBookAppointment(verification)) {
    await recordBookingOutcome({ dogId, eventName: "booking_failed", reason: "verification_required", userId: user.id });
    redirect(`/documents?next=${encodeURIComponent(`/schedule?dogId=${dogId}`)}`);
  }
  try {
    await assertRateLimit({
      action: "booking.create",
      identifier: user.id,
      limit: 8,
      windowSeconds: 60 * 60,
    });
  } catch (error) {
    await recordBookingOutcome({ dogId, eventName: "booking_failed", reason: "rate_limited", userId: user.id });
    redirect(`/dogs/${dogId}?message=${encodeURIComponent(error instanceof Error ? error.message : "Please wait before booking again.")}`);
  }
  const admin = createAdminClient();

  const { data: dog, error: dogError } = await admin
    .from("dogs")
    .select("id, shelter_id, adoption_status")
    .eq("id", dogId)
    .single();

  if (dogError || !dog) {
    await recordBookingOutcome({ dogId, eventName: "booking_failed", reason: "dog_not_found", userId: user.id });
    redirect(`/dogs/${dogId}?message=${encodeURIComponent("Could not find that dog.")}`);
  }

  if (dog.adoption_status !== "available") {
    await recordBookingOutcome({ dogId, eventName: "booking_failed", reason: "dog_unavailable", userId: user.id });
    redirect(`/dogs/${dogId}?message=${encodeURIComponent("This dog is no longer available for visit bookings.")}`);
  }
  const shelterId = dog.shelter_id;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate) || !appointmentTime) {
    await recordBookingOutcome({ dogId, eventName: "booking_failed", reason: "missing_date_or_time", userId: user.id });
    redirect(`/schedule?dogId=${encodeURIComponent(dogId)}&message=${encodeURIComponent("Choose a visit date and time first.")}`);
  }

  const normalizedAppointmentTime = normalizeAppointmentTime(appointmentTime);
  const parsedDate = new Date(`${appointmentDate}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    await recordBookingOutcome({ dogId, eventName: "booking_failed", reason: "missing_date_or_time", userId: user.id });
    redirect(`/schedule?dogId=${encodeURIComponent(dogId)}&message=${encodeURIComponent("Choose a valid visit date and time first.")}`);
  }
  const availability = await getShelterMonthAvailability({
    admin,
    month: parsedDate.getMonth(),
    shelterId,
    year: parsedDate.getFullYear(),
  });
  const availableSlots = availability.daysByDate[appointmentDate]?.slots ?? [];

  async function slotConflict(reason: BookingSlotConflict["reason"]): Promise<BookingSlotConflict> {
    await recordBookingOutcome({ dogId, eventName: "booking_failed", reason, userId: user.id, writeGaReceipt: false });
    const refreshedAvailability = await getShelterMonthAvailability({
      admin,
      month: parsedDate.getMonth(),
      shelterId,
      year: parsedDate.getFullYear(),
    });
    return { status: "slot_unavailable", reason, availability: refreshedAvailability };
  }

  const unavailableReason = bookingSlotConflictReason(availableSlots, normalizedAppointmentTime);
  if (unavailableReason) {
    return slotConflict(unavailableReason);
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

  const takenReason = bookingSlotConflictReason(availableSlots, normalizedAppointmentTime, Boolean(existingAppointment));
  if (takenReason) {
    return slotConflict(takenReason);
  }

  const appointmentId = randomUUID();
  const { tier: subscriptionTier } = await resolveSubscriptionEntitlementForUser(user);
  const subscriptionLimits = getSubscriptionLimits(subscriptionTier);
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
    priority_visit: subscriptionLimits.priorityVisits,
    subscription_tier_at_booking: subscriptionTier,
  });

  if (error?.message.includes("Could not find") || error?.message.includes("column")) {
    const fallback = await (admin as any).from("appointments").insert(appointmentPayload);
    error = fallback.error;
  }

  if (error) {
    if (isBookingSlotUniqueConflict(error.message)) {
      return slotConflict("slot_taken");
    }
    await recordBookingOutcome({
      dogId,
      eventName: "booking_failed",
      reason: "database_error",
      userId: user.id,
    });
    redirect(`/dogs/${dogId}?message=${encodeURIComponent(error.message)}`);
  }

  await sendBookingNotificationForAppointment({
    admin,
    appointmentId,
    event: "booking_requested",
  });
  await recordBookingOutcome({
    appointmentId,
    dogId,
    eventName: "booking_succeeded",
    userId: user.id,
  });
  revalidatePath("/appointments");
  redirect(`/appointments/${appointmentId}`);
}
