"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ensureAdopterForUser } from "@/utils/adopter";
import {
  APPOINTMENT_MESSAGES_UNAVAILABLE_MESSAGE,
  formatReturnInquiryMessageBody,
  isAppointmentMessagesUnavailableError,
} from "@/utils/appointment-messages";
import {
  sendAppointmentMessageNotificationForAppointment,
  sendReturnInquiryNotificationForAppointment,
} from "@/utils/booking-email";
import {
  getAppointmentMessageAttachmentFile,
  uploadAppointmentMessageAttachment,
} from "@/utils/appointment-message-attachments";
import { assertRateLimit } from "@/utils/rate-limit";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function cancelAppointmentAction(appointmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const adopter = await ensureAdopterForUser(supabase, user);
  try {
    await assertRateLimit({
      action: "appointment.message",
      identifier: `${user.id}:${appointmentId}`,
      limit: 20,
      windowSeconds: 10 * 60,
    });
  } catch (error) {
    redirect(`/appointments/${appointmentId}?tab=messages&message=${encodeURIComponent(error instanceof Error ? error.message : "Please wait before sending more messages.")}`);
  }
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
  const attachmentFile = getAppointmentMessageAttachmentFile(formData);

  if (!appointmentId || (!body && !attachmentFile)) {
    return;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(`/appointments/${appointmentId}?tab=messages`)}&message=${encodeURIComponent("Sign in to message the shelter.")}`);
  }

  const adopter = await ensureAdopterForUser(supabase, user);
  try {
    await assertRateLimit({
      action: "appointment.message",
      identifier: `${user.id}:${appointmentId}`,
      limit: 20,
      windowSeconds: 10 * 60,
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Please wait before sending more messages." };
  }
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

  let attachment: Awaited<ReturnType<typeof uploadAppointmentMessageAttachment>> | null = null;
  if (attachmentFile) {
    try {
      attachment = await uploadAppointmentMessageAttachment({
        appointmentId: appointment.id,
        file: attachmentFile,
        userId: user.id,
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Attachment could not be uploaded. Please try again.";
      redirect(`/appointments/${appointmentId}?tab=messages&message=${encodeURIComponent(message)}`);
    }
  }

  const senderLabel = [adopter.first_name, adopter.last_name].filter(Boolean).join(" ") || user.email || "Visitor";
  const { error } = await admin.from("appointment_messages").insert({
    adopter_id: adopter.id,
    appointment_id: appointment.id,
    attachment_name: attachment?.name ?? null,
    attachment_type: attachment?.type ?? null,
    attachment_url: attachment?.url ?? null,
    body: body || (attachment ? `Attachment: ${attachment.name}` : body),
    sender_label: senderLabel,
    sender_role: "adopter",
    shelter_id: appointment.shelter_id,
  });

  if (error) {
    const message = isAppointmentMessagesUnavailableError(error)
      ? APPOINTMENT_MESSAGES_UNAVAILABLE_MESSAGE
      : "Message could not be sent. Please try again.";
    redirect(`/appointments/${appointmentId}?tab=messages&message=${encodeURIComponent(message)}`);
  }

  await sendAppointmentMessageNotificationForAppointment({
    admin,
    appointmentId: appointment.id,
    attachmentName: attachment?.name ?? null,
    body: body || (attachment ? `Attachment: ${attachment.name}` : ""),
    senderLabel,
    senderRole: "adopter",
  });

  revalidatePath("/messages");
  revalidatePath(`/appointments/${appointmentId}`);
  redirect(`/appointments/${appointmentId}?tab=messages`);
}

export async function createReturnInquiryAction(appointmentId: string) {
  if (!appointmentId) return { ok: false, error: "Missing appointment" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();
  const { data: appointment } = await admin
    .from("appointments")
    .select("id, adopter_id, dog_id, shelter_id")
    .eq("id", appointmentId)
    .eq("adopter_id", adopter.id)
    .maybeSingle();

  if (!appointment) return { ok: false, error: "Not found" };

  const { error } = await admin.from("return_inquiries").insert({
    adopter_id: adopter.id,
    appointment_id: appointment.id,
    dog_id: appointment.dog_id,
    shelter_id: appointment.shelter_id,
  });

  if (error && error.code !== "23505") {
    console.error("Return inquiry could not be recorded", error);
    return { ok: false, error: "Return inquiry could not be recorded." };
  }

  if (!error) {
    await sendReturnInquiryNotificationForAppointment({
      admin,
      appointmentId: appointment.id,
    });
  }

  revalidatePath(`/appointments/${appointment.id}`);
  revalidatePath("/admin/bookings");
  return { ok: true };
}

export async function submitReturnInquiryAction(formData: FormData) {
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const reason = String(formData.get("returnReason") ?? "").trim();

  if (!appointmentId) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(`/appointments/${appointmentId}?tab=messages`)}&message=${encodeURIComponent("Sign in to contact the shelter.")}`);
  }

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();
  const { data: appointment } = await admin
    .from("appointments")
    .select("id, adopter_id, dog_id, shelter_id")
    .eq("id", appointmentId)
    .eq("adopter_id", adopter.id)
    .maybeSingle();

  if (!appointment) {
    redirect("/appointments");
  }

  const { error: inquiryError } = await admin.from("return_inquiries").insert({
    adopter_id: adopter.id,
    appointment_id: appointment.id,
    dog_id: appointment.dog_id,
    shelter_id: appointment.shelter_id,
  });

  if (inquiryError && inquiryError.code !== "23505") {
    console.error("Return inquiry could not be recorded", inquiryError);
    redirect(`/appointments/${appointment.id}?tab=messages&message=${encodeURIComponent("Return inquiry could not be sent.")}`);
  }

  const returnReason = reason || "No reason provided yet.";
  const { error: messageError } = await admin.from("appointment_messages").insert({
    adopter_id: adopter.id,
    appointment_id: appointment.id,
    body: formatReturnInquiryMessageBody(returnReason),
    sender_label: [adopter.first_name, adopter.last_name].filter(Boolean).join(" ") || user.email || "Visitor",
    sender_role: "adopter",
    shelter_id: appointment.shelter_id,
  });

  if (messageError) {
    const message = isAppointmentMessagesUnavailableError(messageError)
      ? APPOINTMENT_MESSAGES_UNAVAILABLE_MESSAGE
      : "Return inquiry message could not be sent.";
    redirect(`/appointments/${appointment.id}?tab=messages&message=${encodeURIComponent(message)}`);
  }

  if (!inquiryError) {
    await sendReturnInquiryNotificationForAppointment({
      admin,
      appointmentId: appointment.id,
    });
  }

  revalidatePath("/messages");
  revalidatePath(`/appointments/${appointment.id}`);
  revalidatePath("/admin");
  redirect(`/appointments/${appointment.id}?tab=messages`);
}
