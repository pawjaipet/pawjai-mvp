"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ensureAdopterForUser } from "@/utils/adopter";
import {
  APPOINTMENT_MESSAGES_UNAVAILABLE_MESSAGE,
  isAppointmentMessagesUnavailableError,
} from "@/utils/appointment-messages";
import { sendReturnInquiryNotificationForAppointment } from "@/utils/booking-email";
import { assertRateLimit } from "@/utils/rate-limit";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const CHAT_ATTACHMENTS_BUCKET = "dog-photos";
const CHAT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
const CHAT_ATTACHMENT_MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getAttachmentExtension(file: File) {
  const fromType = CHAT_ATTACHMENT_MIME_TO_EXTENSION[file.type];
  if (fromType) return fromType;

  const match = file.name.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() ?? "jpg";
}

function getAppointmentAttachmentFile(formData: FormData) {
  const file = formData.get("attachment");
  if (!(file instanceof File) || file.size <= 0) return null;
  return file;
}

async function uploadAppointmentAttachment({
  appointmentId,
  file,
  userId,
}: {
  appointmentId: string;
  file: File;
  userId: string;
}) {
  if (!Object.hasOwn(CHAT_ATTACHMENT_MIME_TO_EXTENSION, file.type)) {
    throw new Error("Only JPG, PNG, and WebP photos can be attached to appointment messages.");
  }

  if (file.size > CHAT_ATTACHMENT_MAX_BYTES) {
    throw new Error("Photos must be 10 MB or smaller.");
  }

  const admin = createAdminClient();
  const extension = getAttachmentExtension(file);
  const storagePath = `appointment-messages/${appointmentId}/${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage.from(CHAT_ATTACHMENTS_BUCKET).upload(storagePath, buffer, {
    contentType: file.type,
    metadata: {
      appointmentId,
      originalName: file.name,
      uploadedBy: userId,
    },
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Supabase attachment upload failed: ${uploadError.message}`);
  }

  const { data } = admin.storage.from(CHAT_ATTACHMENTS_BUCKET).getPublicUrl(storagePath);

  return {
    name: file.name,
    type: file.type,
    url: data.publicUrl,
  };
}

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
  const attachmentFile = getAppointmentAttachmentFile(formData);

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

  let attachment: Awaited<ReturnType<typeof uploadAppointmentAttachment>> | null = null;
  if (attachmentFile) {
    try {
      attachment = await uploadAppointmentAttachment({
        appointmentId: appointment.id,
        file: attachmentFile,
        userId: user.id,
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Photo could not be uploaded. Please try again.";
      redirect(`/appointments/${appointmentId}?tab=messages&message=${encodeURIComponent(message)}`);
    }
  }

  const { error } = await admin.from("appointment_messages").insert({
    adopter_id: adopter.id,
    appointment_id: appointment.id,
    attachment_name: attachment?.name ?? null,
    attachment_type: attachment?.type ?? null,
    attachment_url: attachment?.url ?? null,
    body: body || (attachment ? `Photo attached: ${attachment.name}` : body),
    sender_label: [adopter.first_name, adopter.last_name].filter(Boolean).join(" ") || user.email || "Visitor",
    sender_role: "adopter",
    shelter_id: appointment.shelter_id,
  });

  if (error) {
    const message = isAppointmentMessagesUnavailableError(error)
      ? APPOINTMENT_MESSAGES_UNAVAILABLE_MESSAGE
      : "Message could not be sent. Please try again.";
    redirect(`/appointments/${appointmentId}?tab=messages&message=${encodeURIComponent(message)}`);
  }

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
    body: `Return inquiry requested.\n\nReason: ${returnReason}`,
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
  revalidatePath("/admindraft");
  redirect(`/appointments/${appointment.id}?tab=messages`);
}
