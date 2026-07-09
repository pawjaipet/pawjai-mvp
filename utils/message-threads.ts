import type { AppointmentMessageRow } from "@/utils/appointment-messages";
import {
  APPOINTMENT_MESSAGES_UNAVAILABLE_MESSAGE,
  isAppointmentMessagesUnavailableError,
} from "@/utils/appointment-messages";
import { isMissingAppointmentColumnError } from "@/utils/appointment-queries";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Database } from "@/types/database";

type AppointmentRow = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  "adopter_id" | "appointment_date" | "appointment_time" | "booking_code" | "dog_id" | "id" | "shelter_id" | "status"
> & {
  booking_code?: string | null;
};

type DogSummary = {
  id: string;
  name: string;
};

type AdopterSummary = {
  email: string | null;
  first_name: string | null;
  id: string;
  last_name: string | null;
  phone_number?: string | null;
};

type ShelterSummary = {
  id: string;
  name: string;
};

export type AppointmentMessageThread = {
  adopterEmail: string | null;
  adopterId: string;
  adopterName: string;
  appointmentDate: string;
  appointmentId: string;
  appointmentTime: string;
  bookingCode: string | null;
  dogId: string | null;
  dogName: string;
  latestMessage: AppointmentMessageRow | null;
  messages: AppointmentMessageRow[];
  needsReply: boolean;
  searchableText: string;
  shelterId: string;
  shelterName: string;
  status: string;
  unreadForShelterCount: number;
};

export type AppointmentMessageFilter = "all" | "unread" | "upcoming" | "needs_reply";

export type LoadAppointmentMessageThreadsResult = {
  error: string | null;
  messagesUnavailable: boolean;
  threads: AppointmentMessageThread[];
};

const THREAD_APPOINTMENT_COLUMNS_WITH_BOOKING_CODE =
  "id,adopter_id,dog_id,shelter_id,appointment_date,appointment_time,booking_code,status";
const THREAD_APPOINTMENT_COLUMNS =
  "id,adopter_id,dog_id,shelter_id,appointment_date,appointment_time,status";

function displayBookingCode(appointment: Pick<AppointmentRow, "booking_code" | "id">) {
  if (appointment.booking_code) return appointment.booking_code;
  const compact = appointment.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `APT-${compact.slice(0, 5)}`;
}

function displayAdopterName(adopter: AdopterSummary | undefined) {
  return [adopter?.first_name, adopter?.last_name].filter(Boolean).join(" ") || adopter?.email || "Unknown adopter";
}

function compareNewestThread(a: AppointmentMessageThread, b: AppointmentMessageThread) {
  const aDate = a.latestMessage?.created_at ?? `${a.appointmentDate}T${a.appointmentTime}`;
  const bDate = b.latestMessage?.created_at ?? `${b.appointmentDate}T${b.appointmentTime}`;
  return bDate.localeCompare(aDate);
}

function isUpcomingThread(thread: AppointmentMessageThread) {
  const visitDate = new Date(`${thread.appointmentDate}T${thread.appointmentTime || "00:00"}`);
  return Number.isNaN(visitDate.getTime()) ? true : visitDate >= new Date();
}

export function buildAppointmentMessageThreads({
  adopters,
  appointments,
  dogs,
  messages,
  shelterIds,
  shelters,
}: {
  adopters: AdopterSummary[];
  appointments: AppointmentRow[];
  dogs: DogSummary[];
  messages: AppointmentMessageRow[];
  shelterIds?: string[] | null;
  shelters: ShelterSummary[];
}) {
  const allowedShelters = Array.isArray(shelterIds) ? new Set(shelterIds) : null;
  const adopterById = new Map(adopters.map((adopter) => [adopter.id, adopter]));
  const dogById = new Map(dogs.map((dog) => [dog.id, dog]));
  const shelterById = new Map(shelters.map((shelter) => [shelter.id, shelter]));
  const messagesByAppointment = new Map<string, AppointmentMessageRow[]>();

  for (const message of messages) {
    const items = messagesByAppointment.get(message.appointment_id) ?? [];
    items.push(message);
    messagesByAppointment.set(message.appointment_id, items);
  }

  return appointments
    .filter((appointment) => !allowedShelters || allowedShelters.has(appointment.shelter_id))
    .map((appointment) => {
      const threadMessages = (messagesByAppointment.get(appointment.id) ?? [])
        .slice()
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      const latestMessage = threadMessages.at(-1) ?? null;
      const adopter = adopterById.get(appointment.adopter_id);
      const dog = appointment.dog_id ? dogById.get(appointment.dog_id) : null;
      const shelter = shelterById.get(appointment.shelter_id);
      const adopterName = displayAdopterName(adopter);
      const dogName = dog?.name ?? "Shelter visit";
      const shelterName = shelter?.name ?? "Shelter";
      const bookingCode = displayBookingCode(appointment);

      return {
        adopterEmail: adopter?.email ?? null,
        adopterId: appointment.adopter_id,
        adopterName,
        appointmentDate: appointment.appointment_date,
        appointmentId: appointment.id,
        appointmentTime: appointment.appointment_time,
        bookingCode,
        dogId: appointment.dog_id,
        dogName,
        latestMessage,
        messages: threadMessages,
        needsReply: latestMessage?.sender_role === "adopter",
        searchableText: [
          adopterName,
          adopter?.email,
          bookingCode,
          dogName,
          shelterName,
          appointment.status,
        ].filter(Boolean).join(" ").toLowerCase(),
        shelterId: appointment.shelter_id,
        shelterName,
        status: appointment.status,
        unreadForShelterCount: threadMessages.filter((message) => (
          message.sender_role === "adopter" && !message.read_by_shelter_at
        )).length,
      };
    })
    .sort(compareNewestThread);
}

