"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ensureAdopterForUser } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function cancelAppointmentAction(appointmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();

  // Confirm ownership before mutating
  const { data: appt } = await admin
    .from("appointments")
    .select("id, adopter_id, status")
    .eq("id", appointmentId)
    .eq("adopter_id", adopter.id)
    .maybeSingle();

  if (!appt) return { ok: false, error: "Not found" };
  if (appt.status === "cancelled" || appt.status === "completed") {
    return { ok: false, error: "Already finalized" };
  }

  const { error } = await admin
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
  redirect("/appointments");
}

export async function sendAppointmentMessageAction(formData: FormData) {
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!appointmentId || !body) {
    return;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(`/appointments/${appointmentId}?tab=messages`)}&message=${encodeURIComponent("Sign in to message the shelter.")}`);
  }

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();
  const { data: appointment } = await admin
    .from("appointments")
    .select("id, adopter_id, shelter_id")
    .eq("id", appointmentId)
    .eq("adopter_id", adopter.id)
    .maybeSingle();

  if (!appointment) {
    redirect("/appointments");
  }

  const { error } = await (admin as any).from("appointment_messages").insert({
    adopter_id: adopter.id,
    appointment_id: appointment.id,
    body,
    sender_label: [adopter.first_name, adopter.last_name].filter(Boolean).join(" ") || user.email || "Visitor",
    sender_role: "adopter",
    shelter_id: appointment.shelter_id,
  });

  if (error) {
    redirect(`/appointments/${appointmentId}?tab=messages&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/messages");
  revalidatePath(`/appointments/${appointmentId}`);
  redirect(`/appointments/${appointmentId}?tab=messages`);
}
