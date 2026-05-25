"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";
import { buildAdminBookingDetailPath, getCheckInTokenSecret, hashCheckInToken, verifySignedCheckInToken } from "@/utils/booking";
import { isAdminGateOpen } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

type BookingDecision = "accept" | "deny" | "request_change";

function cleanText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function bookingsRedirect(shelterId: string, message: string) {
  const params = new URLSearchParams();
  if (shelterId) params.set("shelter", shelterId);
  if (message) params.set("message", message);
  redirect(`/admin/bookings?${params.toString()}`);
}

function parseDecision(value: FormDataEntryValue | null): BookingDecision | null {
  const decision = typeof value === "string" ? value : "";
  return decision === "accept" || decision === "deny" || decision === "request_change"
    ? decision
    : null;
}

function statusForDecision(decision: BookingDecision): AppointmentStatus {
  switch (decision) {
    case "accept":
      return "confirmed";
    case "deny":
      return "cancelled";
    case "request_change":
      return "requested";
  }
}

export async function decideBookingAction(formData: FormData) {
  if (!(await isAdminGateOpen())) {
    return;
  }

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const decision = parseDecision(formData.get("decision"));
  const shelterNote = String(formData.get("shelterNote") ?? "").trim();

  if (!appointmentId || !decision) {
    return;
  }

  const status = statusForDecision(decision);
  const admin = createAdminClient();
  await admin
    .from("appointments")
    .update({
      shelter_note: shelterNote || null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId);

  revalidatePath("/admin/bookings");
  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
}

export async function updateShelterProfileAction(formData: FormData) {
  if (!(await isAdminGateOpen())) {
    return;
  }

  const shelterId = String(formData.get("shelterId") ?? "");
  const name = cleanText(formData.get("name"));

  if (!shelterId || !name) {
    return;
  }

  const admin = createAdminClient();
  const basePayload = {
    address_line: cleanText(formData.get("addressLine")),
    description: cleanText(formData.get("description")),
    district: cleanText(formData.get("district")),
    email: cleanText(formData.get("email")),
    facebook_url: cleanText(formData.get("facebookUrl")),
    instagram_url: cleanText(formData.get("instagramUrl")),
    name,
    phone_number: cleanText(formData.get("phoneNumber")),
    postal_code: cleanText(formData.get("postalCode")),
    province: cleanText(formData.get("province")),
    subdistrict: cleanText(formData.get("subdistrict")),
    updated_at: new Date().toISOString(),
    website_url: cleanText(formData.get("websiteUrl")),
  };
  const extendedPayload = {
    google_maps_url: cleanText(formData.get("googleMapsUrl")),
    logo_url: cleanText(formData.get("logoUrl")),
    meeting_instructions: cleanText(formData.get("meetingInstructions")),
  };

  const { error } = await admin
    .from("shelters")
    .update({
      ...basePayload,
      ...extendedPayload,
    })
    .eq("id", shelterId);
  const finalError = error?.message.includes("Could not find")
    ? (
        await admin
          .from("shelters")
          .update(basePayload)
          .eq("id", shelterId)
      ).error
    : error;

  revalidatePath("/admin/bookings");
  revalidatePath("/appointments");
  bookingsRedirect(shelterId, finalError ? "Shelter profile could not be saved." : "Shelter profile saved.");
}

export async function updateShelterOperatingDaysAction(formData: FormData) {
  if (!(await isAdminGateOpen())) {
    return;
  }

  const shelterId = String(formData.get("shelterId") ?? "");
  const opensAt = String(formData.get("opensAt") || "09:00");
  const closesAt = String(formData.get("closesAt") || "17:00");
  const slotDuration = Number(formData.get("slotDuration") || 60);
  const closedDays = new Set(
    formData
      .getAll("closedDays")
      .map((day) => Number(day))
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
  );

  if (!shelterId || !Number.isFinite(slotDuration) || slotDuration < 1) {
    return;
  }

  const rows = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const isClosed = closedDays.has(dayOfWeek);
    return {
      closes_at: isClosed ? null : closesAt,
      day_of_week: dayOfWeek,
      is_closed: isClosed,
      opens_at: isClosed ? null : opensAt,
      shelter_id: shelterId,
      slot_duration_minutes: slotDuration,
      updated_at: new Date().toISOString(),
    };
  });

  const admin = createAdminClient();
  const { error } = await admin
    .from("shelter_regular_hours")
    .upsert(rows, { onConflict: "shelter_id,day_of_week" });

  revalidatePath("/admin/bookings");
  revalidatePath("/appointments");
  bookingsRedirect(shelterId, error ? "Operating days could not be saved." : "Operating days saved.");
}

