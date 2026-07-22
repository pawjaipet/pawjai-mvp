import { getResendClient } from "@/lib/resend";

type AdSubmissionEmailDetails = {
  clickUrl: string;
  companyName: string;
  endDate: string;
  recipientEmail?: string | null;
  startDate: string;
  submissionCode: string;
};

const DEFAULT_FROM = "PawJai <onboarding@resend.dev>";
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

export async function sendAdSubmissionConfirmation(details: AdSubmissionEmailDetails) {
  const to = normalizeDeliverableEmail(details.recipientEmail);
  if (!to) return { skipped: true };

  const lines = [
    `Ad code: ${details.submissionCode}`,
    `Advertiser: ${details.companyName}`,
    `Requested dates: ${formatDateRange(details.startDate, details.endDate)}`,
    `Destination URL: ${details.clickUrl}`,
  ];

  const htmlLines = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#4f4338">
      <h2 style="margin:0 0 12px">Your PawJai ad was submitted</h2>
      <p>Thank you for working with PawJai. We received your ad application and our team will review it before it goes live.</p>
      <ul>${htmlLines}</ul>
      <p>Please keep this ad code for any follow-up with the PawJai team.</p>
    </div>
  `;

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
    html,
    subject: `PawJai ad submitted: ${details.submissionCode}`,
    text: [
      "Your PawJai ad was submitted.",
      "Thank you for working with PawJai. We received your ad application and our team will review it before it goes live.",
      "",
      ...lines,
      "",
      "Please keep this ad code for any follow-up with the PawJai team.",
    ].join("\n"),
    to,
  });

  if (error) {
    return { error: error.message };
  }

  return { sent: true };
}
