import { getResendClient } from "@/lib/resend";

type BookingEmailStatus = "requested" | "confirmed" | "cancelled";
export type BookingNotificationEvent =
  | "booking_requested"
  | "booking_confirmed"
  | "booking_denied"
  | "date_change_requested";

type BookingEmailDetails = {
  appointment: {
    appointmentDate?: string | null;
    appointmentTime?: string | null;
    bookingCode: string;
    status: BookingEmailStatus;
  };
  adopterName?: string | null;
  dogName?: string | null;
  event?: BookingNotificationEvent;
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
  recipientEmail?: string | null;
};

type BookingNotificationAudience = "adopter" | "shelter";
type BookingNotificationMessage = {
  from: string;
  html: string;
  subject: string;
  text: string;
  to: string;
};
type ReturnInquiryNotificationDetails = {
  appointment: {
    appointmentDate?: string | null;
    appointmentTime?: string | null;
    bookingCode: string;
  };
  adopterName?: string | null;
  dogName?: string | null;
  shelter: {
    email?: string | null;
    name?: string | null;
  };
};
type AppointmentMessageNotificationDetails = {
  appointment: {
    appointmentDate?: string | null;
    appointmentId: string;
    appointmentTime?: string | null;
    bookingCode: string;
  };
  adopter: {
    email?: string | null;
    name?: string | null;
  };
  attachmentName?: string | null;
  body?: string | null;
  dogName?: string | null;
  senderLabel?: string | null;
  senderRole: "adopter" | "shelter";
  shelter: {
    email?: string | null;
    name?: string | null;
  };
};
type SendAppointmentMessageNotificationInput = {
  admin: any;
  appointmentId: string;
  attachmentName?: string | null;
  body?: string | null;
  senderLabel?: string | null;
  senderRole: "adopter" | "shelter";
};

const FALLBACK_NOTIFICATION_TO = "pawjaipet@gmail.com";
const DEFAULT_SITE_ORIGIN = "https://www.pawjaipet.com";
const DEFAULT_FROM = "PawJai <onboarding@resend.dev>";
const BLOCKED_NOTIFICATION_DOMAINS = new Set([
  "example.com",
  "example.net",
  "example.org",
]);
const BLOCKED_NOTIFICATION_TLDS = [".example", ".invalid", ".localhost", ".test"];

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

function normalizeDeliverableEmail(value: string | null | undefined) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";

  const domain = email.split("@").pop() ?? "";
  if (BLOCKED_NOTIFICATION_DOMAINS.has(domain)) return "";
  if (BLOCKED_NOTIFICATION_TLDS.some((suffix) => domain.endsWith(suffix))) return "";

  return email;
}

function eventFromStatus(status: BookingEmailStatus): BookingNotificationEvent {
  switch (status) {
    case "confirmed":
      return "booking_confirmed";
    case "cancelled":
      return "booking_denied";
    case "requested":
      return "booking_requested";
  }
}

function eventCopy(event: BookingNotificationEvent, audience: BookingNotificationAudience) {
  switch (event) {
    case "booking_confirmed":
      return {
        label: "Accepted",
        subject: "was accepted",
      };
    case "booking_denied":
      return {
        label: "Denied",
        subject: "was denied",
      };
    case "date_change_requested":
      return {
        label: "Date change requested",
        subject: audience === "shelter" ? "needs a date change review" : "has a date change request",
      };
    case "booking_requested":
      return {
        label: "Pending",
        subject: "is pending",
      };
  }
}

export function getBookingNotificationRecipient({
  recipientEmail,
}: BookingNotificationRecipientInput) {
  if (!String(recipientEmail ?? "").trim()) return FALLBACK_NOTIFICATION_TO;
  return normalizeDeliverableEmail(recipientEmail);
}

function formatVisit(appointment: BookingEmailDetails["appointment"]) {
  const date = String(appointment.appointmentDate ?? "").trim();
  const time = String(appointment.appointmentTime ?? "").trim();

  if (date && time) return `${date} at ${time}`;
  if (date) return date;
  if (time) return time;
  return "Not provided";
}

