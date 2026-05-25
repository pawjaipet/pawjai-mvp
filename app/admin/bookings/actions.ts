"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import type { Database } from "@/types/database";
import { buildAdminBookingDetailPath, getCheckInTokenSecret, hashCheckInToken, verifySignedCheckInToken } from "@/utils/booking";
import { isAdminGateOpen } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

type BookingDecision = "accept" | "deny" | "request_change";
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

export async function sendShelterMessageAction(formData: FormData) {
  if (!(await isAdminGateOpen())) {
    return;
  }

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const shelterId = String(formData.get("shelterId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!appointmentId || !shelterId || !body) {
    return;
  }

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

  const { error } = await (admin as any).from("appointment_messages").insert({
    adopter_id: appointment.adopter_id,
    appointment_id: appointment.id,
    body,
    sender_label: shelter?.name ?? "Shelter team",
    sender_role: "shelter",
    shelter_id: appointment.shelter_id,
  });

  revalidatePath("/admin/bookings");
  revalidatePath("/messages");
  revalidatePath(`/appointments/${appointment.id}`);
  shelterViewRedirect(
    shelterId,
    "messages",
    error ? "Message could not be sent. Apply the appointment messages migration first." : "Message sent.",
  );
}

export async function updateShelterProfileAction(formData: FormData) {
  if (!(await isAdminGateOpen())) {
    return;
  }

  const shelterId = String(formData.get("shelterId") ?? "");
  const name = cleanText(formData.get("name"));

  if (!shelterId || !name) {
    return;
  }

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
  const extendedPayload = {
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
  revalidatePath("/appointments");
  const message = finalError
    ? "Shelter profile could not be saved."
    : isMissingSchemaError(error)
      ? "Basic shelter profile saved. Logo, Maps URL, and meeting instructions need the Supabase migration before they can persist."
      : uploadWarning
        ? `Shelter profile saved, but ${uploadWarning}`
        : "Shelter profile saved.";
  bookingsRedirect(shelterId, message);
}

export async function updateShelterOperatingDaysAction(formData: FormData) {
  if (!(await isAdminGateOpen())) {
    return;
  }

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
  revalidatePath("/appointments");
  bookingsRedirect(
    shelterId,
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
  if (!(await isAdminGateOpen())) {
    return;
  }

  const shelterId = String(formData.get("shelterId") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") || startDate);
  const note = cleanText(formData.get("note"));

  if (!shelterId || !startDate || !endDate || endDate < startDate) {
    return;
  }

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
  revalidatePath("/appointments");
  bookingsRedirect(shelterId, error ? "Blockout date could not be added." : "Blockout date added.");
}

export async function toggleShelterBlockoutDateAction(formData: FormData) {
  if (!(await isAdminGateOpen())) {
    return;
  }

  const shelterId = String(formData.get("shelterId") ?? "");
  const date = String(formData.get("date") ?? "");
  const existingAvailabilityId = String(formData.get("availabilityId") ?? "");

  if (!shelterId || !date) {
    return;
  }

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
  revalidatePath("/appointments");
  bookingsRedirect(shelterId, error ? "Calendar date could not be updated." : "Calendar date updated.");
}

export async function deleteShelterAvailabilityAction(formData: FormData) {
  if (!(await isAdminGateOpen())) {
    return;
  }

  const shelterId = String(formData.get("shelterId") ?? "");
  const availabilityId = String(formData.get("availabilityId") ?? "");

  if (!shelterId || !availabilityId) {
    return;
  }

  const admin = createAdminClient() as any;
  const { error } = await admin
    .from("shelter_availability")
    .delete()
    .eq("id", availabilityId)
    .eq("shelter_id", shelterId);

  revalidatePath("/admin/bookings");
  revalidatePath("/appointments");
  bookingsRedirect(shelterId, error ? "Blockout date could not be removed." : "Blockout date removed.");
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
