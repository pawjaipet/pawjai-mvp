import type { Database } from "@/types/database";

export const APPOINTMENT_MESSAGES_UNAVAILABLE_MESSAGE =
  "Messages are temporarily unavailable. Please try again soon.";

export type AppointmentMessageRow = Database["public"]["Tables"]["appointment_messages"]["Row"];
export type AppointmentMessageSenderRole = AppointmentMessageRow["sender_role"];

export const RETURN_INQUIRY_MESSAGE_PREFIX = "Return inquiry requested.";
const RETURN_INQUIRY_REASON_LABEL = "Reason:";
const DEFAULT_RETURN_INQUIRY_REASON = "No reason provided yet.";

export type ReturnInquiryMessage = {
  reason: string;
};

export function formatReturnInquiryMessageBody(reason: string) {
  const cleanReason = reason.trim() || DEFAULT_RETURN_INQUIRY_REASON;
  return `${RETURN_INQUIRY_MESSAGE_PREFIX}\n\n${RETURN_INQUIRY_REASON_LABEL} ${cleanReason}`;
}

export function parseReturnInquiryMessageBody(body: string): ReturnInquiryMessage | null {
  const normalized = body.trim();
  if (!normalized.startsWith(RETURN_INQUIRY_MESSAGE_PREFIX)) return null;

  const reasonMatch = normalized.match(/(?:^|\n)Reason:\s*([\s\S]*)$/i);
  return {
    reason: reasonMatch?.[1]?.trim() || DEFAULT_RETURN_INQUIRY_REASON,
  };
}

export function isAppointmentMessagesUnavailableError(
  error: { code?: string; message?: string } | null | undefined,
) {
  const code = error?.code ?? "";
  const message = (error?.message ?? "").toLowerCase();

  return (
    code === "PGRST205"
    || (
      message.includes("appointment_messages")
      && (
        message.includes("schema cache")
        || message.includes("could not find")
        || message.includes("does not exist")
        || message.includes("relation")
      )
    )
  );
}

export function isReturnInquiriesUnavailableError(
  error: { code?: string; message?: string } | null | undefined,
) {
  const code = error?.code ?? "";
  const message = (error?.message ?? "").toLowerCase();

  return (
    code === "PGRST205"
    || (
      message.includes("return_inquiries")
      && (
        message.includes("schema cache")
        || message.includes("could not find")
        || message.includes("does not exist")
        || message.includes("relation")
      )
    )
  );
}
