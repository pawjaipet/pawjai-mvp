"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { logAdminAuditEvent } from "@/utils/admin-audit";
import {
  APPOINTMENT_MESSAGES_UNAVAILABLE_MESSAGE,
  isAppointmentMessagesUnavailableError,
} from "@/utils/appointment-messages";
import {
  getShelterPortalTarget,
  isValidShelterPortalUsername,
  normalizeShelterPortalUsername,
  resolveShelterPilotLoginIdentifier,
} from "@/utils/shelter-portal";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const SHELTER_CHAT_ATTACHMENTS_BUCKET = "dog-photos";
const SHELTER_CHAT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
const SHELTER_CHAT_ATTACHMENT_MIME_TO_EXTENSION: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function shelterLoginRedirect(message: string): never {
  const params = new URLSearchParams();
  params.set("message", message);
  redirect(`/shelter?${params.toString()}`);
}

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function appendShelterPortalParam(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}

function getShelterAttachmentFile(formData: FormData) {
  const file = formData.get("attachment");
  if (!(file instanceof File) || file.size <= 0) return null;
  return file;
}

function getShelterAttachmentExtension(file: File) {
  const fromType = SHELTER_CHAT_ATTACHMENT_MIME_TO_EXTENSION[file.type];
  if (fromType) return fromType;

  const match = file.name.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() ?? "file";
}

async function uploadShelterAppointmentAttachment({
  appointmentId,
  file,
  userId,
}: {
  appointmentId: string;
  file: File;
  userId: string | null;
}) {
  if (!Object.hasOwn(SHELTER_CHAT_ATTACHMENT_MIME_TO_EXTENSION, file.type)) {
    throw new Error("Only JPG, PNG, WebP, or PDF files can be attached to shelter messages.");
  }

  if (file.size > SHELTER_CHAT_ATTACHMENT_MAX_BYTES) {
    throw new Error("Files must be 10 MB or smaller.");
  }

  const admin = createAdminClient();
  const extension = getShelterAttachmentExtension(file);
  const storagePath = `appointment-messages/${appointmentId}/${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage.from(SHELTER_CHAT_ATTACHMENTS_BUCKET).upload(storagePath, buffer, {
    contentType: file.type,
    metadata: {
      appointmentId,
      originalName: file.name,
      uploadedBy: userId ?? "shelter",
    },
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Supabase attachment upload failed: ${uploadError.message}`);
  }

  const { data } = admin.storage.from(SHELTER_CHAT_ATTACHMENTS_BUCKET).getPublicUrl(storagePath);

  return {
    name: file.name,
    type: file.type,
    url: data.publicUrl,
  };
}

export async function signInShelterPortalAction(formData: FormData) {
  const identifier = getString(formData, "identifier") || getString(formData, "email");
  const email = await resolveShelterPilotLoginIdentifier(identifier);
  const password = getString(formData, "password");

  if (!email) {
    shelterLoginRedirect("Enter a valid shelter username.");
  }

  if (!password) {
    shelterLoginRedirect("Enter the account password.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    shelterLoginRedirect("Sign-in failed. Check the username and password.");
  }

  const context = await getAdminAuthContext({ includePhraseGate: false });
  if (!context || context.role !== "shelter_admin") {
    await supabase.auth.signOut();
    shelterLoginRedirect("This account is not linked to a shelter portal.");
  }

  const redirectTo = await getShelterPortalTarget(context);
  if (!redirectTo || !redirectTo.startsWith("/shelter/")) {
    await supabase.auth.signOut();
    shelterLoginRedirect("This shelter account is not linked to a shelter yet.");
  }

  revalidatePath("/shelter");
  redirect(redirectTo);
}

export async function updateShelterPortalAccountAction(formData: FormData) {
  const context = await getAdminAuthContext({ includePhraseGate: false });

  if (!context || context.role !== "shelter_admin" || !context.userId) {
    redirect("/shelter?message=Sign in to update your shelter account.");
  }

  const username = normalizeShelterPortalUsername(getString(formData, "username"));
  const email = getString(formData, "email").toLowerCase();
  const newPassword = getString(formData, "newPassword");
  const returnTo = getString(formData, "returnTo");
  const portalTarget = await getShelterPortalTarget(context);
  const safeReturnTo = returnTo.startsWith("/shelter/") ? returnTo : portalTarget ?? "/shelter";

  if (!isValidShelterPortalUsername(username)) {
    redirect(`${safeReturnTo}?account=invalid-username`);
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(`${safeReturnTo}?account=invalid-email`);
  }

  if (newPassword && newPassword.length < 6) {
    redirect(`${safeReturnTo}?account=weak-password`);
  }

  const admin = createAdminClient();
  const { error: usernameError } = await (admin as any)
    .from("shelter_portal_accounts")
    .upsert({
      profile_id: context.userId,
      username,
    }, { onConflict: "profile_id" });

  if (usernameError) {
    const message = String(usernameError.message ?? "").toLowerCase().includes("duplicate")
      ? "username-taken"
      : "account-error";
    redirect(`${safeReturnTo}?account=${message}`);
  }

  const { error: authError } = await admin.auth.admin.updateUserById(context.userId, {
    email,
    email_confirm: true,
    ...(newPassword ? { password: newPassword } : {}),
  });

  if (authError) {
    redirect(`${safeReturnTo}?account=auth-error`);
  }

  await logAdminAuditEvent({
    action: "shelter_portal_account.update",
    context,
    metadata: {
      changedEmail: email !== context.userEmail,
      changedPassword: Boolean(newPassword),
      username,
    },
    shelterId: context.shelterIds[0] ?? null,
    targetId: context.userId,
    targetTable: "shelter_portal_accounts",
  });

  revalidatePath("/shelter");
  revalidatePath(safeReturnTo);
  redirect(`${safeReturnTo}?account=saved`);
}

export async function signOutShelterPortalAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/shelter");
  redirect("/shelter");
}