export function filterAppointmentMessageThreads(
  threads: AppointmentMessageThread[],
  options: {
    filter?: AppointmentMessageFilter;
    query?: string;
  } = {},
) {
  const filter = options.filter ?? "all";
  const query = (options.query ?? "").trim().toLowerCase();

  return threads.filter((thread) => {
    if (query && !thread.searchableText.includes(query)) return false;
    if (filter === "unread") return thread.unreadForShelterCount > 0;
    if (filter === "needs_reply") return thread.needsReply;
    if (filter === "upcoming") return isUpcomingThread(thread);
    return true;
  });
}

export async function loadAppointmentMessageThreads({
  shelterIds,
}: {
  shelterIds?: string[] | null;
} = {}): Promise<LoadAppointmentMessageThreadsResult> {
  const admin = createAdminClient();
  const shouldScopeShelters = Array.isArray(shelterIds);

  const buildAppointmentQuery = (columns: string) => {
    const query = admin
      .from("appointments")
      .select(columns)
      .order("appointment_date", { ascending: true })
      .limit(300);

    if (shouldScopeShelters && shelterIds.length > 0) {
      query.in("shelter_id", shelterIds);
    }

    return query;
  };

  if (shouldScopeShelters && shelterIds.length === 0) {
    return { error: null, messagesUnavailable: false, threads: [] };
  }

  let appointmentsResult = await buildAppointmentQuery(THREAD_APPOINTMENT_COLUMNS_WITH_BOOKING_CODE);
  if (isMissingAppointmentColumnError(appointmentsResult.error, "booking_code")) {
    appointmentsResult = await buildAppointmentQuery(THREAD_APPOINTMENT_COLUMNS);
  }
  if (appointmentsResult.error) {
    return {
      error: appointmentsResult.error.message,
      messagesUnavailable: false,
      threads: [],
    };
  }

  const appointments = (appointmentsResult.data ?? []) as unknown as AppointmentRow[];
  const appointmentIds = appointments.map((appointment) => appointment.id);
  const dogIds = [...new Set(appointments.map((appointment) => appointment.dog_id).filter(Boolean))] as string[];
  const adopterIds = [...new Set(appointments.map((appointment) => appointment.adopter_id).filter(Boolean))];
  const visibleShelterIds = [...new Set(appointments.map((appointment) => appointment.shelter_id).filter(Boolean))];

  const [messagesResult, dogsResult, adoptersResult, sheltersResult] = await Promise.all([
    appointmentIds.length
      ? admin
          .from("appointment_messages")
          .select("*")
          .in("appointment_id", appointmentIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    dogIds.length
      ? admin.from("dogs").select("id,name").in("id", dogIds)
      : Promise.resolve({ data: [], error: null }),
    adopterIds.length
      ? admin.from("adopters").select("id,first_name,last_name,email,phone_number").in("id", adopterIds)
      : Promise.resolve({ data: [], error: null }),
    visibleShelterIds.length
      ? admin.from("shelters").select("id,name").in("id", visibleShelterIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (messagesResult.error) {
    if (isAppointmentMessagesUnavailableError(messagesResult.error)) {
      return {
        error: APPOINTMENT_MESSAGES_UNAVAILABLE_MESSAGE,
        messagesUnavailable: true,
        threads: buildAppointmentMessageThreads({
          adopters: (adoptersResult.data ?? []) as AdopterSummary[],
          appointments,
          dogs: (dogsResult.data ?? []) as DogSummary[],
          messages: [],
          shelterIds,
          shelters: (sheltersResult.data ?? []) as ShelterSummary[],
        }),
      };
    }

    return {
      error: messagesResult.error.message,
      messagesUnavailable: false,
      threads: [],
    };
  }

  const supportingError = dogsResult.error ?? adoptersResult.error ?? sheltersResult.error;
  if (supportingError) {
    return {
      error: supportingError.message,
      messagesUnavailable: false,
      threads: [],
    };
  }

  return {
    error: null,
    messagesUnavailable: false,
    threads: buildAppointmentMessageThreads({
      adopters: (adoptersResult.data ?? []) as AdopterSummary[],
      appointments,
      dogs: (dogsResult.data ?? []) as DogSummary[],
      messages: (messagesResult.data ?? []) as AppointmentMessageRow[],
      shelterIds,
      shelters: (sheltersResult.data ?? []) as ShelterSummary[],
    }),
  };
}