function formatName(parts: Array<string | null | undefined>) {
  return parts.map((part) => String(part ?? "").trim()).filter(Boolean).join(" ");
}

function formatAppointmentBookingCode(appointmentId: string) {
  return `APT-${appointmentId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5)}`;
}

function getNotificationOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.PAWJAI_SITE_ORIGIN ?? DEFAULT_SITE_ORIGIN).replace(/\/+$/, "");
}

function slugifyNotificationShelterName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function buildAppointmentMessageUrl(details: AppointmentMessageNotificationDetails) {
  const origin = getNotificationOrigin();

  if (details.senderRole === "shelter") {
    return `${origin}/appointments/${details.appointment.appointmentId}?tab=messages`;
  }

  const shelterSlug = details.shelter.name ? slugifyNotificationShelterName(details.shelter.name) : "";
  return shelterSlug
    ? `${origin}/shelter/${shelterSlug}?view=messages`
    : `${origin}/admin?view=messages`;
}

function buildNotificationLines(details: BookingEmailDetails, audience: BookingNotificationAudience) {
  const event = eventCopy(details.event ?? eventFromStatus(details.appointment.status), audience);
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
    `Status: ${event.label}`,
    `Visit: ${formatVisit(details.appointment)}`,
  ];

  if (audience === "shelter") {
    lines.push(
      `Adopter: ${compactJoin([details.adopterName, details.recipientEmail]) || "Not provided"}`,
      `Dog: ${details.dogName || "Not provided"}`,
    );
  }

  lines.push(
    `Shelter contact: ${shelterContact}`,
    `Shelter location: ${shelterLocation}`,
  );

  return lines;
}

function buildHtml(lines: string[]) {
  return `
    <div>
      ${lines.map((line) => {
        const [label, ...rest] = line.split(": ");
        const value = rest.join(": ");
        return `<p>${escapeHtml(label)}: <strong>${escapeHtml(value)}</strong></p>`;
      }).join("\n      ")}
    </div>
  `.trim();
}

function buildBookingNotificationEmailForAudience(
  details: BookingEmailDetails,
  audience: BookingNotificationAudience,
) {
  const notificationEvent = details.event ?? eventFromStatus(details.appointment.status);
  const event = eventCopy(notificationEvent, audience);
  const lines = buildNotificationLines(details, audience);
  const to = audience === "shelter"
    ? normalizeDeliverableEmail(details.shelter.email)
    : getBookingNotificationRecipient({ recipientEmail: details.recipientEmail });

  if (!to) return null;

  return {
    from: process.env.PAWJAI_EMAIL_FROM ?? DEFAULT_FROM,
    html: buildHtml(lines),
    subject: `${audience === "shelter" && notificationEvent === "booking_requested" ? "New " : ""}PawJai booking ${details.appointment.bookingCode} ${event.subject}`,
    text: lines.join("\n"),
    to,
  };
}

export function buildBookingNotificationEmail(details: BookingEmailDetails) {
  return buildBookingNotificationEmailForAudience(details, "adopter")!;
}

export function buildBookingNotificationEmails(details: BookingEmailDetails) {
  return ([
    buildBookingNotificationEmailForAudience(details, "adopter"),
    buildBookingNotificationEmailForAudience(details, "shelter"),
  ]).filter((message): message is BookingNotificationMessage => Boolean(message));
}

export async function sendBookingNotificationEmail(details: BookingEmailDetails) {
  const messages = buildBookingNotificationEmails(details);
  console.info("Sending booking notification email", {
    bookingCode: details.appointment.bookingCode,
    event: details.event ?? eventFromStatus(details.appointment.status),
    to: messages.map((message) => message.to),
  });

  await Promise.all(messages.map(async (message) => {
    try {
      const resend = getResendClient();
      const { error } = await resend.emails.send(message);

      if (error) {
        console.error("Booking notification email failed", error);
      }
    } catch (error) {
      console.error("Booking notification email could not be sent", error);
    }
  }));
}

