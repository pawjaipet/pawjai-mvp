import type { Database } from "@/types/database";

export const APPOINTMENT_MESSAGES_UNAVAILABLE_MESSAGE =
  "Messages are temporarily unavailable. Please try again soon.";

export type AppointmentMessageRow = Database["public"]["Tables"]["appointment_messages"]["Row"];
export type AppointmentMessageSenderRole = AppointmentMessageRow["sender_role"];

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
