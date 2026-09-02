const DEFAULT_NOTIFICATION_FROM = "PawJai <notifications@pawjaipet.com>";
const BLOCKED_SENDER_DOMAINS = new Set([
  "mail.pawjaipet.com",
  "resend.dev",
]);

function getEmailDomain(value: string | null | undefined) {
  const email = String(value ?? "").trim().match(/<?[^\s<>@]+@([^\s<>]+)>?$/)?.[1];
  return email?.toLowerCase() ?? "";
}

export function getNotificationFrom() {
  const configuredFrom = String(process.env.PAWJAI_EMAIL_FROM ?? "").trim();
  const senderDomain = getEmailDomain(configuredFrom);

  if (!configuredFrom || BLOCKED_SENDER_DOMAINS.has(senderDomain)) {
    return DEFAULT_NOTIFICATION_FROM;
  }

  return configuredFrom;
}
