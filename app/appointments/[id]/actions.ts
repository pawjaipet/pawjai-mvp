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
