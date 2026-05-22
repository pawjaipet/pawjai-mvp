"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";
import { hashCheckInToken } from "@/utils/booking";
import { isAdminGateOpen } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

const APPOINTMENT_STATUSES = new Set<AppointmentStatus>([
  "requested",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

function parseStatus(value: FormDataEntryValue | null): AppointmentStatus | null {
  const status = typeof value === "string" ? value : "";
  return APPOINTMENT_STATUSES.has(status as AppointmentStatus)
    ? (status as AppointmentStatus)
    : null;
}

export async function updateBookingStatusAction(formData: FormData) {
  if (!(await isAdminGateOpen())) {
    return;
  }

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const status = parseStatus(formData.get("status"));
  const shelterNote = String(formData.get("shelterNote") ?? "").trim();

  if (!appointmentId || !status) {
    return;
  }

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
  revalidatePath(`/appointments/${appointmentId}`);
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
  const { data: appointment } = await admin
    .from("appointments")
    .select("id, status")
    .eq("check_in_token_hash", hashCheckInToken(token))
    .maybeSingle();

  if (!appointment) {
    redirect("/admin/bookings/check-in?invalid=1");
  }

  await admin
    .from("appointments")
    .update({
      check_in_note: note || null,
      checked_in_at: new Date().toISOString(),
      checked_in_by: "admin-gate",
      status: appointment.status === "requested" ? "confirmed" : appointment.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointment.id);

  revalidatePath("/admin/bookings");
  revalidatePath(`/appointments/${appointment.id}`);
  redirect(`/admin/bookings/check-in?token=${encodeURIComponent(token)}&checkedIn=1`);
}
