"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";
import { buildAdminBookingDetailPath, getCheckInTokenSecret, hashCheckInToken, verifySignedCheckInToken } from "@/utils/booking";
import { isAdminGateOpen } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

type BookingDecision = "accept" | "deny" | "request_change";

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
