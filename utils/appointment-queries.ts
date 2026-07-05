type SupabaseLikeClient = {
  from: (table: string) => any;
};

type SupabaseLikeError = {
  code?: string;
  message?: string;
};

const MESSAGE_APPOINTMENT_COLUMNS_WITH_BOOKING_CODE =
  "id, appointment_date, appointment_time, booking_code, dog_id, shelter_id, status";
const MESSAGE_APPOINTMENT_COLUMNS =
  "id, appointment_date, appointment_time, dog_id, shelter_id, status";

export type AdopterMessageAppointmentRow = {
  appointment_date: string;
  appointment_time: string;
  booking_code?: string | null;
  dog_id: string | null;
  id: string;
  shelter_id: string;
  status: string;
};

export function isMissingAppointmentColumnError(
  error: SupabaseLikeError | null | undefined,
  columnName: string,
) {
  const message = String(error?.message ?? "").toLowerCase();
  const normalizedColumn = columnName.toLowerCase();

  return (
    message.includes(normalizedColumn)
    && (
      message.includes("could not find")
      || message.includes("does not exist")
      || message.includes("schema cache")
      || error?.code === "PGRST204"
    )
  );
}

function buildMessageAppointmentsQuery(
  admin: SupabaseLikeClient,
  adopterId: string,
  columns: string,
  limit: number,
) {
  return admin
    .from("appointments")
    .select(columns)
    .eq("adopter_id", adopterId)
    .order("appointment_date", { ascending: false })
    .limit(limit);
}

export async function loadAdopterMessageAppointments(
  admin: SupabaseLikeClient,
  adopterId: string,
  limit = 50,
) {
  const result = await buildMessageAppointmentsQuery(
    admin,
    adopterId,
    MESSAGE_APPOINTMENT_COLUMNS_WITH_BOOKING_CODE,
    limit,
  );

  if (!isMissingAppointmentColumnError(result.error, "booking_code")) {
    return {
      data: (result.data ?? []) as AdopterMessageAppointmentRow[],
      error: result.error ?? null,
      usedBookingCodeFallback: false,
    };
  }

  const fallback = await buildMessageAppointmentsQuery(
    admin,
    adopterId,
    MESSAGE_APPOINTMENT_COLUMNS,
    limit,
  );

  return {
    data: (fallback.data ?? []) as AdopterMessageAppointmentRow[],
    error: fallback.error ?? null,
    usedBookingCodeFallback: true,
  };
}
