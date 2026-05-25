export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type AppointmentSummary = {
  appointment_date: string;
  appointment_time?: string | null;
  status: string;
};

export type AppointmentStatusCopy = {
  label: string;
  description: string;
  background: string;
  color: string;
};

export const APPOINTMENT_TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
] as const;

export function normalizeAppointmentTime(time: string) {
  return time.slice(0, 5);
}

export function isAppointmentTimeSlot(time: string) {
  return APPOINTMENT_TIME_SLOTS.includes(normalizeAppointmentTime(time) as (typeof APPOINTMENT_TIME_SLOTS)[number]);
}

export function isPastAppointment(appointment: AppointmentSummary, today: string) {
  if (
    appointment.status === "completed" ||
    appointment.status === "cancelled" ||
    appointment.status === "no_show"
  ) {
    return true;
  }

  return appointment.appointment_date < today;
}

export function appointmentFollowUpDue(appointment: AppointmentSummary, now = new Date()) {
  if (appointment.status === "completed" || appointment.status === "cancelled" || appointment.status === "no_show") {
    return false;
  }

  if (!appointment.appointment_time) {
    return appointment.appointment_date < now.toISOString().slice(0, 10);
  }

  const visitStart = new Date(`${appointment.appointment_date}T${normalizeAppointmentTime(appointment.appointment_time)}:00`);
  return visitStart.getTime() + 24 * 60 * 60 * 1000 <= now.getTime();
}

export function isPastAppointmentByTime(appointment: AppointmentSummary, now = new Date()) {
  if (
    appointment.status === "completed" ||
    appointment.status === "cancelled" ||
    appointment.status === "no_show"
  ) {
    return true;
  }

  if (!appointment.appointment_time) {
    return appointment.appointment_date < now.toISOString().slice(0, 10);
  }

  const visitStart = new Date(`${appointment.appointment_date}T${normalizeAppointmentTime(appointment.appointment_time)}:00`);
  return visitStart.getTime() + 24 * 60 * 60 * 1000 <= now.getTime();
}

export function canEditAppointmentDateTime(appointment: AppointmentSummary, today: string) {
  if (appointment.status === "completed" || appointment.status === "no_show") {
    return false;
  }

  return appointment.appointment_date >= today;
}

export function getAppointmentStatusCopy(status: string): AppointmentStatusCopy {
  switch (status) {
    case "confirmed":
      return {
        label: "Accepted",
        description: "Shelter approved this visit",
        background: "#e5f2de",
        color: "#3f7d34",
      };
    case "cancelled":
      return {
        label: "Denied",
        description: "Shelter could not accept this visit",
        background: "#f8e2e4",
        color: "#a94650",
      };
    case "completed":
      return {
        label: "Visited",
        description: "Visit completed",
        background: "#eee6d7",
        color: "#65584f",
      };
    case "no_show":
      return {
        label: "Missed",
        description: "Visit was missed",
        background: "#eee6d7",
        color: "#65584f",
      };
    case "requested":
    default:
      return {
        label: "Pending",
        description: "Waiting for shelter decision",
        background: "#fff0da",
        color: "#a8641d",
      };
  }
}
