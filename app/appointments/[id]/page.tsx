import { redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import AppointmentDetailClient from "@/components/appointments/AppointmentDetailClient";
import { ensureAdopterForUser } from "@/utils/adopter";
import { signAppointmentMessageAttachments } from "@/utils/appointment-message-attachments";
import type { AppointmentMessageRow } from "@/utils/appointment-messages";
import { isAppointmentMessagesUnavailableError } from "@/utils/appointment-messages";
import { parseLegacyRescheduleNote } from "@/utils/appointments-model";
import {
  buildCheckInUrl,
  createSignedCheckInToken,
  formatBookingCode,
  getCheckInTokenSecret,
  hashCheckInToken,
} from "@/utils/booking";
import { normalizeDogMediaUrl } from "@/utils/dog-media";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export default async function AppointmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <ProtectedRouteGate
        nextPath={`/appointments/${id}`}
        reason="Sign in to view your appointment details."
      />
    );
  }

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();

  const { data: appt } = await admin
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("adopter_id", adopter.id)
    .maybeSingle();

  if (!appt) {
    redirect("/appointments");
  }

  const [{ data: dog }, { data: shelterBase }] = await Promise.all([
    appt.dog_id
      ? admin
          .from("dogs")
          .select("id, name, breed, adoption_status")
          .eq("id", appt.dog_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("shelters")
      .select("id, name, phone_number, email, address_line, district, subdistrict, province, postal_code")
      .eq("id", appt.shelter_id)
      .maybeSingle(),
  ]);
  const [{ data: shelterExtended }, { data: shelterLocale }, { data: dogLocalizedTraits }] = await Promise.all([
    (admin as any)
      .from("shelters")
      .select("id, logo_url, google_maps_url, meeting_instructions")
      .eq("id", appt.shelter_id)
      .maybeSingle(),
    (admin as any)
      .from("shelters")
      .select("id, name_th, address_line_th, subdistrict_th, district_th, province_th, meeting_instructions_th")
      .eq("id", appt.shelter_id)
      .maybeSingle()
      .then((result: { data: unknown; error: unknown }) => (result.error ? { data: null } : result)),
    appt.dog_id
      ? admin
          .from("dog_traits")
          .select("trait_type, trait_value")
          .eq("dog_id", appt.dog_id)
          .eq("trait_type", "localized_name_th")
      : Promise.resolve({ data: [] }),
  ]);
  const shelter = shelterBase
    ? {
        ...shelterBase,
        ...(shelterExtended ?? {}),
        ...(shelterLocale ?? {}),
      }
    : null;
  const { data: messageRows, error: messageRowsError } = await admin
    .from("appointment_messages")
    .select("*")
    .eq("appointment_id", appt.id)
    .order("created_at", { ascending: true });
  const messagesUnavailable = Boolean(messageRowsError);
  if (messageRowsError && !isAppointmentMessagesUnavailableError(messageRowsError)) {
    console.error("Appointment messages failed to load", messageRowsError);
  }

  let coverUrl: string | null = null;
  if (appt.dog_id) {
    const { data: photo } = await admin
      .from("dog_photos")
      .select("public_url, storage_path")
      .eq("dog_id", appt.dog_id)
      .eq("is_cover", true)
      .maybeSingle();
    coverUrl = normalizeDogMediaUrl(photo?.public_url, photo?.storage_path);
  }

  // Build display strings server-side (TZ-safe)
  const dateObj = new Date(appt.appointment_date);
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
  const monthDay = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const startTime = appt.appointment_time
    ? new Date(`1970-01-01T${appt.appointment_time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";

  // Assume 1-hour visit window for end time
  const endTime = appt.appointment_time
    ? new Date(new Date(`1970-01-01T${appt.appointment_time}`).getTime() + 60 * 60 * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";

  const bookingId = appt.booking_code ?? formatBookingCode(appt.id);
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const checkInToken = createSignedCheckInToken({
    appointmentId: appt.id,
    secret: getCheckInTokenSecret(),
  });
  if (!appt.check_in_token_hash) {
    await admin
      .from("appointments")
      .update({ check_in_token_hash: hashCheckInToken(checkInToken) })
      .eq("id", appt.id);
  }
  const qrSvg = await QRCode.toString(
    buildCheckInUrl({ origin, token: checkInToken }),
    {
      color: {
        dark: "#65584f",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
      margin: 1,
      type: "svg",
      width: 184,
    },
  );

  const addressLines = shelter
    ? [
        shelter.address_line,
        [shelter.subdistrict, shelter.district].filter(Boolean).join(", "),
        [shelter.province, shelter.postal_code].filter(Boolean).join(" "),
      ].filter(Boolean) as string[]
    : [];
  // TODO(codex): Replace these fallbacks with first-class Thai address columns once the shelter profile schema exposes them everywhere.
  const addressLinesTh = shelter
    ? [
        (shelter as unknown as { address_line_th?: string | null }).address_line_th,
        [
          (shelter as unknown as { subdistrict_th?: string | null }).subdistrict_th,
          (shelter as unknown as { district_th?: string | null }).district_th,
        ].filter(Boolean).join(", "),
        [
          (shelter as unknown as { province_th?: string | null }).province_th,
          shelter.postal_code,
        ].filter(Boolean).join(" "),
      ].filter(Boolean) as string[]
    : [];
  const dogNameTh = (dogLocalizedTraits ?? []).find((trait) => trait.trait_value?.trim())?.trait_value?.trim() ?? null;

  // Compute whether slot has passed (start time + 1hr <= now)
  const slotStart = new Date(`${appt.appointment_date}T${appt.appointment_time}`);
  const isPast = slotStart.getTime() + 60 * 60 * 1000 <= Date.now();
  const legacyReschedule = parseLegacyRescheduleNote(appt.shelter_note);
  const signedMessageRows = await signAppointmentMessageAttachments(
    admin,
    (messageRows ?? []) as AppointmentMessageRow[],
  );
  const initialMessages = (signedMessageRows as Pick<
    AppointmentMessageRow,
    "attachment_name" | "attachment_type" | "attachment_url" | "body" | "created_at" | "id" | "sender_label" | "sender_role"
  >[]).map((message) => ({
    attachmentName: message.attachment_name,
    attachmentType: message.attachment_type,
    attachmentUrl: message.attachment_url,
    body: message.body,
    createdAt: message.created_at,
    id: message.id,
    senderLabel: message.sender_label,
    senderRole: message.sender_role,
  }));

  return (
    <AppointmentDetailClient
      appointmentId={appt.id}
      bookingId={bookingId}
      initialMessages={initialMessages}
      messagesUnavailable={messagesUnavailable}
      initialTab={resolvedSearchParams?.tab === "messages" ? "messages" : "details"}
      qrSvg={qrSvg}
      status={appt.status}
      proposedDate={(appt as any).proposed_appointment_date ?? legacyReschedule?.proposedDate ?? null}
      proposedTime={(appt as any).proposed_appointment_time ?? legacyReschedule?.proposedTime ?? null}
      rescheduleNote={(appt as any).reschedule_note ?? legacyReschedule?.note ?? null}
      isPast={isPast}
      adoptionContext={dog ? {
        adoptionDate: appt.status === "completed" ? appt.appointment_date : null,
        isAdopted: dog.adoption_status === "adopted" && appt.status === "completed",
      } : null}
      dog={dog ? { id: dog.id, name: dog.name, nameTh: dogNameTh, breed: dog.breed, coverUrl } : null}
      shelter={
        shelter
          ? {
              name: shelter.name,
              nameTh: (shelter as unknown as { name_th?: string | null }).name_th ?? null,
              phone: shelter.phone_number,
              email: shelter.email,
              addressLines,
              addressLinesTh,
              googleMapsUrl: shelter.google_maps_url,
              latitude: (shelter as unknown as { latitude?: number | null }).latitude ?? null,
              logoUrl: shelter.logo_url,
              longitude: (shelter as unknown as { longitude?: number | null }).longitude ?? null,
              meetingInstructions: shelter.meeting_instructions,
              meetingInstructionsTh: (shelter as unknown as { meeting_instructions_th?: string | null }).meeting_instructions_th ?? null,
            }
          : null
      }
      time={{ weekday, monthDay, start: startTime, end: endTime }}
      shelterNote={appt.shelter_note}
      visitorNote={appt.visitor_note}
    />
  );
}
