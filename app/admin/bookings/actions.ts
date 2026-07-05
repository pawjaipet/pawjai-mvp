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
import { buildAdminBookingDetailPath, getCheckInTokenSecret, hashCheckInToken, verifySignedCheckInToken } from "@/utils/booking";
import { parseShelterDonationDetails } from "@/utils/donations";
import { requireAdminWorkspace, requireShelterAccess } from "@/utils/admin-auth";
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
  const params = new URLSearchParams();
  if (shelterId) params.set("shelter", shelterId);
  if (message) params.set("message", message);
  redirect(`/admin/bookings?${params.toString()}`);
}

function shelterViewRedirect(shelterId: string, view: string, message: string) {
  const params = new URLSearchParams();
  if (shelterId) params.set("shelter", shelterId);
  if (view) params.set("view", view);
  if (message) params.set("message", message);
  redirect(`/admin/bookings?${params.toString()}`);
}

function redirectAfterShelterMutation(formData: FormData, shelterId: string, view: string, message: string) {
  const returnTo = String(formData.get("returnTo") ?? "");

  if (returnTo === "/admindraft") {
    const params = new URLSearchParams();
    if (shelterId) params.set("shelter", shelterId);
    if (view) params.set("view", view);
    if (message) params.set("message", message);
    redirect(`/admindraft?${params.toString()}`);
  }

  shelterViewRedirect(shelterId, view, message);
}

function isMissingSchemaError(error: { message?: string } | null | undefined) {
  const message = error?.message ?? "";
  return message.includes("Could not find")
    || message.includes("schema cache")
    || message.includes("does not exist");
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
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
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
    .select("id, dog_id, shelter_id")
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
    const legacyUpdate = {
      shelter_note: shelterNote || (decision === "adopted" ? "Visitor adopted this dog after the visit." : null),
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
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
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

  revalidatePath("/admin/bookings");
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
  let logoUrl = cleanText(formData.get("logoUrl"));
  let uploadWarning: string | null = null;
  const logoFile = formData.get("logoFile");
  if (logoFile instanceof File && logoFile.size > 0) {
    const upload = await uploadShelterLogo({ admin, file: logoFile, shelterId });
    logoUrl = upload.url ?? logoUrl;
    uploadWarning = upload.error;
  }

  const basePayload = {
    address_line: cleanText(formData.get("addressLine")),
    description: cleanText(formData.get("description")),
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
    redirectAfterShelterMutation(formData, shelterId, "profile", error instanceof Error ? error.message : "Donation details could not be saved.");
    return;
  }

  const extendedPayload = {
    ...donationDetails,
    google_maps_url: cleanText(formData.get("googleMapsUrl")),
    logo_url: logoUrl,
    meeting_instructions: cleanText(formData.get("meetingInstructions")),
  };

  const { error } = await admin
    .from("shelters")
    .update({
      ...basePayload,
      ...extendedPayload,
    })
    .eq("id", shelterId);
  const finalError = isMissingSchemaError(error)
    ? (
        await admin
          .from("shelters")
          .update(basePayload)
          .eq("id", shelterId)
      ).error
    : error;

  revalidatePath("/admin/bookings");
  revalidatePath("/admindraft");
  revalidatePath("/appointments");
  const message = finalError
    ? "Shelter profile could not be saved."
    : isMissingSchemaError(error)
      ? "Basic shelter profile saved. Logo, Maps URL, and meeting instructions need the Supabase migration before they can persist."
      : uploadWarning
        ? `Shelter profile saved, but ${uploadWarning}`
        : "Shelter profile saved.";
  if (!finalError) {
    await logAdminAuditEvent({
      action: "shelter.update",
      context: adminContext,
      metadata: {
        changedDonationDetails: Boolean(donationDetails.bank_account_number || donationDetails.promptpay_id),
        uploadedLogo: Boolean(logoFile instanceof File && logoFile.size > 0 && !uploadWarning),
      },
      shelterId,
      targetId: shelterId,
      targetTable: "shelters",
    });
  }
  redirectAfterShelterMutation(formData, shelterId, "profile", message);
}

export async function updateShelterOperatingDaysAction(formData: FormData) {
  const shelterId = String(formData.get("shelterId") ?? "");
  const opensAt = String(formData.get("opensAt") || "09:00");
  const closesAt = String(formData.get("closesAt") || "17:00");
  const slotDuration = Number(formData.get("slotDuration") || 60);
  const closedDays = new Set(
    formData
      .getAll("closedDays")
      .map((day) => Number(day))
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
  );

  if (!shelterId || !Number.isFinite(slotDuration) || slotDuration < 1) {
    return;
  }

  const adminContext = await requireShelterAccess(shelterId, "/admin/bookings");

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

  revalidatePath("/admin/bookings");
  revalidatePath("/admindraft");
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
  redirectAfterShelterMutation(
    formData,
    shelterId,
    "profile",
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
  const shelterId = String(formData.get("shelterId") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") || startDate);
  const note = cleanText(formData.get("note"));

  if (!shelterId || !startDate || !endDate || endDate < startDate) {
    return;
  }

  const adminContext = await requireShelterAccess(shelterId, "/admin/bookings");

  const admin = createAdminClient() as any;
  const { error } = await admin
    .from("shelter_availability")
    .insert({
      availability_type: "unavailable",
      end_date: endDate,
      note,
      shelter_id: shelterId,
      start_date: startDate,
    });

  revalidatePath("/admin/bookings");
  revalidatePath("/admindraft");
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
  redirectAfterShelterMutation(formData, shelterId, "profile", error ? "Blockout date could not be added." : "Blockout date added.");
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
  const { error } = existingAvailabilityId
    ? await admin
        .from("shelter_availability")
        .delete()
        .eq("id", existingAvailabilityId)
        .eq("shelter_id", shelterId)
    : await admin
        .from("shelter_availability")
        .insert({
          availability_type: "unavailable",
          end_date: date,
          note: "Closed from admin calendar",
          shelter_id: shelterId,
          start_date: date,
        });

  revalidatePath("/admin/bookings");
  revalidatePath("/admindraft");
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
  redirectAfterShelterMutation(formData, shelterId, "profile", error ? "Calendar date could not be updated." : "Calendar date updated.");
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

  revalidatePath("/admin/bookings");
  revalidatePath("/admindraft");
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
  redirectAfterShelterMutation(formData, shelterId, "profile", error ? "Blockout date could not be removed." : "Blockout date removed.");
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

  revalidatePath("/admin/bookings");
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
  redirect(`${buildAdminBookingDetailPath({ appointmentId: appointment.id, token })}&checkedIn=1`);
}