export async function createShelterBlockoutAction(formData: FormData) {
  if (!(await isAdminGateOpen())) {
    return;
  }

  const shelterId = String(formData.get("shelterId") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") || startDate);
  const note = cleanText(formData.get("note"));

  if (!shelterId || !startDate || !endDate || endDate < startDate) {
    return;
  }

  const admin = createAdminClient() as any;
  const { error } = await admin
    .from("shelter_availability")
    .insert({
      availability_type: "unavailable",
      end_date: endDate,
      note,
      shelter_id: shelterId,
      start_date: startDate,
    });

  revalidatePath("/admin/bookings");
  revalidatePath("/appointments");
  bookingsRedirect(shelterId, error ? "Blockout date could not be added." : "Blockout date added.");
}

export async function toggleShelterBlockoutDateAction(formData: FormData) {
  if (!(await isAdminGateOpen())) {
    return;
  }

  const shelterId = String(formData.get("shelterId") ?? "");
  const date = String(formData.get("date") ?? "");
  const existingAvailabilityId = String(formData.get("availabilityId") ?? "");

  if (!shelterId || !date) {
    return;
  }

  const admin = createAdminClient() as any;
  const { error } = existingAvailabilityId
    ? await admin
        .from("shelter_availability")
        .delete()
        .eq("id", existingAvailabilityId)
        .eq("shelter_id", shelterId)
    : await admin
        .from("shelter_availability")
        .insert({
          availability_type: "unavailable",
          end_date: date,
          note: "Closed from admin calendar",
          shelter_id: shelterId,
          start_date: date,
        });

  revalidatePath("/admin/bookings");
  revalidatePath("/appointments");
  bookingsRedirect(shelterId, error ? "Calendar date could not be updated." : "Calendar date updated.");
}

export async function deleteShelterAvailabilityAction(formData: FormData) {
  if (!(await isAdminGateOpen())) {
    return;
  }

  const shelterId = String(formData.get("shelterId") ?? "");
  const availabilityId = String(formData.get("availabilityId") ?? "");

  if (!shelterId || !availabilityId) {
    return;
  }

  const admin = createAdminClient() as any;
  const { error } = await admin
    .from("shelter_availability")
    .delete()
    .eq("id", availabilityId)
    .eq("shelter_id", shelterId);

  revalidatePath("/admin/bookings");
  revalidatePath("/appointments");
  bookingsRedirect(shelterId, error ? "Blockout date could not be removed." : "Blockout date removed.");
}

export async function checkInBookingAction(formData: FormData) {
  if (!(await isAdminGateOpen())) {
    return;
  }

  const token = String(formData.get("token") ?? "");
  const note = String(formData.get("checkInNote") ?? "").trim();

  if (!token) {
    return;
  }

  const admin = createAdminClient();
  const { data: hashedAppointment } = await admin
    .from("appointments")
    .select("id, status")
    .eq("check_in_token_hash", hashCheckInToken(token))
    .maybeSingle();
  const appointmentIdFromToken = verifySignedCheckInToken({
    token,
    secret: getCheckInTokenSecret(),
  });
  const { data: signedAppointment } = !hashedAppointment && appointmentIdFromToken
    ? await admin
        .from("appointments")
        .select("id, status")
        .eq("id", appointmentIdFromToken)
        .maybeSingle()
    : { data: null };
  const appointment = hashedAppointment ?? signedAppointment;

  if (!appointment) {
    redirect("/admin/bookings/check-in?invalid=1");
  }

  const updatePayload = {
    check_in_note: note || null,
    checked_in_at: new Date().toISOString(),
    checked_in_by: "admin-gate",
    status: appointment.status === "requested" ? "confirmed" : appointment.status,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin
    .from("appointments")
    .update(updatePayload)
    .eq("id", appointment.id);

  if (error?.message.includes("Could not find") || error?.message.includes("column")) {
    await admin
      .from("appointments")
      .update({
        status: appointment.status === "requested" ? "confirmed" : appointment.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointment.id);
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointment.id}`);
  redirect(`${buildAdminBookingDetailPath({ appointmentId: appointment.id, token })}&checkedIn=1`);
}
