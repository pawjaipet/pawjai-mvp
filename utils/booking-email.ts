import { getResendClient } from "@/lib/resend";

type BookingEmailStatus = "requested" | "confirmed" | "cancelled";

type BookingEmailDetails = {
  appointment: {
    bookingCode: string;
    status: BookingEmailStatus;
  };
  dogName?: string | null;
  recipientEmail?: string | null;
  shelter: {
    addressLine?: string | null;
    district?: string | null;
    email?: string | null;
    name?: string | null;
    phoneNumber?: string | null;
    postalCode?: string | null;
    province?: string | null;
    subdistrict?: string | null;
  };
};

type BookingNotificationRecipientInput = {
  overrideEmail?: string | null;
  recipientEmail?: string | null;
};

const FALLBACK_NOTIFICATION_TO = "pawjaipet@gmail.com";
const DEFAULT_FROM = "PawJai <onboarding@resend.dev>";

function compactJoin(parts: Array<string | null | undefined>) {
  return parts.map((part) => String(part ?? "").trim()).filter(Boolean).join(", ");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statusCopy(status: BookingEmailStatus) {
  switch (status) {
    case "confirmed":
      return { label: "Accepted", subjectAction: "was accepted" };
    case "cancelled":
      return { label: "Denied", subjectAction: "was denied" };
    case "requested":
      return { label: "Pending", subjectAction: "is pending" };
  }
}

export function getBookingNotificationRecipient({
  overrideEmail,
  recipientEmail,
}: BookingNotificationRecipientInput) {
  return String(overrideEmail || recipientEmail || FALLBACK_NOTIFICATION_TO).trim();
}

export function buildBookingNotificationEmail(details: BookingEmailDetails) {
  const status = statusCopy(details.appointment.status);
  const shelterContact = compactJoin([
    details.shelter.name,
    details.shelter.email,
    details.shelter.phoneNumber,
  ]) || "Not provided";
  const shelterLocation = compactJoin([
    details.shelter.addressLine,
    details.shelter.subdistrict,
    details.shelter.district,
    details.shelter.province,
    details.shelter.postalCode,
  ]) || "Not provided";
  const lines = [
    `Booking number: ${details.appointment.bookingCode}`,
    `Status: ${status.label}`,
    `Shelter contact: ${shelterContact}`,
    `Shelter location: ${shelterLocation}`,
  ];
  const text = lines.join("\n");
  const html = `
    <div>
      <p>Booking number: <strong>${escapeHtml(details.appointment.bookingCode)}</strong></p>
      <p>Status: ${escapeHtml(status.label)}</p>
      <p>Shelter contact: ${escapeHtml(shelterContact)}</p>
      <p>Shelter location: ${escapeHtml(shelterLocation)}</p>
    </div>
  `.trim();

  return {
    from: process.env.PAWJAI_EMAIL_FROM ?? DEFAULT_FROM,
    html,
    subject: `PawJai booking ${details.appointment.bookingCode} ${status.subjectAction}`,
    text,
    to: getBookingNotificationRecipient({
      overrideEmail: process.env.PAWJAI_BOOKING_EMAIL_TO,
      recipientEmail: details.recipientEmail,
    }),
  };
}

export async function sendBookingNotificationEmail(details: BookingEmailDetails) {
  const message = buildBookingNotificationEmail(details);

  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send(message);

    if (error) {
      console.error("Booking notification email failed", error);
    }
  } catch (error) {
    console.error("Booking notification email could not be sent", error);
  }
}

export async function sendBookingNotificationForAppointment({
  admin,
  appointmentId,
}: {
  admin: any;
  appointmentId: string;
}) {
  const { data: appointment, error } = await admin
    .from("appointments")
    .select("id, adopter_id, dog_id, shelter_id, booking_code, status")
    .eq("id", appointmentId)
    .maybeSingle();

  if (error || !appointment || !["requested", "confirmed", "cancelled"].includes(appointment.status)) {
    if (error) console.error("Booking notification appointment lookup failed", error);
    return;
  }

  const [adopterResult, dogResult, shelterResult] = await Promise.all([
    admin.from("adopters").select("email").eq("id", appointment.adopter_id).maybeSingle(),
    appointment.dog_id
      ? admin.from("dogs").select("name").eq("id", appointment.dog_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("shelters")
      .select("name, phone_number, email, address_line, subdistrict, district, province, postal_code")
      .eq("id", appointment.shelter_id)
      .maybeSingle(),
  ]);

  if (adopterResult.error) console.error("Booking notification adopter lookup failed", adopterResult.error);
  if (dogResult.error) console.error("Booking notification dog lookup failed", dogResult.error);
  if (shelterResult.error || !shelterResult.data) {
    console.error("Booking notification shelter lookup failed", shelterResult.error);
    return;
  }

  await sendBookingNotificationEmail({
    appointment: {
      bookingCode: appointment.booking_code ?? `APT-${appointment.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5)}`,
      status: appointment.status,
    },
    dogName: dogResult.data?.name ?? null,
    recipientEmail: adopterResult.data?.email ?? null,
    shelter: {
      addressLine: shelterResult.data.address_line,
      district: shelterResult.data.district,
      email: shelterResult.data.email,
      name: shelterResult.data.name,
      phoneNumber: shelterResult.data.phone_number,
      postalCode: shelterResult.data.postal_code,
      province: shelterResult.data.province,
      subdistrict: shelterResult.data.subdistrict,
    },
  });
}
