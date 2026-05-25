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
      shelter_note: null,
      status: "requested",
      updated_at: new Date().toISOString(),
    })
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
