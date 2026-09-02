import { getResendClient } from "@/lib/resend";
import { getNotificationFrom } from "@/utils/notification-email";

type AdSubmissionEmailDetails = {
  clickUrl: string;
  companyName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  endDate: string;
  mediaType?: "image" | "video";
  recipientEmail?: string | null;
  startDate: string;
  submissionCode: string;
};

const PAWJAI_CONTACT_EMAIL = "pawjaipet@gmail.com";
const PAWJAI_ADS_NOTIFICATION_EMAIL = process.env.PAWJAI_ADS_NOTIFICATION_EMAIL ?? PAWJAI_CONTACT_EMAIL;
const BLOCKED_NOTIFICATION_DOMAINS = new Set([
  "example.com",
  "example.net",
  "example.org",
]);
const BLOCKED_NOTIFICATION_TLDS = [".example", ".invalid", ".localhost", ".test"];

function normalizeDeliverableEmail(value: string | null | undefined) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";

  const domain = email.split("@").pop() ?? "";
  if (BLOCKED_NOTIFICATION_DOMAINS.has(domain)) return "";
  if (BLOCKED_NOTIFICATION_TLDS.some((suffix) => domain.endsWith(suffix))) return "";

  return email;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateRange(startDate: string, endDate: string) {
  return `${startDate} to ${endDate}`;
}

function formatMediaType(mediaType: AdSubmissionEmailDetails["mediaType"]) {
  return mediaType === "video" ? "Video ad" : "Image ad";
}

export function buildAdSubmissionConfirmationEmail(details: AdSubmissionEmailDetails) {
  const to = normalizeDeliverableEmail(details.recipientEmail);
  if (!to) return null;

  const lines = [
    `Submission code: ${details.submissionCode}`,
    `Advertiser: ${details.companyName}`,
    `Ad format: ${formatMediaType(details.mediaType)}`,
    `Campaign dates: ${formatDateRange(details.startDate, details.endDate)}`,
    `Destination URL: ${details.clickUrl}`,
    `Questions: Contact us at ${PAWJAI_CONTACT_EMAIL}`,
  ];

  const htmlLines = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#4f4338">
      <h2 style="margin:0 0 12px">Your PawJai ad submission is confirmed</h2>
      <p>Thank you for working with PawJai. We received your ad submission and our team will review it before it goes live.</p>
      <ul>${htmlLines}</ul>
      <p>Please keep this submission code for any follow-up with the PawJai team.</p>
    </div>
  `;

  return {
    from: getNotificationFrom(),
    html,
    subject: `PawJai ad submission confirmed: ${details.submissionCode}`,
    text: [
      "Your PawJai ad submission is confirmed.",
      "Thank you for working with PawJai. We received your ad submission and our team will review it before it goes live.",
      "",
      ...lines,
      "",
      "Please keep this submission code for any follow-up with the PawJai team.",
    ].join("\n"),
    to,
  };
}

export async function sendAdSubmissionConfirmation(details: AdSubmissionEmailDetails) {
  const message = buildAdSubmissionConfirmationEmail(details);
  if (!message) return { skipped: true };

  const resend = getResendClient();
  const { error } = await resend.emails.send(message);

  if (error) {
    return { error: error.message };
  }

  return { sent: true };
}

export function buildPawjaiAdSubmissionNotificationEmail(details: AdSubmissionEmailDetails) {
  const to = normalizeDeliverableEmail(PAWJAI_ADS_NOTIFICATION_EMAIL);
  if (!to) return null;

  const lines = [
    `Submission code: ${details.submissionCode}`,
    `Advertiser: ${details.companyName}`,
    `Contact email: ${details.contactEmail || "Not provided"}`,
    `Contact phone: ${details.contactPhone || "Not provided"}`,
    `Ad format: ${formatMediaType(details.mediaType)}`,
    `Requested dates: ${formatDateRange(details.startDate, details.endDate)}`,
    `Destination URL: ${details.clickUrl}`,
    "Review in PawJai admin > Ads.",
  ];

  const htmlLines = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  return {
    from: getNotificationFrom(),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#4f4338">
        <h2 style="margin:0 0 12px">New PawJai ad submission</h2>
        <p>A business submitted a new ad through /ads.</p>
        <ul>${htmlLines}</ul>
      </div>
    `,
    subject: `New PawJai ad submission: ${details.submissionCode}`,
    text: [
      "New PawJai ad submission.",
      "",
      ...lines,
    ].join("\n"),
    to,
  };
}

export async function sendPawjaiAdSubmissionNotification(details: AdSubmissionEmailDetails) {
  const message = buildPawjaiAdSubmissionNotificationEmail(details);
  if (!message) return { skipped: true };

  const resend = getResendClient();
  const { error } = await resend.emails.send(message);

  if (error) {
    return { error: error.message };
  }

  return { sent: true };
}
