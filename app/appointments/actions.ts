"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureAdopterForUser } from "@/utils/adopter";
import { isAppointmentTimeSlot, normalizeAppointmentTime, parseLegacyRescheduleNote } from "@/utils/appointments-model";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

function appointmentsRedirect(message: string): never {
  redirect(`/appointments?message=${encodeURIComponent(message)}`);
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isMissingSchemaError(error: { message?: string } | null | undefined) {
  const message = error?.message ?? "";
  return message.includes("Could not find")
    || message.includes("schema cache")
    || message.includes("does not exist");
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

  const { error } = await (admin as any)
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
    if (isMissingSchemaError(error)) {
      const { error: fallbackError } = await admin
        .from("appointments")
        .update({
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          shelter_note: null,
          status: "requested",
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", appointmentId)
        .eq("adopter_id", adopter.id);

      if (!fallbackError) {
        revalidatePath("/appointments");
        revalidatePath(`/appointments/${appointmentId}`);
        revalidatePath("/admin/bookings");
        appointmentsRedirect("Visit time updated. The shelter will review it again.");
      }
    }

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
  const { data: currentAppointment, error: currentAppointmentError } = await (admin as any)
    .from("appointments")
    .select("id, adopter_id, shelter_id, proposed_appointment_date, proposed_appointment_time, shelter_note, status")
    .eq("id", appointmentId)
    .eq("adopter_id", adopter.id)
    .maybeSingle();
  const { data: legacyAppointment } = currentAppointmentError && isMissingSchemaError(currentAppointmentError)
    ? await admin
        .from("appointments")
        .select("id, adopter_id, shelter_id, shelter_note, status")
        .eq("id", appointmentId)
        .eq("adopter_id", adopter.id)
        .maybeSingle()
    : { data: null };
  const appointment = currentAppointment ?? legacyAppointment;
  const legacyReschedule = parseLegacyRescheduleNote(appointment?.shelter_note);
  const proposedDate = appointment?.proposed_appointment_date ?? legacyReschedule?.proposedDate ?? null;
  const proposedTime = appointment?.proposed_appointment_time ?? legacyReschedule?.proposedTime ?? null;

  if (
    !appointment
    || !proposedDate
    || !proposedTime
    || appointment.status === "completed"
    || appointment.status === "no_show"
    || appointment.status === "cancelled"
  ) {
    appointmentsRedirect("That date change request is no longer available.");
  }

  const appointmentTime = normalizeAppointmentTime(proposedTime);
  const today = new Date().toISOString().slice(0, 10);
  if (proposedDate < today || !isAppointmentTimeSlot(appointmentTime)) {
    appointmentsRedirect("That proposed visit time is no longer available.");
  }

  const { data: existingAppointment } = await admin
    .from("appointments")
    .select("id")
    .eq("shelter_id", appointment.shelter_id)
    .eq("appointment_date", proposedDate)
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
      appointment_date: proposedDate,
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
    if (isMissingSchemaError(error)) {
      const { error: fallbackError } = await admin
        .from("appointments")
        .update({
          appointment_date: proposedDate,
          appointment_time: appointmentTime,
          shelter_note: null,
          status: "confirmed",
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", appointmentId)
        .eq("adopter_id", adopter.id);

      if (!fallbackError) {
        revalidatePath("/appointments");
        revalidatePath(`/appointments/${appointmentId}`);
        revalidatePath("/admin/bookings");
        appointmentsRedirect("New visit time accepted.");
      }
    }

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
    if (isMissingSchemaError(error)) {
      const { error: fallbackError } = await admin
        .from("appointments")
        .update({
          shelter_note: "Visitor cancelled this appointment.",
          status: "cancelled",
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", appointmentId)
        .eq("adopter_id", adopter.id)
        .neq("status", "completed")
        .neq("status", "no_show");

      if (!fallbackError) {
        revalidatePath("/appointments");
        revalidatePath(`/appointments/${appointmentId}`);
        revalidatePath("/admin/bookings");
        appointmentsRedirect("Visit cancelled.");
      }
    }

    appointmentsRedirect("We could not cancel that visit. Please try again.");
  }

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/admin/bookings");
  appointmentsRedirect("Visit cancelled.");
}
