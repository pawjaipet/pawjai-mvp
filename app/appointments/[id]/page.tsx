import { redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import AppointmentDetailClient from "@/components/appointments/AppointmentDetailClient";
import { ensureAdopterForUser } from "@/utils/adopter";
import {
  buildCheckInUrl,
  createSignedCheckInToken,
  formatBookingCode,
  getCheckInTokenSecret,
  hashCheckInToken,
} from "@/utils/booking";
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
          .select("id, name, breed")
          .eq("id", appt.dog_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("shelters")
      .select("id, name, phone_number, email, address_line, district, subdistrict, province, postal_code")
      .eq("id", appt.shelter_id)
      .maybeSingle(),
  ]);
  const { data: shelterExtended } = await (admin as any)
    .from("shelters")
    .select("id, logo_url, google_maps_url, meeting_instructions")
    .eq("id", appt.shelter_id)
    .maybeSingle();
  const shelter = shelterBase
    ? {
        ...shelterBase,
        ...(shelterExtended ?? {}),
      }
    : null;
  const { data: messageRows } = await (admin as any)
    .from("appointment_messages")
    .select("id, sender_role, sender_label, body, created_at")
    .eq("appointment_id", appt.id)
    .order("created_at", { ascending: true });

  let coverUrl: string | null = null;
  if (appt.dog_id) {
    const { data: photo } = await admin
      .from("dog_photos")
      .select("public_url")
      .eq("dog_id", appt.dog_id)
      .eq("is_cover", true)
      .maybeSingle();
    coverUrl = photo?.public_url ?? null;
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

  // Compute whether slot has passed (start time + 1hr <= now)
  const slotStart = new Date(`${appt.appointment_date}T${appt.appointment_time}`);
  const isPast = slotStart.getTime() + 60 * 60 * 1000 <= Date.now();

  return (
    <AppointmentDetailClient
      appointmentId={appt.id}
      bookingId={bookingId}
      initialMessages={((messageRows ?? []) as {
        body: string;
        created_at: string;
        id: string;
        sender_label: string | null;
        sender_role: "adopter" | "shelter" | "system";
      }[]).map((message) => ({
        body: message.body,
        createdAt: message.created_at,
        id: message.id,
        senderLabel: message.sender_label,
        senderRole: message.sender_role,
      }))}
      initialTab={resolvedSearchParams?.tab === "messages" ? "messages" : "details"}
      qrSvg={qrSvg}
      status={appt.status}
      proposedDate={(appt as any).proposed_appointment_date ?? null}
      proposedTime={(appt as any).proposed_appointment_time ?? null}
      rescheduleNote={(appt as any).reschedule_note ?? null}
      isPast={isPast}
      dog={dog ? { id: dog.id, name: dog.name, breed: dog.breed, coverUrl } : null}
      shelter={
        shelter
          ? {
              name: shelter.name,
              // TODO(codex): wire when name_th column exists
              nameTh: (shelter as unknown as { name_th?: string | null }).name_th ?? null,
              phone: shelter.phone_number,
              email: shelter.email,
              addressLines,
              googleMapsUrl: shelter.google_maps_url,
              latitude: (shelter as unknown as { latitude?: number | null }).latitude ?? null,
              logoUrl: shelter.logo_url,
              longitude: (shelter as unknown as { longitude?: number | null }).longitude ?? null,
              meetingInstructions: shelter.meeting_instructions,
            }
          : null
      }
      time={{ weekday, monthDay, start: startTime, end: endTime }}
      shelterNote={appt.shelter_note}
      visitorNote={appt.visitor_note}
    />
  );
}
