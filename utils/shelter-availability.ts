import type { Database } from "@/types/database";
import { APPOINTMENT_TIME_SLOTS } from "@/utils/appointments-model";

type SupabaseLike = {
  from: (table: string) => any;
};

type ShelterAvailabilityRow = {
  availability_type: Database["public"]["Enums"]["availability_type"];
  end_date: string;
  note: string | null;
  start_date: string;
};

type ShelterRegularHoursRow = {
  closes_at: string | null;
  day_of_week: number;
  is_closed: boolean;
  opens_at: string | null;
  slot_duration_minutes: number;
};

type ActiveAppointmentRow = {
  appointment_date: string;
  appointment_time: string;
};

export type DayAvailability = {
  date: string;
  isPast: boolean;
  isUnavailable: boolean;
  slots: string[];
  unavailableReason: string | null;
};

export type MonthAvailability = {
  days: DayAvailability[];
  daysByDate: Record<string, DayAvailability>;
  hasRegularHours: boolean;
};

const ACTIVE_APPOINTMENT_STATUSES = ["requested", "confirmed"];
const DEFAULT_SLOT_DURATION_MINUTES = 60;

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function timeToMinutes(time: string) {
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function generateSlots(open: string, close: string, durationMinutes: number) {
  const start = timeToMinutes(open);
  const end = timeToMinutes(close);
  const slots: string[] = [];

  for (let cursor = start; cursor + durationMinutes <= end; cursor += durationMinutes) {
    slots.push(minutesToTime(cursor));
  }

  return slots;
}

function isInRange(dateKey: string, range: Pick<ShelterAvailabilityRow, "end_date" | "start_date">) {
  return dateKey >= range.start_date && dateKey <= range.end_date;
}

function statusQuery(query: any) {
  return query.in ? query.in("status", ACTIVE_APPOINTMENT_STATUSES) : query;
}

async function getRegularHours(admin: SupabaseLike, shelterId: string) {
  const { data, error } = await admin
    .from("shelter_regular_hours")
    .select("day_of_week, opens_at, closes_at, slot_duration_minutes, is_closed")
    .eq("shelter_id", shelterId);

  if (error?.message?.includes("Could not find") || error?.message?.includes("schema cache")) {
    return [] as ShelterRegularHoursRow[];
  }

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ShelterRegularHoursRow[];
}

async function getClosures(admin: SupabaseLike, shelterId: string, monthStart: string, monthEnd: string) {
  const { data, error } = await admin
    .from("shelter_availability")
    .select("availability_type, start_date, end_date, note")
    .eq("shelter_id", shelterId)
    .eq("availability_type", "unavailable")
    .lte("start_date", monthEnd)
    .gte("end_date", monthStart);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ShelterAvailabilityRow[];
}

async function getActiveAppointments(admin: SupabaseLike, shelterId: string, monthStart: string, monthEnd: string) {
  const query = admin
    .from("appointments")
    .select("appointment_date, appointment_time")
    .eq("shelter_id", shelterId)
    .gte("appointment_date", monthStart)
    .lte("appointment_date", monthEnd);
  const { data, error } = await statusQuery(query);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ActiveAppointmentRow[];
}

export async function getShelterMonthAvailability({
  admin,
  month,
  shelterId,
  today = formatDateKey(new Date()),
  year,
}: {
  admin: SupabaseLike;
  month: number;
  shelterId: string;
  today?: string;
  year: number;
}): Promise<MonthAvailability> {
  const monthStartDate = new Date(year, month, 1);
  const monthEndDate = new Date(year, month + 1, 0);
  const monthStart = formatDateKey(monthStartDate);
  const monthEnd = formatDateKey(monthEndDate);
  const [regularHours, closures, appointments] = await Promise.all([
    getRegularHours(admin, shelterId),
    getClosures(admin, shelterId, monthStart, monthEnd),
    getActiveAppointments(admin, shelterId, monthStart, monthEnd),
  ]);
  const hoursByDay = new Map(regularHours.map((hours) => [hours.day_of_week, hours]));
  const hasRegularHours = regularHours.length > 0;
  const bookedSlots = new Map<string, Set<string>>();

  for (const appointment of appointments) {
    const dateKey = appointment.appointment_date;
    const timeKey = appointment.appointment_time.slice(0, 5);
    if (!bookedSlots.has(dateKey)) {
      bookedSlots.set(dateKey, new Set());
    }
    bookedSlots.get(dateKey)!.add(timeKey);
  }

  const days = Array.from({ length: monthEndDate.getDate() }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const dateKey = formatDateKey(date);
    const closure = closures.find((range) => isInRange(dateKey, range));
    const isPast = dateKey < today;
    const regularDay = hoursByDay.get(date.getDay());
    const baseSlots = hasRegularHours
      ? regularDay && !regularDay.is_closed && regularDay.opens_at && regularDay.closes_at
        ? generateSlots(regularDay.opens_at, regularDay.closes_at, regularDay.slot_duration_minutes || DEFAULT_SLOT_DURATION_MINUTES)
        : []
      : [...APPOINTMENT_TIME_SLOTS];
    const taken = bookedSlots.get(dateKey) ?? new Set<string>();
    const slots = closure || isPast ? [] : baseSlots.filter((slot) => !taken.has(slot));
    const unavailableReason = closure?.note ?? (hasRegularHours && regularDay?.is_closed ? "Shelter closed" : null);

    return {
      date: dateKey,
      isPast,
      isUnavailable: isPast || Boolean(closure) || slots.length === 0,
      slots,
      unavailableReason,
    };
  });

  return {
    days,
    daysByDate: Object.fromEntries(days.map((day) => [day.date, day])),
    hasRegularHours,
  };
}

export async function getShelterDaySlots({
  admin,
  date,
  shelterId,
  today = formatDateKey(new Date()),
}: {
  admin: SupabaseLike;
  date: string;
  shelterId: string;
  today?: string;
}) {
  const parsedDate = dateFromKey(date);
  const availability = await getShelterMonthAvailability({
    admin,
    month: parsedDate.getMonth(),
    shelterId,
    today,
    year: parsedDate.getFullYear(),
  });
  return availability.daysByDate[date]?.slots ?? [];
}
