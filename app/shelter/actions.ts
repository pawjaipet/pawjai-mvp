"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { logAdminAuditEvent } from "@/utils/admin-audit";
import {
  APPOINTMENT_MESSAGES_UNAVAILABLE_MESSAGE,
  isAppointmentMessagesUnavailableError,
} from "@/utils/appointment-messages";
import {
  getAppointmentMessageAttachmentFile,
  uploadAppointmentMessageAttachment,
} from "@/utils/appointment-message-attachments";
import { isMissingAppointmentColumnError } from "@/utils/appointment-queries";
import { sendAppointmentMessageNotificationForAppointment } from "@/utils/booking-email";
import {
  getShelterPortalTarget,
  isValidShelterPortalUsername,
  normalizeShelterPortalUsername,
  resolveShelterPilotLoginIdentifier,
} from "@/utils/shelter-portal";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/types/database";

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
  const currentPassword = getString(formData, "currentPassword");
  const newPassword = getString(formData, "newPassword");
  const confirmNewPassword = getString(formData, "confirmNewPassword");
  const returnTo = getString(formData, "returnTo");
  const portalTarget = await getShelterPortalTarget(context);
  const safeReturnTo = returnTo.startsWith("/shelter/") ? returnTo : portalTarget ?? "/shelter";

  if (!isValidShelterPortalUsername(username)) {
    redirect(`${safeReturnTo}?account=invalid-username`);
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(`${safeReturnTo}?account=invalid-email`);
  }

  if ((newPassword || confirmNewPassword) && newPassword.length < 6) {
    redirect(`${safeReturnTo}?account=weak-password`);
  }

  if (newPassword !== confirmNewPassword) {
    redirect(`${safeReturnTo}?account=password-mismatch`);
  }

  if (newPassword && !currentPassword) {
    redirect(`${safeReturnTo}?account=current-password-required`);
  }

  const admin = createAdminClient();
  const { data: usernameOwner, error: usernameLookupError } = await (admin as any)
    .from("shelter_portal_accounts")
    .select("profile_id")
    .eq("username", username)
    .neq("profile_id", context.userId)
    .maybeSingle();

  if (usernameLookupError) {
    redirect(`${safeReturnTo}?account=account-error`);
  }

  if (usernameOwner) {
    redirect(`${safeReturnTo}?account=username-taken`);
  }

  if (newPassword) {
    if (!context.userEmail) {
      redirect(`${safeReturnTo}?account=account-error`);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      redirect(`${safeReturnTo}?account=account-error`);
    }

    const passwordClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
    const { data: passwordCheck, error: passwordCheckError } = await passwordClient.auth.signInWithPassword({
      email: context.userEmail,
      password: currentPassword,
    });

    if (passwordCheckError || passwordCheck.user?.id !== context.userId) {
      redirect(`${safeReturnTo}?account=current-password-invalid`);
    }
  }

  const { error: authError } = await admin.auth.admin.updateUserById(context.userId, {
    email,
    email_confirm: true,
    ...(newPassword ? { password: newPassword } : {}),
  });

  if (authError) {
    redirect(`${safeReturnTo}?account=auth-error`);
  }

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
  const attachmentFile = getAppointmentMessageAttachmentFile(formData);
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

  let attachment: Awaited<ReturnType<typeof uploadAppointmentMessageAttachment>> | null = null;
  if (attachmentFile) {
    try {
      attachment = await uploadAppointmentMessageAttachment({
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
  const messagePayload = {
    adopter_id: appointment.adopter_id,
    appointment_id: appointment.id,
    attachment_name: attachment?.name ?? null,
    attachment_storage_path: attachment?.storagePath ?? null,
    attachment_type: attachment?.type ?? null,
    attachment_url: null,
    body: body || (attachment ? `Attachment: ${attachment.name}` : body),
    read_by_shelter_at: now,
    sender_label: senderLabel,
    sender_role: "shelter" as const,
    shelter_id: appointment.shelter_id,
  };

  let { error } = await admin.from("appointment_messages").insert(messagePayload);
  if (error && isMissingAppointmentColumnError(error, "attachment_storage_path")) {
    const legacyPayload = { ...messagePayload } as Omit<typeof messagePayload, "attachment_storage_path"> & {
      attachment_storage_path?: string | null;
    };
    delete legacyPayload.attachment_storage_path;
    ({ error } = await admin.from("appointment_messages").insert({
      ...legacyPayload,
      attachment_url: attachment?.url ?? null,
    }));
  }

  if (error) {
    const message = isAppointmentMessagesUnavailableError(error)
      ? APPOINTMENT_MESSAGES_UNAVAILABLE_MESSAGE
      : "Shelter message could not be sent.";
    redirect(appendShelterPortalParam(safeReturnTo, "message", message));
  }

  await sendAppointmentMessageNotificationForAppointment({
    admin,
    appointmentId: appointment.id,
    attachmentName: attachment?.name ?? null,
    body: body || (attachment ? `Attachment: ${attachment.name}` : ""),
    senderLabel,
    senderRole: "shelter",
  });

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
  revalidatePath("/admin");
  revalidatePath(safeReturnTo);
  redirect(safeReturnTo);
}
