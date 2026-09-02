"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import type { Database } from "@/types/database";
import {
  APPOINTMENT_MESSAGES_UNAVAILABLE_MESSAGE,
  isAppointmentMessagesUnavailableError,
} from "@/utils/appointment-messages";
import { logAdminAuditEvent } from "@/utils/admin-audit";
import { buildLegacyRescheduleNote, isAppointmentTimeSlot, normalizeAppointmentTime } from "@/utils/appointments-model";
import { sendBookingNotificationForAppointment } from "@/utils/booking-email";
import { getCheckInTokenSecret, hashCheckInToken, verifySignedCheckInToken } from "@/utils/booking";
import { parseShelterDonationDetails } from "@/utils/donations";
import { linkDogCarePassportToAdopter } from "@/utils/dog-care-passport-actions";
import { requireAdminWorkspace, requireShelterAccess, type AdminAuthContext } from "@/utils/admin-auth";
import { bookingWorkspaceDetailHref } from "@/utils/booking-workspace-routes";
import { getShelterPortalTarget } from "@/utils/shelter-portal";
import { createAdminClient } from "@/utils/supabase/admin";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

type BookingDecision = "accept" | "deny" | "request_change" | "complete" | "no_show" | "adopted";
const SHELTER_ASSETS_BUCKET = "shelter-assets";
const SHELTER_LOGO_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function cleanText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function bookingsRedirect(shelterId: string, message: string) {
  const params = new URLSearchParams({ view: "bookings" });
  if (shelterId) params.set("shelter", shelterId);
  if (message) params.set("message", message);
  redirect(`/admin?${params.toString()}`);
}

function shelterViewRedirect(shelterId: string, view: string, message: string): never {
  const params = new URLSearchParams();
  if (shelterId) params.set("shelter", shelterId);
  if (view) params.set("view", view);
  if (message) params.set("message", message);
  redirect(`/admin?${params.toString()}`);
}

async function redirectAfterShelterMutation(
  formData: FormData,
  context: AdminAuthContext,
  shelterId: string,
  view: string,
  message: string,
): Promise<never> {
  const returnTo = String(formData.get("returnTo") ?? "");

  if (!context.isGlobalAdmin) {
    const portalTarget = await getShelterPortalTarget(context);
    const fallback = portalTarget ? `${portalTarget}?view=${view}` : "/shelter";
    const allowedPortalReturn = portalTarget
      ? returnTo === portalTarget || returnTo.startsWith(`${portalTarget}?`) || returnTo.startsWith(`${portalTarget}/`)
      : returnTo === "/shelter" || returnTo.startsWith("/shelter?");
    const url = new URL(allowedPortalReturn ? returnTo : fallback, "https://pawjai.local");
    if (message) url.searchParams.set("message", message);
    redirect(`${url.pathname}${url.search}`);
  }

  if (returnTo.startsWith("/admin") || returnTo.startsWith("/admindraft")) {
    const canonicalReturnTo = returnTo.replace(/^\/admindraft/, "/admin");
    const url = new URL(canonicalReturnTo, "https://pawjai.local");
    if (url.pathname === "/admin") {
      if (shelterId && !url.searchParams.has("shelter")) url.searchParams.set("shelter", shelterId);
      if (view && !url.searchParams.has("view")) url.searchParams.set("view", view);
    }
    if (message) url.searchParams.set("message", message);
    redirect(`${url.pathname}${url.search}`);
  }

  if (returnTo.startsWith("/shelter/")) {
    const url = new URL(returnTo, "https://pawjai.local");
    if (message) url.searchParams.set("message", message);
    redirect(`${url.pathname}${url.search}`);
  }

  shelterViewRedirect(shelterId, view, message);
}

function addBookingRedirectMessage(path: string, message: string) {
  const url = new URL(path, "https://pawjai.local");
  if (message) url.searchParams.set("message", message);
  return `${url.pathname}${url.search}`;
}

function visitBucketForDecision(decision: BookingDecision) {
  if (decision === "adopted") return "adopted";
  if (decision === "complete" || decision === "no_show") return "history";
  return null;
}

function successMessageForDecision(decision: BookingDecision) {
  switch (decision) {
    case "accept":
      return "Booking accepted.";
    case "deny":
      return "Booking denied.";
    case "request_change":
      return "Date/time change request sent.";
    case "complete":
      return "Visit moved to History.";
    case "no_show":
      return "Visitor no-show recorded.";
    case "adopted":
      return "Dog marked as adopted.";
  }
}