export async function sendShelterAppointmentMessageAction(formData: FormData) {
  const appointmentId = getString(formData, "appointmentId");
  const body = getString(formData, "body");
  const attachmentFile = getShelterAttachmentFile(formData);
  const returnTo = getString(formData, "returnTo");
  const context = await getAdminAuthContext({ includePhraseGate: false });

  if (!context || context.role !== "shelter_admin") {
    redirect("/shelter?message=Sign in with a shelter account to send messages.");
  }

  const portalTarget = await getShelterPortalTarget(context);
  const safeReturnTo = returnTo.startsWith("/shelter/")
    ? returnTo
    : portalTarget
      ? `${portalTarget}?view=messages`
      : "/shelter";

  if (!appointmentId || (!body && !attachmentFile)) {
    redirect(safeReturnTo);
  }

  const admin = createAdminClient();
  const { data: appointment } = await admin
    .from("appointments")
    .select("id,adopter_id,shelter_id")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appointment || !context.shelterIds.includes(appointment.shelter_id)) {
    redirect(appendShelterPortalParam(safeReturnTo, "message", "thread-unavailable"));
  }

  let attachment: Awaited<ReturnType<typeof uploadShelterAppointmentAttachment>> | null = null;
  if (attachmentFile) {
    try {
      attachment = await uploadShelterAppointmentAttachment({
        appointmentId: appointment.id,
        file: attachmentFile,
        userId: context.userId,
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Attachment could not be uploaded. Please try again.";
      redirect(appendShelterPortalParam(safeReturnTo, "message", message));
    }
  }

  const senderLabel = context.fullName || context.userEmail || "Shelter team";
  const now = new Date().toISOString();
  const { error } = await admin.from("appointment_messages").insert({
    adopter_id: appointment.adopter_id,
    appointment_id: appointment.id,
    attachment_name: attachment?.name ?? null,
    attachment_type: attachment?.type ?? null,
    attachment_url: attachment?.url ?? null,
    body: body || (attachment ? `Attachment: ${attachment.name}` : body),
    read_by_shelter_at: now,
    sender_label: senderLabel,
    sender_role: "shelter",
    shelter_id: appointment.shelter_id,
  });

  if (error) {
    const message = isAppointmentMessagesUnavailableError(error)
      ? APPOINTMENT_MESSAGES_UNAVAILABLE_MESSAGE
      : "Shelter message could not be sent.";
    redirect(appendShelterPortalParam(safeReturnTo, "message", message));
  }

  await logAdminAuditEvent({
    action: "appointment_message.shelter_send",
    context,
    metadata: {
      appointmentId: appointment.id,
    },
    shelterId: appointment.shelter_id,
    targetId: appointment.id,
    targetTable: "appointment_messages",
  });

  revalidatePath("/messages");
  revalidatePath(`/appointments/${appointment.id}`);
  revalidatePath("/admindraft");
  revalidatePath(safeReturnTo);
  redirect(safeReturnTo);
}