export async function sendBookingNotificationForAppointment({
  admin,
  appointmentId,
  event,
  visitDate,
  visitTime,
}: {
  admin: any;
  appointmentId: string;
  event?: BookingNotificationEvent;
  visitDate?: string | null;
  visitTime?: string | null;
}) {
  const { data: appointment, error } = await admin
    .from("appointments")
    .select("id, adopter_id, appointment_date, appointment_time, dog_id, shelter_id, status")
    .eq("id", appointmentId)
    .maybeSingle();

  if (error || !appointment || !["requested", "confirmed", "cancelled"].includes(appointment.status)) {
    if (error) console.error("Booking notification appointment lookup failed", error);
    return;
  }

  const [adopterResult, dogResult, shelterResult] = await Promise.all([
    admin.from("adopters").select("email, first_name, last_name").eq("id", appointment.adopter_id).maybeSingle(),
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
      appointmentDate: visitDate ?? appointment.appointment_date ?? null,
      appointmentTime: visitTime ?? appointment.appointment_time ?? null,
      bookingCode: `APT-${appointment.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5)}`,
      status: appointment.status,
    },
    adopterName: formatName([adopterResult.data?.first_name, adopterResult.data?.last_name]) || null,
    dogName: dogResult.data?.name ?? null,
    event,
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

export function buildReturnInquiryNotificationEmail(details: ReturnInquiryNotificationDetails) {
  const to = normalizeDeliverableEmail(details.shelter.email);
  if (!to) return null;

  const lines = [
    `Booking number: ${details.appointment.bookingCode}`,
    `Status: Return inquiry`,
    `Visit: ${formatVisit({
      appointmentDate: details.appointment.appointmentDate ?? null,
      appointmentTime: details.appointment.appointmentTime ?? null,
      bookingCode: details.appointment.bookingCode,
      status: "requested",
    })}`,
    `Adopter: ${details.adopterName || "Not provided"}`,
    `Dog: ${details.dogName || "Not provided"}`,
  ];

  return {
    from: process.env.PAWJAI_EMAIL_FROM ?? DEFAULT_FROM,
    html: buildHtml(lines),
    subject: `PawJai return inquiry for booking ${details.appointment.bookingCode}`,
    text: lines.join("\n"),
    to,
  };
}

export function buildAppointmentMessageNotificationEmail(details: AppointmentMessageNotificationDetails) {
  const to = details.senderRole === "shelter"
    ? getBookingNotificationRecipient({ recipientEmail: details.adopter.email })
    : normalizeDeliverableEmail(details.shelter.email);

  if (!to) return null;

  const sender = String(details.senderLabel ?? "").trim()
    || (details.senderRole === "shelter" ? details.shelter.name : details.adopter.name)
    || (details.senderRole === "shelter" ? "Shelter team" : "Visitor");
  const messageBody = String(details.body ?? "").trim() || (details.attachmentName ? "Attachment only" : "No message text");
  const lines = [
    `Booking number: ${details.appointment.bookingCode}`,
    `From: ${sender}`,
    `Dog: ${details.dogName || "Not provided"}`,
    `Visit: ${formatVisit({
      appointmentDate: details.appointment.appointmentDate ?? null,
      appointmentTime: details.appointment.appointmentTime ?? null,
      bookingCode: details.appointment.bookingCode,
      status: "requested",
    })}`,
    `Message: ${messageBody}`,
  ];

  if (details.attachmentName) {
    lines.push(`Attachment: ${details.attachmentName}`);
  }

  lines.push(`Open conversation: ${buildAppointmentMessageUrl(details)}`);

  return {
    from: process.env.PAWJAI_EMAIL_FROM ?? DEFAULT_FROM,
    html: buildHtml(lines),
    subject: `New PawJai message for booking ${details.appointment.bookingCode}`,
    text: lines.join("\n"),
    to,
  };
}

export async function sendReturnInquiryNotificationForAppointment({
  admin,
  appointmentId,
}: {
  admin: any;
  appointmentId: string;
}) {
  const { data: appointment, error } = await admin
    .from("appointments")
    .select("id, adopter_id, appointment_date, appointment_time, dog_id, shelter_id")
    .eq("id", appointmentId)
    .maybeSingle();

  if (error || !appointment) {
    if (error) console.error("Return inquiry appointment lookup failed", error);
    return;
  }

  const [adopterResult, dogResult, shelterResult] = await Promise.all([
    admin.from("adopters").select("email, first_name, last_name").eq("id", appointment.adopter_id).maybeSingle(),
    appointment.dog_id
      ? admin.from("dogs").select("name").eq("id", appointment.dog_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from("shelters").select("name, email").eq("id", appointment.shelter_id).maybeSingle(),
  ]);

  if (adopterResult.error) console.error("Return inquiry adopter lookup failed", adopterResult.error);
  if (dogResult.error) console.error("Return inquiry dog lookup failed", dogResult.error);
  if (shelterResult.error || !shelterResult.data) {
    console.error("Return inquiry shelter lookup failed", shelterResult.error);
    return;
  }

  const message = buildReturnInquiryNotificationEmail({
    appointment: {
      appointmentDate: appointment.appointment_date ?? null,
      appointmentTime: appointment.appointment_time ?? null,
      bookingCode: `APT-${appointment.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5)}`,
    },
    adopterName: compactJoin([
      formatName([adopterResult.data?.first_name, adopterResult.data?.last_name]),
      adopterResult.data?.email,
    ]) || null,
    dogName: dogResult.data?.name ?? null,
    shelter: {
      email: shelterResult.data.email,
      name: shelterResult.data.name,
    },
  });

  if (!message) return;

  console.info("Sending return inquiry notification email", {
    appointmentId,
    to: message.to,
  });

  try {
    const resend = getResendClient();
    const { error: sendError } = await resend.emails.send(message);

    if (sendError) {
      console.error("Return inquiry notification email failed", sendError);
    }
  } catch (error) {
    console.error("Return inquiry notification email could not be sent", error);
  }
}

export async function sendAppointmentMessageNotificationForAppointment({
  admin,
  appointmentId,
  attachmentName,
  body,
  senderLabel,
  senderRole,
}: SendAppointmentMessageNotificationInput) {
  const { data: appointment, error } = await admin
    .from("appointments")
    .select("id, adopter_id, appointment_date, appointment_time, dog_id, shelter_id")
    .eq("id", appointmentId)
    .maybeSingle();

  if (error || !appointment) {
    if (error) console.error("Appointment message notification lookup failed", error);
    return;
  }

  const [adopterResult, dogResult, shelterResult] = await Promise.all([
    admin.from("adopters").select("email, first_name, last_name").eq("id", appointment.adopter_id).maybeSingle(),
    appointment.dog_id
      ? admin.from("dogs").select("name").eq("id", appointment.dog_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from("shelters").select("name, email").eq("id", appointment.shelter_id).maybeSingle(),
  ]);

  if (adopterResult.error) console.error("Appointment message adopter lookup failed", adopterResult.error);
  if (dogResult.error) console.error("Appointment message dog lookup failed", dogResult.error);
  if (shelterResult.error || !shelterResult.data) {
    console.error("Appointment message shelter lookup failed", shelterResult.error);
    return;
  }

  const message = buildAppointmentMessageNotificationEmail({
    appointment: {
      appointmentDate: appointment.appointment_date ?? null,
      appointmentId: appointment.id,
      appointmentTime: appointment.appointment_time ?? null,
      bookingCode: formatAppointmentBookingCode(appointment.id),
    },
    adopter: {
      email: adopterResult.data?.email ?? null,
      name: formatName([adopterResult.data?.first_name, adopterResult.data?.last_name]) || null,
    },
    attachmentName,
    body,
    dogName: dogResult.data?.name ?? null,
    senderLabel,
    senderRole,
    shelter: {
      email: shelterResult.data.email,
      name: shelterResult.data.name,
    },
  });

  if (!message) return;

  console.info("Sending appointment message notification email", {
    appointmentId,
    senderRole,
    to: message.to,
  });

  try {
    const resend = getResendClient();
    const { error: sendError } = await resend.emails.send(message);

    if (sendError) {
      console.error("Appointment message notification email failed", sendError);
    }
  } catch (error) {
    console.error("Appointment message notification email could not be sent", error);
  }
}