async function safeBookingMutationReturnTo({ appointmentId, context, requestedReturnTo, shelterId }: {
  appointmentId: string;
  context: AdminAuthContext;
  requestedReturnTo: string;
  shelterId: string;
}) {
  const requested = requestedReturnTo.trim();
  const portalTarget = context.isGlobalAdmin ? null : await getShelterPortalTarget(context);
  const fallbackListHref = context.isGlobalAdmin
    ? `/admin?shelter=${shelterId}&view=bookings`
    : `${portalTarget ?? "/shelter"}?view=bookings`;
  const fallbackDetailHref = bookingWorkspaceDetailHref({ appointmentId, bookingListHref: fallbackListHref });

  if (!requested.startsWith("/") || requested.startsWith("//")) {
    return { detailHref: fallbackDetailHref, returnTo: fallbackListHref };
  }

  if (context.isGlobalAdmin) {
    const canonicalRequested = requested.replace(/^\/admindraft/, "/admin");
    const allowed = canonicalRequested === "/admin"
      || canonicalRequested.startsWith("/admin?")
      || canonicalRequested.startsWith("/admin/bookings")
      || requested.startsWith(`/booking/${appointmentId}`);
    return allowed
      ? { detailHref: fallbackDetailHref, returnTo: canonicalRequested }
      : { detailHref: fallbackDetailHref, returnTo: fallbackListHref };
  }

  const allowedShelterPath = portalTarget
    ? requested === portalTarget || requested.startsWith(`${portalTarget}?`) || requested.startsWith(`${portalTarget}/`)
    : requested === "/shelter" || requested.startsWith("/shelter?");
  return allowedShelterPath
    ? { detailHref: fallbackDetailHref, returnTo: requested }
    : { detailHref: fallbackDetailHref, returnTo: fallbackListHref };
}

async function redirectAfterBookingDecision(
  formData: FormData,
  message: string,
  context: AdminAuthContext,
  appointmentId: string,
  shelterId: string,
  decision: BookingDecision,
) {
  const returnTo = String(formData.get("returnTo") ?? "");
  const safeTarget = await safeBookingMutationReturnTo({ appointmentId, context, requestedReturnTo: returnTo, shelterId });
  const url = new URL(addBookingRedirectMessage(safeTarget.returnTo, message), "https://pawjai.local");
  const visitBucket = visitBucketForDecision(decision);
  if (visitBucket) {
    url.searchParams.set("view", "bookings");
    url.searchParams.set("bookingView", "visits");
    url.searchParams.set("visitBucket", visitBucket);
  }
  redirect(`${url.pathname}${url.search}`);
}

async function redirectAfterCheckIn(
  formData: FormData,
  appointmentId: string,
  token: string,
  context: AdminAuthContext,
  shelterId: string,
) {
  const returnTo = String(formData.get("returnTo") ?? "");
  const safeTarget = await safeBookingMutationReturnTo({ appointmentId, context, requestedReturnTo: returnTo, shelterId });
  const target = safeTarget.returnTo.includes(`/booking/${appointmentId}`)
    || safeTarget.returnTo.includes(`/bookings/${appointmentId}`)
    ? safeTarget.returnTo
    : safeTarget.detailHref;
  const url = new URL(target, "https://pawjai.local");
  if (token) url.searchParams.set("token", token);
  url.searchParams.set("checkedIn", "1");
  redirect(`${url.pathname}${url.search}`);
}

function isMissingSchemaError(error: { message?: string } | null | undefined) {
  const message = error?.message ?? "";
  return message.includes("Could not find")
    || message.includes("schema cache")
    || message.includes("does not exist");
}

function describeShelterProfileSaveError(error: { code?: string; message?: string } | null | undefined) {
  const message = error?.message ?? "";

  if (error?.code === "23505" || message.toLowerCase().includes("duplicate key")) {
    return "That email is already used by another shelter. Use a different booking notification email.";
  }

  if (message.toLowerCase().includes("email")) {
    return "Email for booking notifications could not be saved. Check the email and try again.";
  }

  return "Shelter profile could not be saved. Please try again.";
}

