"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureAdopterForUser } from "@/utils/adopter";
import { isAppointmentTimeSlot, normalizeAppointmentTime } from "@/utils/appointments-model";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

function appointmentsRedirect(message: string): never {
  redirect(`/appointments?message=${encodeURIComponent(message)}`);
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function updateAppointmentDateTimeAction(formData: FormData) {
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const appointmentDate = String(formData.get("appointmentDate") ?? "");
  const appointmentTime = normalizeAppointmentTime(String(formData.get("appointmentTime") ?? ""));

  if (!appointmentId || !isIsoDate(appointmentDate) || !isAppointmentTimeSlot(appointmentTime)) {
    appointmentsRedirect("Choose a valid visit date and time.");
  }

  const today = new Date().toISOString().slice(0, 10);
  if (appointmentDate < today) {
    appointmentsRedirect("Choose a future visit date.");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?next=${encodeURIComponent("/appointments")}&message=${encodeURIComponent("Sign in to update your visit.")}`);
  }

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();
  const { data: currentAppointment } = await admin
    .from("appointments")
    .select("id, shelter_id, status")
    .eq("id", appointmentId)
    .eq("adopter_id", adopter.id)
    .maybeSingle();

  if (!currentAppointment || currentAppointment.status === "completed" || currentAppointment.status === "no_show") {
    appointmentsRedirect("That visit can no longer be edited.");
  }

  const { data: existingAppointment } = await admin
    .from("appointments")
    .select("id")
    .eq("shelter_id", currentAppointment.shelter_id)
    .eq("appointment_date", appointmentDate)
    .eq("appointment_time", appointmentTime)
    .neq("id", appointmentId)
    .neq("status", "cancelled")
    .neq("status", "no_show")
    .limit(1)
    .maybeSingle();

  if (existingAppointment) {
    appointmentsRedirect("That visit time is already booked. Please choose another time.");
  }

  const { error } = await admin
    .from("appointments")
    .update({
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      proposed_appointment_date: null,
      proposed_appointment_time: null,
      reschedule_note: null,
      reschedule_requested_by: null,
      shelter_note: null,
      status: "requested",
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", appointmentId)
    .eq("adopter_id", adopter.id);

  if (error) {
    const message = error.message.includes("appointments_active_slot_unique_idx")
      ? "That visit time is already booked. Please choose another time."
      : "We could not update that visit time. Please try again.";
    appointmentsRedirect(message);
  }

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/admin/bookings");
  appointmentsRedirect("Visit time updated. The shelter will review it again.");
}

export async function acceptRescheduleRequestAction(formData: FormData) {
  const appointmentId = String(formData.get("appointmentId") ?? "");
  if (!appointmentId) {
    appointmentsRedirect("That visit could not be found.");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?next=${encodeURIComponent("/appointments")}&message=${encodeURIComponent("Sign in to update your visit.")}`);
  }

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();
  const { data: currentAppointment } = await (admin as any)
    .from("appointments")
    .select("id, adopter_id, shelter_id, proposed_appointment_date, proposed_appointment_time, status")
    .eq("id", appointmentId)
    .eq("adopter_id", adopter.id)
    .maybeSingle();

  if (
    !currentAppointment
    || !currentAppointment.proposed_appointment_date
    || !currentAppointment.proposed_appointment_time
    || currentAppointment.status === "completed"
    || currentAppointment.status === "no_show"
    || currentAppointment.status === "cancelled"
  ) {
    appointmentsRedirect("That date change request is no longer available.");
  }

  const appointmentTime = normalizeAppointmentTime(currentAppointment.proposed_appointment_time);
  const today = new Date().toISOString().slice(0, 10);
  if (currentAppointment.proposed_appointment_date < today || !isAppointmentTimeSlot(appointmentTime)) {
    appointmentsRedirect("That proposed visit time is no longer available.");
  }

  const { data: existingAppointment } = await admin
    .from("appointments")
    .select("id")
    .eq("shelter_id", currentAppointment.shelter_id)
    .eq("appointment_date", currentAppointment.proposed_appointment_date)
    .eq("appointment_time", appointmentTime)
    .neq("id", appointmentId)
    .neq("status", "cancelled")
    .neq("status", "no_show")
    .limit(1)
    .maybeSingle();

  if (existingAppointment) {
    appointmentsRedirect("That visit time was just booked. Please request another time.");
  }

  const { error } = await (admin as any)
    .from("appointments")
    .update({
      appointment_date: currentAppointment.proposed_appointment_date,
      appointment_time: appointmentTime,
      proposed_appointment_date: null,
      proposed_appointment_time: null,
      reschedule_note: null,
      reschedule_requested_by: null,
      shelter_note: null,
      status: "confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)
    .eq("adopter_id", adopter.id);

  if (error) {
    appointmentsRedirect("We could not accept that date change. Please try again.");
  }

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/admin/bookings");
  appointmentsRedirect("New visit time accepted.");
}

export async function cancelAppointmentFromListAction(formData: FormData) {
  const appointmentId = String(formData.get("appointmentId") ?? "");
  if (!appointmentId) {
    appointmentsRedirect("That visit could not be found.");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?next=${encodeURIComponent("/appointments")}&message=${encodeURIComponent("Sign in to update your visit.")}`);
  }

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();
  const { error } = await (admin as any)
    .from("appointments")
    .update({
      proposed_appointment_date: null,
      proposed_appointment_time: null,
      reschedule_note: null,
      reschedule_requested_by: null,
      shelter_note: "Visitor cancelled this appointment.",
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)
    .eq("adopter_id", adopter.id)
    .neq("status", "completed")
    .neq("status", "no_show");

  if (error) {
    appointmentsRedirect("We could not cancel that visit. Please try again.");
  }

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/admin/bookings");
  appointmentsRedirect("Visit cancelled.");
}