function extensionForMimeType(type: string) {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

async function uploadShelterLogo({
  admin,
  file,
  shelterId,
}: {
  admin: ReturnType<typeof createAdminClient>;
  file: File;
  shelterId: string;
}) {
  if (!SHELTER_LOGO_MIME_TYPES.has(file.type)) {
    return { error: "Please upload a PNG, JPG, or WEBP logo.", url: null };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "Logo file must be 5 MB or smaller.", url: null };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const digest = createHash("sha256").update(buffer).digest("hex").slice(0, 16);
  const path = `${shelterId}/logo-${Date.now()}-${digest}.${extensionForMimeType(file.type)}`;
  const { error } = await admin.storage.from(SHELTER_ASSETS_BUCKET).upload(path, buffer, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    return {
      error: error.message.includes("Bucket not found")
        ? "Logo upload needs the shelter-assets Supabase migration before it can save."
        : error.message,
      url: null,
    };
  }

  const { data } = admin.storage.from(SHELTER_ASSETS_BUCKET).getPublicUrl(path);
  return { error: null, url: data.publicUrl };
}

async function saveWeeklyClosuresAsBlockouts({
  admin,
  closedDays,
  shelterId,
}: {
  admin: ReturnType<typeof createAdminClient>;
  closedDays: Set<number>;
  shelterId: string;
}) {
  const fallbackNotePrefix = "Recurring weekly closure:";
  await (admin as any)
    .from("shelter_availability")
    .delete()
    .eq("shelter_id", shelterId)
    .like("note", `${fallbackNotePrefix}%`);

  if (closedDays.size === 0) {
    return null;
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const rows = Array.from({ length: 366 }, (_, offset) => {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    return date;
  })
    .filter((date) => closedDays.has(date.getDay()))
    .map((date) => {
      const dateKey = date.toISOString().slice(0, 10);
      return {
        availability_type: "unavailable",
        end_date: dateKey,
        note: `${fallbackNotePrefix}${date.getDay()}`,
        shelter_id: shelterId,
        start_date: dateKey,
      };
    });

  const { error } = await (admin as any)
    .from("shelter_availability")
    .insert(rows);

  return error;
}

function parseDecision(value: FormDataEntryValue | null): BookingDecision | null {
  const decision = typeof value === "string" ? value : "";
  return decision === "accept"
    || decision === "deny"
    || decision === "request_change"
    || decision === "complete"
    || decision === "no_show"
    || decision === "adopted"
    ? decision
    : null;
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function statusForDecision(decision: BookingDecision): AppointmentStatus {
  switch (decision) {
    case "accept":
      return "confirmed";
    case "deny":
      return "cancelled";
    case "request_change":
      return "requested";
    case "complete":
    case "adopted":
      return "completed";
    case "no_show":
      return "no_show";
  }
}

async function updateAppointmentWithRescheduleFallback({
  admin,
  appointmentId,
  legacyUpdate,
  update,
}: {
  admin: ReturnType<typeof createAdminClient>;
  appointmentId: string;
  legacyUpdate: Record<string, unknown>;
  update: Record<string, unknown>;
}) {
  const { error } = await (admin as any)
    .from("appointments")
    .update(update)
    .eq("id", appointmentId);

  if (!isMissingSchemaError(error)) {
    return error;
  }

  const { error: fallbackError } = await admin
    .from("appointments")
    .update(legacyUpdate as any)
    .eq("id", appointmentId);

  return fallbackError;
}

export async function decideBookingAction(formData: FormData) {
  await requireAdminWorkspace("/admin/bookings");

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const decision = parseDecision(formData.get("decision"));
  const shelterNote = String(formData.get("shelterNote") ?? "").trim();
  const proposedAppointmentDate = String(formData.get("proposedAppointmentDate") ?? "");
  const proposedAppointmentTime = normalizeAppointmentTime(String(formData.get("proposedAppointmentTime") ?? ""));

  if (!appointmentId || !decision) {
    return;
  }

  const status = statusForDecision(decision);
  const admin = createAdminClient();
  const { data: appointment } = await admin
    .from("appointments")
    .select("id, adopter_id, dog_id, shelter_id")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appointment) {
    return;
  }

  const adminContext = await requireShelterAccess(appointment.shelter_id, "/admin/bookings");

  let updateError = null;

  if (decision === "request_change") {
    if (!appointment || !isIsoDate(proposedAppointmentDate) || !isAppointmentTimeSlot(proposedAppointmentTime)) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    if (proposedAppointmentDate < today) {
      return;
    }

    const { data: existingAppointment } = await admin
      .from("appointments")
      .select("id")
      .eq("shelter_id", appointment.shelter_id)
      .eq("appointment_date", proposedAppointmentDate)
      .eq("appointment_time", proposedAppointmentTime)
      .neq("id", appointmentId)
      .neq("status", "cancelled")
      .neq("status", "no_show")
      .limit(1)
      .maybeSingle();

    if (existingAppointment) {
      return;
    }

    const legacyUpdate = {
      shelter_note: buildLegacyRescheduleNote({
        note: shelterNote,
        proposedDate: proposedAppointmentDate,
        proposedTime: proposedAppointmentTime,
      }),
      status,
      updated_at: new Date().toISOString(),
    };
    updateError = await updateAppointmentWithRescheduleFallback({
      admin,
      appointmentId,
      legacyUpdate,
      update: {
        ...legacyUpdate,
        proposed_appointment_date: proposedAppointmentDate,
        proposed_appointment_time: proposedAppointmentTime,
        reschedule_note: shelterNote || null,
        reschedule_requested_by: "shelter",
      },
    });
  } else {
    const adoptedNote = shelterNote
      ? `Visitor adopted this dog after the visit. ${shelterNote}`
      : "Visitor adopted this dog after the visit.";
    const legacyUpdate = {
      shelter_note: decision === "adopted" ? adoptedNote : shelterNote || null,
      status,
      updated_at: new Date().toISOString(),
    };
    updateError = await updateAppointmentWithRescheduleFallback({
      admin,
      appointmentId,
      legacyUpdate,
      update: {
        ...legacyUpdate,
        proposed_appointment_date: null,
        proposed_appointment_time: null,
        reschedule_note: null,
        reschedule_requested_by: null,
      },
    });
  }

  if (!updateError) {
    await logAdminAuditEvent({
      action: "appointment.decide",
      context: adminContext,
      metadata: {
        decision,
        status,
      },
      shelterId: appointment.shelter_id,
      targetId: appointmentId,
      targetTable: "appointments",
    });

    if (decision === "accept" || decision === "deny") {
      await sendBookingNotificationForAppointment({
        admin,
        appointmentId,
        event: decision === "accept" ? "booking_confirmed" : "booking_denied",
      });
    }

    if (decision === "request_change") {
      await sendBookingNotificationForAppointment({
        admin,
        appointmentId,
        event: "date_change_requested",
        visitDate: proposedAppointmentDate,
        visitTime: proposedAppointmentTime,
      });
    }
  }

  if (decision === "adopted" && appointment?.dog_id) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: adoptedDog } = await admin
      .from("dogs")
      .select("name")
      .eq("id", appointment.dog_id)
      .maybeSingle();

    await admin
      .from("dogs")
      .update({
        adoption_status: "adopted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointment.dog_id);

    await admin
      .from("appointments")
      .update({
        shelter_note: "This dog has already been adopted.",
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("dog_id", appointment.dog_id)
      .neq("id", appointmentId)
      .gte("appointment_date", today)
      .in("status", ["requested", "confirmed"]);

    await linkDogCarePassportToAdopter({
      actorProfileId: adminContext.userId,
      adopterId: appointment.adopter_id,
      dogId: appointment.dog_id,
      shelterId: appointment.shelter_id,
      supabase: admin,
    });

    const systemMessage = `Adoption completed for ${adoptedDog?.name ?? "this dog"} on ${today}. This chat can now be used for post-adoption follow-up.`;
    const { data: existingSystemMessage } = await admin
      .from("appointment_messages")
      .select("id")
      .eq("appointment_id", appointmentId)
      .eq("sender_role", "system")
      .eq("body", systemMessage)
      .limit(1)
      .maybeSingle();

    if (!existingSystemMessage) {
      const { error: systemMessageError } = await admin.from("appointment_messages").insert({
        adopter_id: appointment.adopter_id,
        appointment_id: appointmentId,
        body: systemMessage,
        sender_label: "PawJai/system",
        sender_role: "system",
        shelter_id: appointment.shelter_id,
      });

      if (systemMessageError && !isAppointmentMessagesUnavailableError(systemMessageError)) {
        console.error("Could not create adoption system message", systemMessageError);
      }
    }
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/bookings/${appointmentId}`);
  revalidatePath(`/admin/bookings/${appointmentId}/visitor-profile`);
  revalidatePath(`/booking/${appointmentId}`);
  revalidatePath(`/booking/${appointmentId}/visitor-profile`);
  if (appointment.dog_id) {
    revalidatePath(`/dogs/${appointment.dog_id}`);
  }
  revalidatePath("/adopted");
  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/messages");
  await redirectAfterBookingDecision(
    formData,
    updateError ? "Booking decision could not be saved." : successMessageForDecision(decision),
    adminContext,
    appointmentId,
    appointment.shelter_id,
    decision,
  );
}

export async function sendShelterMessageAction(formData: FormData) {
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const shelterId = String(formData.get("shelterId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!appointmentId || !shelterId || !body) {
    return;
  }

  const adminContext = await requireShelterAccess(shelterId, "/admin/bookings");

  const admin = createAdminClient();
  const { data: appointment } = await admin
    .from("appointments")
    .select("id, adopter_id, shelter_id")
    .eq("id", appointmentId)
    .eq("shelter_id", shelterId)
    .maybeSingle();

  if (!appointment) {
    shelterViewRedirect(shelterId, "messages", "Booking conversation could not be found.");
    return;
  }

  const { data: shelter } = await admin
    .from("shelters")
    .select("name")
    .eq("id", shelterId)
    .maybeSingle();

  const { error } = await admin.from("appointment_messages").insert({
    adopter_id: appointment.adopter_id,
    appointment_id: appointment.id,
    body,
    sender_label: shelter?.name ?? "Shelter team",
    sender_role: "shelter",
    shelter_id: appointment.shelter_id,
  });

  if (!error) {
    await logAdminAuditEvent({
      action: "appointment.message.create",
      context: adminContext,
      metadata: {
        bodyLength: body.length,
      },
      shelterId,
      targetId: appointment.id,
      targetTable: "appointment_messages",
    });
  }

  revalidatePath("/admin");
  revalidatePath("/messages");
  revalidatePath(`/appointments/${appointment.id}`);
  shelterViewRedirect(
    shelterId,
    "messages",
    error
      ? isAppointmentMessagesUnavailableError(error)
        ? APPOINTMENT_MESSAGES_UNAVAILABLE_MESSAGE
        : "Message could not be sent. Please try again."
      : "Message sent.",
  );
}

export async function updateShelterProfileAction(formData: FormData) {
  const shelterId = String(formData.get("shelterId") ?? "");
  const name = cleanText(formData.get("name"));

  if (!shelterId || !name) {
    return;
  }

  const adminContext = await requireShelterAccess(shelterId, "/admin/bookings");

  const admin = createAdminClient();
  const basePayload = {
    address_line: cleanText(formData.get("addressLine")),
    district: cleanText(formData.get("district")),
    email: cleanText(formData.get("email")),
    facebook_url: cleanText(formData.get("facebookUrl")),
    instagram_url: cleanText(formData.get("instagramUrl")),
    name,
    phone_number: cleanText(formData.get("phoneNumber")),
    postal_code: cleanText(formData.get("postalCode")),
    province: cleanText(formData.get("province")),
    subdistrict: cleanText(formData.get("subdistrict")),
    updated_at: new Date().toISOString(),
    website_url: cleanText(formData.get("websiteUrl")),
  };

  const { error: baseError } = await admin
    .from("shelters")
    .update(basePayload)
    .eq("id", shelterId);

  if (baseError) {
    console.error("Shelter profile core update failed", {
      code: baseError.code,
      details: baseError.details,
      hint: baseError.hint,
      message: baseError.message,
      shelterId,
    });
    await redirectAfterShelterMutation(formData, adminContext, shelterId, "profile", describeShelterProfileSaveError(baseError));
  }

  let logoUrl = cleanText(formData.get("logoUrl"));
  let uploadWarning: string | null = null;
  const logoFile = formData.get("logoFile");
  if (logoFile instanceof File && logoFile.size > 0) {
    const upload = await uploadShelterLogo({ admin, file: logoFile, shelterId });
    logoUrl = upload.url ?? logoUrl;
    uploadWarning = upload.error;
  }

  const extendedPayload = {
    google_maps_url: cleanText(formData.get("googleMapsUrl")),
    logo_url: logoUrl,
    meeting_instructions: cleanText(formData.get("meetingInstructions")),
  };

  const { error: extendedError } = await admin
    .from("shelters")
    .update(extendedPayload)
    .eq("id", shelterId);
  if (extendedError && !isMissingSchemaError(extendedError)) {
    console.error("Shelter profile optional update failed", {
      code: extendedError.code,
      details: extendedError.details,
      hint: extendedError.hint,
      message: extendedError.message,
      shelterId,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/shelter");
  revalidatePath("/appointments");
  const message = isMissingSchemaError(extendedError)
      ? "Basic shelter profile saved. Logo, Maps URL, and meeting instructions need the Supabase migration before they can persist."
      : extendedError
        ? `Basic shelter profile saved, but ${describeShelterProfileSaveError(extendedError)}`
        : uploadWarning
          ? `Shelter profile saved, but ${uploadWarning}`
          : "Shelter profile saved.";
  await logAdminAuditEvent({
    action: "shelter.update",
    context: adminContext,
    metadata: {
      optionalProfileError: extendedError?.message ?? null,
      uploadedLogo: Boolean(logoFile instanceof File && logoFile.size > 0 && !uploadWarning),
    },
    shelterId,
    targetId: shelterId,
    targetTable: "shelters",
  });
  await redirectAfterShelterMutation(formData, adminContext, shelterId, "profile", message);
}

export async function updateShelterDonationDetailsAction(formData: FormData) {
  const shelterId = String(formData.get("shelterId") ?? "").trim();

  if (!shelterId) return;

  const adminContext = await requireShelterAccess(shelterId, "/admin/bookings");
  let donationDetails: ReturnType<typeof parseShelterDonationDetails>;

  try {
    donationDetails = parseShelterDonationDetails({
      bankAccountName: formData.get("bankAccountName"),
      bankAccountNumber: formData.get("bankAccountNumber"),
      bankName: formData.get("bankName"),
      otherBankName: formData.get("otherBankName"),
      promptpayId: formData.get("promptpayId"),
    });
  } catch (error) {
    return redirectAfterShelterMutation(
      formData,
      adminContext,
      shelterId,
      "donations",
      error instanceof Error ? error.message : "Donation details could not be saved.",
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("shelters")
    .update({
      ...donationDetails,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shelterId);

  if (!error) {
    await logAdminAuditEvent({
      action: "shelter.donation_details.update",
      context: adminContext,
      metadata: {
        bankConfigured: Boolean(donationDetails.bank_account_number),
        promptpayConfigured: Boolean(donationDetails.promptpay_id),
      },
      shelterId,
      targetId: shelterId,
      targetTable: "shelters",
    });
  }

  revalidatePath("/admin");
  revalidatePath("/shelter");
  revalidatePath("/donations");
  await redirectAfterShelterMutation(
    formData,
    adminContext,
    shelterId,
    "donations",
    error
      ? `Donation payment details could not be saved: ${error.message}`
      : "Donation payment details saved.",
  );
}

export async function updateShelterOperatingDaysAction(formData: FormData) {
  const shelterId = String(formData.get("shelterId") ?? "");
  const opensAt = String(formData.get("opensAt") || "10:00");
  const closesAt = String(formData.get("closesAt") || "17:00");
  const slotDuration = Number(formData.get("slotDuration") || 60);
  const closedDays = new Set(
    formData
      .getAll("closedDays")
      .map((day) => Number(day))
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
  );

  if (!shelterId) return;

  const adminContext = await requireShelterAccess(shelterId, "/admin/bookings");

  if (
    !/^\d{2}:\d{2}$/.test(opensAt)
    || !/^\d{2}:\d{2}$/.test(closesAt)
    || opensAt >= closesAt
    || !Number.isFinite(slotDuration)
    || slotDuration < 15
    || slotDuration > 240
    || slotDuration % 15 !== 0
  ) {
    await redirectAfterShelterMutation(
      formData,
      adminContext,
      shelterId,
      "bookings",
      "Choose valid opening and closing times. Opening must be before closing, and the slot length must be 15-240 minutes in 15-minute steps.",
    );
  }

  const rows = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const isClosed = closedDays.has(dayOfWeek);
    return {
      closes_at: isClosed ? null : closesAt,
      day_of_week: dayOfWeek,
      is_closed: isClosed,
      opens_at: isClosed ? null : opensAt,
      shelter_id: shelterId,
      slot_duration_minutes: slotDuration,
      updated_at: new Date().toISOString(),
    };
  });

  const admin = createAdminClient();
  const { error } = await admin
    .from("shelter_regular_hours")
    .upsert(rows, { onConflict: "shelter_id,day_of_week" });
  const fallbackError = isMissingSchemaError(error)
    ? await saveWeeklyClosuresAsBlockouts({ admin, closedDays, shelterId })
    : null;

  revalidatePath("/admin");
  revalidatePath("/appointments");
  if (!error && !fallbackError) {
    await logAdminAuditEvent({
      action: "shelter.hours.update",
      context: adminContext,
      metadata: {
        closedDays: Array.from(closedDays),
        slotDuration,
      },
      shelterId,
      targetId: shelterId,
      targetTable: "shelter_regular_hours",
    });
  }
  await redirectAfterShelterMutation(
    formData,
    adminContext,
    shelterId,
    "bookings",
    isMissingSchemaError(error)
      ? fallbackError
        ? `Weekly operating days could not be saved: ${fallbackError.message}`
        : "Weekly operating days saved as blockout dates. Apply the Supabase migration later for full operating-hour support."
      : error
        ? `Operating days could not be saved: ${error.message}`
        : "Operating days saved.",
  );
}

export async function createShelterBlockoutAction(formData: FormData) {
  const shelterId = String(formData.get("shelterId") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const requestedEndDate = String(formData.get("endDate") ?? "").trim();
  const endDate = requestedEndDate || startDate;
  const note = cleanText(formData.get("note"));

  if (!shelterId) {
    return;
  }

  const adminContext = await requireShelterAccess(shelterId, "/admin/bookings");

  if (!isIsoDate(startDate)) {
    await redirectAfterShelterMutation(formData, adminContext, shelterId, "bookings", "Choose a valid start date for the blockout.");
  }

  if (!isIsoDate(endDate)) {
    await redirectAfterShelterMutation(formData, adminContext, shelterId, "bookings", "Choose a valid end date for the blockout.");
  }

  if (endDate < startDate) {
    await redirectAfterShelterMutation(formData, adminContext, shelterId, "bookings", "The blockout end date must be on or after the start date.");
  }

  if (!note) {
    await redirectAfterShelterMutation(formData, adminContext, shelterId, "bookings", "Add a reason for this blockout date.");
  }

  const admin = createAdminClient() as any;
  const { data: existingRanges, error: existingRangeError } = await admin
    .from("shelter_availability")
    .select("id")
    .eq("shelter_id", shelterId)
    .eq("availability_type", "unavailable")
    .lte("start_date", endDate)
    .gte("end_date", startDate)
    .limit(1);

  if (existingRangeError) {
    await redirectAfterShelterMutation(
      formData,
      adminContext,
      shelterId,
      "bookings",
      `Existing blockout dates could not be checked: ${existingRangeError.message}`,
    );
  }

  if (existingRanges?.length) {
    await redirectAfterShelterMutation(formData, adminContext, shelterId, "bookings", "That blockout date range overlaps an existing closure.");
  }

  const { error } = await admin
    .from("shelter_availability")
    .insert({
      availability_type: "unavailable",
      end_date: endDate,
      note,
      shelter_id: shelterId,
      start_date: startDate,
    })
    .select("id")
    .single();

  revalidatePath("/admin");
  revalidatePath("/appointments");
  if (!error) {
    await logAdminAuditEvent({
      action: "shelter.blockout.create",
      context: adminContext,
      metadata: {
        endDate,
        startDate,
      },
      shelterId,
      targetTable: "shelter_availability",
    });
  }
  await redirectAfterShelterMutation(
    formData,
    adminContext,
    shelterId,
    "bookings",
    error ? `Blockout date could not be added: ${error.message}` : "Blockout date added.",
  );
}

export async function toggleShelterBlockoutDateAction(formData: FormData) {
  const shelterId = String(formData.get("shelterId") ?? "");
  const date = String(formData.get("date") ?? "");
  const existingAvailabilityId = String(formData.get("availabilityId") ?? "");

  if (!shelterId || !date) {
    return;
  }

  const adminContext = await requireShelterAccess(shelterId, "/admin/bookings");

  const admin = createAdminClient() as any;
  let error: { message?: string } | null = null;
  if (existingAvailabilityId) {
    const result = await admin
      .from("shelter_availability")
      .delete()
      .eq("shelter_id", shelterId)
      .eq("availability_type", "unavailable")
      .lte("start_date", date)
      .gte("end_date", date);
    error = result.error;
  } else {
    const existingResult = await admin
      .from("shelter_availability")
      .select("id")
      .eq("shelter_id", shelterId)
      .eq("availability_type", "unavailable")
      .lte("start_date", date)
      .gte("end_date", date)
      .limit(1);

    if (existingResult.error) {
      error = existingResult.error;
    } else if (!existingResult.data?.length) {
      const insertResult = await admin
        .from("shelter_availability")
        .insert({
          availability_type: "unavailable",
          end_date: date,
          note: "Closed from admin calendar",
          shelter_id: shelterId,
          start_date: date,
        });
      error = insertResult.error;
    }
  }

  revalidatePath("/admin");
  revalidatePath("/appointments");
  if (!error) {
    await logAdminAuditEvent({
      action: existingAvailabilityId ? "shelter.blockout.delete" : "shelter.blockout.create",
      context: adminContext,
      metadata: {
        date,
      },
      shelterId,
      targetId: existingAvailabilityId || null,
      targetTable: "shelter_availability",
    });
  }
  await redirectAfterShelterMutation(formData, adminContext, shelterId, "bookings", error ? `Calendar date could not be updated: ${error.message}` : "Calendar date updated.");
}

export async function deleteShelterAvailabilityAction(formData: FormData) {
  const shelterId = String(formData.get("shelterId") ?? "");
  const availabilityId = String(formData.get("availabilityId") ?? "");

  if (!shelterId || !availabilityId) {
    return;
  }

  const adminContext = await requireShelterAccess(shelterId, "/admin/bookings");

  const admin = createAdminClient() as any;
  const { error } = await admin
    .from("shelter_availability")
    .delete()
    .eq("id", availabilityId)
    .eq("shelter_id", shelterId);

  revalidatePath("/admin");
  revalidatePath("/appointments");
  if (!error) {
    await logAdminAuditEvent({
      action: "shelter.blockout.delete",
      context: adminContext,
      shelterId,
      targetId: availabilityId,
      targetTable: "shelter_availability",
    });
  }
  await redirectAfterShelterMutation(formData, adminContext, shelterId, "bookings", error ? `Blockout date could not be removed: ${error.message}` : "Blockout date removed.");
}

export async function reviewDonationAction(formData: FormData) {
  const donationId = String(formData.get("donationId") ?? "").trim();
  const shelterId = String(formData.get("shelterId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const shelterNote = cleanText(formData.get("shelterNote"));

  if (!donationId || !shelterId || (decision !== "verify" && decision !== "reject")) {
    return;
  }

  const adminContext = await requireShelterAccess(shelterId, "/admin/bookings");
  const admin = createAdminClient();
  const { data: donation, error: loadError } = await admin
    .from("donation_intents")
    .select("id,amount_thb,dog_id,proof_storage_path,shelter_id")
    .eq("id", donationId)
    .eq("shelter_id", shelterId)
    .maybeSingle();

  if (loadError || !donation) {
    return redirectAfterShelterMutation(formData, adminContext, shelterId, "donations", "Donation could not be found for this shelter.");
  }

  if (!donation.proof_storage_path) {
    return redirectAfterShelterMutation(formData, adminContext, shelterId, "donations", "A transfer slip is required before this donation can be reviewed.");
  }

  const reviewedAt = new Date().toISOString();
  const status = decision === "verify" ? "verified" : "rejected";
  const { error } = await admin
    .from("donation_intents")
    .update({
      reviewed_at: reviewedAt,
      reviewed_by: adminContext.userId,
      shelter_note: shelterNote,
      status,
    })
    .eq("id", donation.id)
    .eq("shelter_id", shelterId);

  revalidatePath("/admin");
  revalidatePath("/shelter/[slug]", "page");
  revalidatePath(`/dogs/${donation.dog_id}/donate`);

  if (!error) {
    await logAdminAuditEvent({
      action: decision === "verify" ? "donation.verify" : "donation.reject",
      context: adminContext,
      metadata: {
        amountThb: donation.amount_thb,
        hasShelterNote: Boolean(shelterNote),
      },
      shelterId,
      targetId: donation.id,
      targetTable: "donation_intents",
    });
  }

  await redirectAfterShelterMutation(
    formData,
    adminContext,
    shelterId,
    "donations",
    error
      ? `Donation could not be updated: ${error.message}`
      : decision === "verify" ? "Donation verified." : "Donation marked for follow-up.",
  );
}

export async function checkInBookingAction(formData: FormData) {
  await requireAdminWorkspace("/admin/bookings/check-in");

  const token = String(formData.get("token") ?? "");
  const note = String(formData.get("checkInNote") ?? "").trim();

  if (!token) {
    return;
  }

  const admin = createAdminClient();
  const { data: hashedAppointment } = await admin
    .from("appointments")
    .select("id, shelter_id, status")
    .eq("check_in_token_hash", hashCheckInToken(token))
    .maybeSingle();
  const appointmentIdFromToken = verifySignedCheckInToken({
    token,
    secret: getCheckInTokenSecret(),
  });
  const { data: signedAppointment } = !hashedAppointment && appointmentIdFromToken
    ? await admin
        .from("appointments")
        .select("id, shelter_id, status")
        .eq("id", appointmentIdFromToken)
        .maybeSingle()
    : { data: null };
  const appointment = hashedAppointment ?? signedAppointment;

  if (!appointment) {
    redirect("/admin/bookings/check-in?invalid=1");
  }

  const adminContext = await requireShelterAccess(appointment.shelter_id, "/admin/bookings/check-in");

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

  revalidatePath("/admin");
  revalidatePath(`/admin/bookings/${appointment.id}`);
  revalidatePath(`/admin/bookings/${appointment.id}/visitor-profile`);
  revalidatePath(`/booking/${appointment.id}`);
  revalidatePath(`/booking/${appointment.id}/visitor-profile`);
  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointment.id}`);
  await logAdminAuditEvent({
    action: "appointment.check_in",
    context: adminContext,
    metadata: {
      noteLength: note.length,
    },
    shelterId: appointment.shelter_id,
    targetId: appointment.id,
    targetTable: "appointments",
  });
  await redirectAfterCheckIn(formData, appointment.id, token, adminContext, appointment.shelter_id);
}
