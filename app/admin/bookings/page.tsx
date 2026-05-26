import Link from "next/link";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, ExternalLink, Globe, ImageIcon, Mail, MapPin, MessageCircle, PawPrint, Phone, QrCode, Search, Send, ShieldCheck, Trash2 } from "lucide-react";
import type { Database } from "@/types/database";
import { APPOINTMENT_TIME_SLOTS, appointmentFollowUpDue, isPastAppointmentByTime, normalizeAppointmentTime } from "@/utils/appointments-model";
import { formatBookingCode, normalizeBookingCodeSearch } from "@/utils/booking";
import { isAdminGateOpen } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";
import AdminGateForm from "../dogs/new/AdminGateForm";
import { unlockAdminGateAction } from "../dogs/new/actions";
import { initialAdminGateState } from "../dogs/new/form-state";
import { createShelterBlockoutAction, decideBookingAction, deleteShelterAvailabilityAction, sendShelterMessageAction, toggleShelterBlockoutDateAction, updateShelterOperatingDaysAction, updateShelterProfileAction } from "./actions";
import BookingQrScanner from "./BookingQrScanner";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Adopter = Database["public"]["Tables"]["adopters"]["Row"];
type Dog = Pick<Database["public"]["Tables"]["dogs"]["Row"], "breed" | "id" | "name">;
type Shelter = Pick<
  Database["public"]["Tables"]["shelters"]["Row"],
  | "address_line"
  | "description"
  | "district"
  | "email"
  | "facebook_url"
  | "google_maps_url"
  | "id"
  | "instagram_url"
  | "logo_url"
  | "meeting_instructions"
  | "name"
  | "phone_number"
  | "postal_code"
  | "province"
  | "subdistrict"
  | "website_url"
>;
type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];
type ShelterAvailability = {
  availability_type: Database["public"]["Enums"]["availability_type"];
  end_date: string;
  id: string;
  note: string | null;
  start_date: string;
};
type ShelterRegularHours = Database["public"]["Tables"]["shelter_regular_hours"]["Row"];
type ShelterAdminView = "profile" | "dogs" | "bookings" | "messages";
type VisitBucket = "upcoming" | "past" | "needs_follow_up" | "all";
type AppointmentMessage = {
  appointment_id: string;
  body: string;
  created_at: string;
  id: string;
  sender_label: string | null;
  sender_role: "adopter" | "shelter" | "system";
};

const WEEKDAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

const STATUS_OPTIONS: AppointmentStatus[] = [
  "requested",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];
const SHELTER_ADMIN_VIEWS: { label: string; value: ShelterAdminView }[] = [
  { label: "Shelter profile", value: "profile" },
  { label: "Dog listings", value: "dogs" },
  { label: "Booking visits", value: "bookings" },
  { label: "Messaging", value: "messages" },
];
const VISIT_BUCKETS: { label: string; value: VisitBucket }[] = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Needs follow-up", value: "needs_follow_up" },
  { label: "Past", value: "past" },
  { label: "All", value: "all" },
];

function formatTime(time: string) {
  return new Date(`1970-01-01T${time}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    weekday: "short",
    year: "numeric",
  });
}

function formatShortDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function shelterAddressParts(shelter: Shelter | undefined) {
  if (!shelter) return [];
  return [
    shelter.address_line,
    shelter.subdistrict,
    shelter.district,
    shelter.province,
    shelter.postal_code,
  ].filter(Boolean) as string[];
}

function shelterMapsUrl(shelter: Shelter | undefined) {
  if (shelter?.google_maps_url) return shelter.google_maps_url;
  const query = [shelter?.name, ...shelterAddressParts(shelter)].filter(Boolean).join(" ");
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
}

function parseCalendarMonth(month: string | undefined) {
  const value = month && /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7);
  const [year, monthIndex] = value.split("-").map(Number);
  return new Date(year, monthIndex - 1, 1);
}

function formatMonthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildCalendarDays(monthStart: Date) {
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - monthStart.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function fullName(adopter: Adopter | undefined) {
  return [adopter?.first_name, adopter?.last_name].filter(Boolean).join(" ") || "Unknown adopter";
}

function statusStyle(status: AppointmentStatus) {
  switch (status) {
    case "confirmed":
      return "bg-[#eaf6df] text-[#3f6f24]";
    case "completed":
      return "bg-[#e9f2ff] text-[#285f9d]";
    case "cancelled":
      return "bg-[#f7e3e1] text-[#9a3129]";
    case "no_show":
      return "bg-[#f1e7db] text-[#8a5825]";
    default:
      return "bg-[#fff1dc] text-[#a86a1f]";
  }
}

function decisionLabel(status: AppointmentStatus) {
  switch (status) {
    case "confirmed":
      return "Accepted";
    case "cancelled":
      return "Denied";
    case "completed":
      return "Completed";
    case "no_show":
      return "No show";
    default:
      return "Awaiting decision";
  }
}

function messageTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
}

function AdminNav() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link className="rounded-full border border-[#eadfce] bg-white px-5 py-2 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]" href="/admin">
        Create dog
      </Link>
      <Link className="rounded-full border border-[#eadfce] bg-white px-5 py-2 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]" href="/admin/listings">
        Manage listings
      </Link>
      <Link className="rounded-full bg-[#d38a2c] px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(179,111,31,0.22)]" href="/admin/bookings">
        Bookings
      </Link>
      <Link className="rounded-full border border-[#eadfce] bg-white px-5 py-2 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]" href="/admin/ads">
        Ads
      </Link>
    </div>
  );
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string; date?: string; message?: string; month?: string; shelter?: string; status?: string; view?: string; visit?: string }>;
}) {
  const gateOpen = await isAdminGateOpen();
  const resolvedSearchParams = await searchParams;

  if (!gateOpen) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <AdminGateForm
          action={unlockAdminGateAction}
          initialState={initialAdminGateState}
        />
      </div>
    );
  }

  const selectedStatus = STATUS_OPTIONS.includes(resolvedSearchParams?.status as AppointmentStatus)
    ? (resolvedSearchParams?.status as AppointmentStatus)
    : "";
  const selectedDate = resolvedSearchParams?.date ?? "";
  const selectedBookingCode = normalizeBookingCodeSearch(resolvedSearchParams?.code ?? "");
  const adminMessage = resolvedSearchParams?.message ?? "";
  const activeShelterView = SHELTER_ADMIN_VIEWS.some((view) => view.value === resolvedSearchParams?.view)
    ? (resolvedSearchParams?.view as ShelterAdminView)
    : "bookings";
  const activeVisitBucket = VISIT_BUCKETS.some((bucket) => bucket.value === resolvedSearchParams?.visit)
    ? (resolvedSearchParams?.visit as VisitBucket)
    : "upcoming";
  const calendarMonth = parseCalendarMonth(resolvedSearchParams?.month);
  const calendarMonthParam = formatMonthParam(calendarMonth);
  const previousCalendarMonth = new Date(calendarMonth);
  previousCalendarMonth.setMonth(previousCalendarMonth.getMonth() - 1);
  const nextCalendarMonth = new Date(calendarMonth);
  nextCalendarMonth.setMonth(nextCalendarMonth.getMonth() + 1);
  const admin = createAdminClient();
  const { data: baseShelters } = await admin
    .from("shelters")
    .select("id, name, phone_number, email, address_line, subdistrict, district, province, postal_code, website_url, facebook_url, instagram_url, description")
    .order("name", { ascending: true });
  const { data: extendedShelters } = await (admin as any)
    .from("shelters")
    .select("id, logo_url, google_maps_url, meeting_instructions")
    .order("name", { ascending: true });
  const extendedShelterMap = new Map(
    ((extendedShelters ?? []) as Partial<Shelter>[]).map((shelter) => [shelter.id, shelter]),
  );
  const allShelters = (baseShelters ?? []).map((shelter) => ({
    ...shelter,
    ...extendedShelterMap.get(shelter.id),
  }));
  const shelterTabs = (allShelters ?? []) as Shelter[];
  const selectedShelterId = shelterTabs.some((shelter) => shelter.id === resolvedSearchParams?.shelter)
    ? resolvedSearchParams?.shelter ?? ""
    : shelterTabs[0]?.id ?? "";
  const buildBookingsHref = ({
    code = selectedBookingCode,
    date = selectedDate,
    month = calendarMonthParam,
    shelter = selectedShelterId,
    status = selectedStatus,
    view = activeShelterView,
    visit = activeVisitBucket,
  }: {
    code?: string;
    date?: string;
    month?: string;
    shelter?: string;
    status?: string;
    view?: string;
    visit?: string;
  } = {}) => {
    const params = new URLSearchParams();
    if (code) params.set("code", code);
    if (date) params.set("date", date);
    if (shelter) params.set("shelter", shelter);
    if (status) params.set("status", status);
    if (month) params.set("month", month);
    if (view) params.set("view", view);
    if (visit) params.set("visit", visit);
    const query = params.toString();
    return query ? `/admin/bookings?${query}` : "/admin/bookings";
  };
  let appointmentsQuery = admin
    .from("appointments")
    .select("*")
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })
    .limit(selectedBookingCode ? 500 : 500);

  if (selectedStatus) {
    appointmentsQuery = appointmentsQuery.eq("status", selectedStatus);
  }

  if (selectedDate) {
    appointmentsQuery = appointmentsQuery.eq("appointment_date", selectedDate);
  }

  if (selectedShelterId) {
    appointmentsQuery = appointmentsQuery.eq("shelter_id", selectedShelterId);
  }

  const { data: appointments } = await appointmentsQuery;
  const rawAppointmentRows = selectedBookingCode
    ? (appointments ?? []).filter((appointment) => {
        const displayCode = appointment.booking_code ?? formatBookingCode(appointment.id);
        return displayCode.toUpperCase().startsWith(selectedBookingCode);
      })
    : appointments ?? [];
  const now = new Date();
  const upcomingAppointmentRows = rawAppointmentRows.filter((appointment) => !isPastAppointmentByTime(appointment, now));
  const pastAppointmentRows = rawAppointmentRows.filter((appointment) => isPastAppointmentByTime(appointment, now));
  const followUpAppointmentRows = rawAppointmentRows.filter((appointment) => appointmentFollowUpDue(appointment, now));
  const appointmentRows = activeShelterView !== "bookings" || selectedBookingCode || selectedDate || selectedStatus
    ? rawAppointmentRows
    : activeVisitBucket === "past"
      ? pastAppointmentRows
      : activeVisitBucket === "needs_follow_up"
        ? followUpAppointmentRows
        : activeVisitBucket === "all"
          ? rawAppointmentRows
          : upcomingAppointmentRows;
  const { data: messagingAppointments } = selectedShelterId
    ? await admin
        .from("appointments")
        .select("*")
        .eq("shelter_id", selectedShelterId)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: false })
        .limit(60)
    : { data: [] };
  const combinedAppointments = [...appointmentRows, ...((messagingAppointments ?? []) as Appointment[])];
  const adopterIds = [...new Set(combinedAppointments.map((appointment) => appointment.adopter_id))];
  const dogIds = [...new Set(combinedAppointments.map((appointment) => appointment.dog_id).filter(Boolean))] as string[];

  const [{ data: adopters }, { data: dogs }, { data: shelterDogs }, messagesResult] = await Promise.all([
    adopterIds.length
      ? admin.from("adopters").select("id, first_name, last_name, email, phone_number, verification_status").in("id", adopterIds)
      : Promise.resolve({ data: [] }),
    dogIds.length
      ? admin.from("dogs").select("id, name, breed").in("id", dogIds)
      : Promise.resolve({ data: [] }),
    selectedShelterId
      ? admin.from("dogs").select("id, name, breed, adoption_status, updated_at").eq("shelter_id", selectedShelterId).order("updated_at", { ascending: false }).limit(80)
      : Promise.resolve({ data: [] }),
    messagingAppointments?.length
      ? (admin as any)
          .from("appointment_messages")
          .select("id, appointment_id, sender_role, sender_label, body, created_at")
          .in("appointment_id", messagingAppointments.map((appointment) => appointment.id))
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);
  const messageRows = ((messagesResult as { data?: AppointmentMessage[]; error?: { message?: string } }).data ?? []) as AppointmentMessage[];
  const messagesByAppointment = new Map<string, AppointmentMessage[]>();
  for (const message of messageRows) {
    if (!messagesByAppointment.has(message.appointment_id)) {
      messagesByAppointment.set(message.appointment_id, []);
    }
    messagesByAppointment.get(message.appointment_id)!.push(message);
  }

  const adopterMap = new Map((adopters ?? []).map((adopter) => [adopter.id, adopter as Adopter]));
  const dogMap = new Map((dogs ?? []).map((dog) => [dog.id, dog as Dog]));
  const shelterMap = new Map(shelterTabs.map((shelter) => [shelter.id, shelter]));
  const activeShelter = shelterMap.get(selectedShelterId);
  const { data: availabilityData } = selectedShelterId
    ? await (admin as any)
        .from("shelter_availability")
        .select("id, availability_type, start_date, end_date, note")
        .eq("shelter_id", selectedShelterId)
        .order("start_date", { ascending: true })
    : { data: [] };
  const { data: regularHoursData } = selectedShelterId
    ? await admin
        .from("shelter_regular_hours")
        .select("*")
        .eq("shelter_id", selectedShelterId)
        .order("day_of_week", { ascending: true })
    : { data: [] };
  const unavailableRanges = ((availabilityData ?? []) as ShelterAvailability[]).filter(
    (range) => range.availability_type === "unavailable",
  );
  const singleDayBlockouts = new Map(
    unavailableRanges
      .filter((range) => range.start_date === range.end_date)
      .map((range) => [range.start_date, range]),
  );
  const regularHours = (regularHoursData ?? []) as ShelterRegularHours[];
  const regularHoursByDay = new Map(regularHours.map((hours) => [hours.day_of_week, hours]));
  const fallbackClosedDays = unavailableRanges
    .map((range) => range.note?.match(/^Recurring weekly closure:(\d)$/)?.[1])
    .filter(Boolean)
    .map(Number);
  const closedDays = new Set([
    ...regularHours.filter((hours) => hours.is_closed).map((hours) => hours.day_of_week),
    ...fallbackClosedDays,
  ]);
  const sampleOpenDay = regularHours.find((hours) => !hours.is_closed);
  const defaultOpensAt = sampleOpenDay?.opens_at?.slice(0, 5) ?? "09:00";
  const defaultClosesAt = sampleOpenDay?.closes_at?.slice(0, 5) ?? "17:00";
  const defaultSlotDuration = sampleOpenDay?.slot_duration_minutes ?? regularHours[0]?.slot_duration_minutes ?? 60;
  const calendarDays = buildCalendarDays(calendarMonth);
  const activeShelterAddress = shelterAddressParts(activeShelter);
  const activeShelterMapsUrl = shelterMapsUrl(activeShelter);
  const today = new Date().toISOString().slice(0, 10);
  const todaysCount = appointmentRows.filter((appointment) => appointment.appointment_date === today).length;
  const checkedInCount = appointmentRows.filter((appointment) => appointment.checked_in_at).length;

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#b77624]">
              PawJai Admin
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-[#4f4338]">Booking Management</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#74685d]">
              Track shelter visits, verify appointment QR codes, and update booking status from the local admin workspace.
            </p>
          </div>
          <AdminNav />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
            <div className="flex items-center gap-3 text-[#9a6b2a]">
              <CalendarDays size={20} />
              <p className="text-sm font-semibold">Visible bookings</p>
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#4f4338]">{appointmentRows.length}</p>
          </div>
          <div className="rounded-[24px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
            <div className="flex items-center gap-3 text-[#9a6b2a]">
              <Clock3 size={20} />
              <p className="text-sm font-semibold">Today</p>
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#4f4338]">{todaysCount}</p>
          </div>
          <div className="rounded-[24px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
            <div className="flex items-center gap-3 text-[#9a6b2a]">
              <ShieldCheck size={20} />
              <p className="text-sm font-semibold">Checked in</p>
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#4f4338]">{checkedInCount}</p>
          </div>
        </div>

        {adminMessage ? (
          <div className="mt-4 rounded-2xl border border-[#eadfce] bg-[#f8f0e5] px-5 py-3 text-sm font-semibold text-[#5b4d40]">
            {adminMessage}
          </div>
        ) : null}

        {shelterTabs.length > 0 ? (
          <div className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-3 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
            <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">
              Shelter
            </p>
            <div className="flex gap-2 overflow-x-auto">
              {shelterTabs.map((shelter) => {
                const active = shelter.id === selectedShelterId;
                return (
                  <Link
                    className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-[#d38a2c] text-white shadow-[0_10px_24px_rgba(179,111,31,0.22)]"
                        : "border border-[#eadfce] bg-[#fffdfa] text-[#5b4d40] hover:bg-[#faf4ec]"
                    }`}
                    href={buildBookingsHref({ shelter: shelter.id })}
                    key={shelter.id}
                  >
                    {shelter.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        {activeShelter ? (
          <div className="mt-4 rounded-[24px] border border-[#eadfce] bg-white p-3 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
            <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">
              {activeShelter.name} workspace
            </p>
            <div className="grid gap-2 md:grid-cols-4">
              {SHELTER_ADMIN_VIEWS.map((view) => {
                const active = activeShelterView === view.value;
                return (
                  <Link
                    className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold transition ${
                      active
                        ? "bg-[#5f5146] text-white shadow-[0_10px_24px_rgba(95,81,70,0.18)]"
                        : "border border-[#eadfce] bg-[#fffdfa] text-[#5b4d40] hover:bg-[#faf4ec]"
                    }`}
                    href={buildBookingsHref({ view: view.value })}
                    key={view.value}
                  >
                    {view.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        {activeShelterView === "bookings" ? (
        <div className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-3 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
          <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">
            Visit timing
          </p>
          <div className="grid gap-2 md:grid-cols-4">
            {VISIT_BUCKETS.map((bucket) => {
              const active = activeVisitBucket === bucket.value;
              const count = bucket.value === "past"
                ? pastAppointmentRows.length
                : bucket.value === "needs_follow_up"
                  ? followUpAppointmentRows.length
                  : bucket.value === "all"
                    ? rawAppointmentRows.length
                    : upcomingAppointmentRows.length;
              return (
                <Link
                  className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold transition ${
                    active
                      ? "bg-[#d38a2c] text-white shadow-[0_10px_24px_rgba(179,111,31,0.18)]"
                      : "border border-[#eadfce] bg-[#fffdfa] text-[#5b4d40] hover:bg-[#faf4ec]"
                  }`}
                  href={buildBookingsHref({ visit: bucket.value })}
                  key={bucket.value}
                >
                  {bucket.label} ({count})
                </Link>
              );
            })}
          </div>
          <p className="mt-3 px-2 text-xs leading-5 text-[#74685d]">
            Visits move to past 24 hours after their scheduled time. Needs follow-up highlights visits where staff should record the outcome.
          </p>
        </div>
        ) : null}

        {activeShelterView === "bookings" ? (
        <form className="mt-6 flex flex-col gap-3 rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-[0_16px_50px_rgba(128,92,46,0.08)] md:flex-row md:items-end">
          <input name="shelter" type="hidden" value={selectedShelterId} />
          <input name="view" type="hidden" value={activeShelterView} />
          <input name="visit" type="hidden" value={activeVisitBucket} />
          {selectedBookingCode ? <input name="code" type="hidden" value={selectedBookingCode} /> : null}
          <label className="flex-1">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Date</span>
            <input
              className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]"
              defaultValue={selectedDate}
              name="date"
              type="date"
            />
          </label>
          <label className="flex-1">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Status</span>
            <select
              className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]"
              defaultValue={selectedStatus}
              name="status"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d38a2c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#bf781f]" type="submit">
            <Search size={16} />
            Filter
          </button>
          <Link className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-white px-6 py-3 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]" href={buildBookingsHref({ code: "", date: "", status: "" })}>
            Reset
          </Link>
        </form>
        ) : null}

        {activeShelter && activeShelterView === "profile" ? (
          <section className="mt-6 rounded-[28px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7f72]">
                  Shelter profile
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#4f4338]">{activeShelter.name}</h2>
                <p className="mt-2 text-sm leading-6 text-[#74685d]">
                  This profile feeds the booking screens for meeting location, shelter contact, maps access, and future shelter-specific calendars.
                </p>
                <div className="mt-4 flex items-center gap-4 rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#eadfce] text-[#8d7f72]">
                    {activeShelter.logo_url ? (
                      <img alt={`${activeShelter.name} logo`} className="h-full w-full object-cover" src={activeShelter.logo_url} />
                    ) : (
                      <ImageIcon size={26} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#4f4338]">Shelter logo</p>
                    <p className="mt-1 text-xs leading-5 text-[#74685d]">
                      Paste a hosted PNG or JPG URL below. This is ready to show on appointment screens once the user UI uses the logo field.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl bg-[#f8f0e5] p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 text-[#9a6b2a]" size={18} />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Meeting at</p>
                        <p className="mt-1 text-base font-semibold text-[#4f4338]">{activeShelter.name}</p>
                        {activeShelterAddress.length > 0 ? (
                          <p className="mt-1 text-sm leading-6 text-[#74685d]">{activeShelterAddress.join(", ")}</p>
                        ) : (
                          <p className="mt-1 text-sm leading-6 text-[#74685d]">No address set yet.</p>
                        )}
                        {activeShelterMapsUrl ? (
                          <a
                            className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#c97580] hover:text-[#ad5f6a]"
                            href={activeShelterMapsUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Open Google Maps
                            <ExternalLink size={14} />
                          </a>
                        ) : null}
                        {activeShelter.meeting_instructions ? (
                          <p className="mt-2 text-xs leading-5 text-[#74685d]">{activeShelter.meeting_instructions}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#f8f0e5] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Shelter contact</p>
                    <div className="mt-3 grid gap-2 text-sm text-[#74685d]">
                      <p className="inline-flex items-center gap-2">
                        <Phone size={15} />
                        {activeShelter.phone_number || "No phone number set"}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <Mail size={15} />
                        {activeShelter.email || "No email set"}
                      </p>
                      {activeShelter.website_url ? (
                        <a
                          className="inline-flex items-center gap-2 font-semibold text-[#c97580] hover:text-[#ad5f6a]"
                          href={activeShelter.website_url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <Globe size={15} />
                          Shelter website
                        </a>
                      ) : (
                        <p className="inline-flex items-center gap-2">
                          <Globe size={15} />
                          No website set
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <form action={updateShelterProfileAction} className="grid gap-3" encType="multipart/form-data">
                <input name="shelterId" type="hidden" value={activeShelter.id} />
                <div className="grid gap-3 md:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Shelter name</span>
                    <input className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" defaultValue={activeShelter.name} name="name" required />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Phone</span>
                    <input className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" defaultValue={activeShelter.phone_number ?? ""} name="phoneNumber" />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Email</span>
                    <input className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" defaultValue={activeShelter.email ?? ""} name="email" type="email" />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Website</span>
                    <input className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" defaultValue={activeShelter.website_url ?? ""} name="websiteUrl" placeholder="https://example.org" />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Logo URL</span>
                    <input className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" defaultValue={activeShelter.logo_url ?? ""} name="logoUrl" placeholder="https://.../logo.png" />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Upload logo</span>
                    <input
                      accept="image/png,image/jpeg,image/webp"
                      className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-2.5 text-sm text-[#4f4338] file:mr-3 file:rounded-full file:border-0 file:bg-[#d38a2c] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-[#d38a2c]"
                      name="logoFile"
                      type="file"
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Google Maps URL</span>
                    <input className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" defaultValue={activeShelter.google_maps_url ?? ""} name="googleMapsUrl" placeholder="https://maps.google.com/..." />
                  </label>
                </div>

                <label>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Address</span>
                  <input className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" defaultValue={activeShelter.address_line ?? ""} name="addressLine" placeholder="Street address / meeting entrance" />
                </label>

                <div className="grid gap-3 md:grid-cols-4">
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Subdistrict</span>
                    <input className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" defaultValue={activeShelter.subdistrict ?? ""} name="subdistrict" />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">District</span>
                    <input className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" defaultValue={activeShelter.district ?? ""} name="district" />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Province</span>
                    <input className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" defaultValue={activeShelter.province ?? ""} name="province" />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Postal code</span>
                    <input className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" defaultValue={activeShelter.postal_code ?? ""} name="postalCode" />
                  </label>
                </div>

                <label>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Meeting instructions</span>
                  <textarea className="min-h-[76px] w-full resize-none rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" defaultValue={activeShelter.meeting_instructions ?? ""} name="meetingInstructions" placeholder="Gate, parking, front desk, or what visitors should say when they arrive" />
                </label>

                <label>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Internal profile note</span>
                  <textarea className="min-h-[92px] w-full resize-none rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" defaultValue={activeShelter.description ?? ""} name="description" placeholder="Meeting instructions, parking notes, or shelter context for staff" />
                </label>

                <input name="facebookUrl" type="hidden" value={activeShelter.facebook_url ?? ""} />
                <input name="instagramUrl" type="hidden" value={activeShelter.instagram_url ?? ""} />
                <button className="mt-1 inline-flex items-center justify-center rounded-full bg-[#d38a2c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#bf781f]" type="submit">
                  Save shelter profile
                </button>
              </form>
            </div>
          </section>
        ) : null}

        {activeShelter && activeShelterView === "profile" ? (
          <section className="mt-6 rounded-[28px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7f72]">Shelter calendar</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#4f4338]">Blockout dates</h2>
                <p className="mt-2 text-sm leading-6 text-[#74685d]">
                  Click dates to close or reopen one-off holidays. Set recurring closed weekdays for shelters that do not operate on weekends, Wednesdays, or other regular days.
                </p>
                <form action={updateShelterOperatingDaysAction} className="mt-5 rounded-2xl bg-[#fffdfa] p-4">
                  <input name="shelterId" type="hidden" value={activeShelter.id} />
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Weekly closed days</p>
                  <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {WEEKDAYS.map((day) => (
                      <label
                        className="cursor-pointer rounded-2xl border border-[#eadfce] bg-white px-3 py-3 text-center text-xs font-semibold text-[#5b4d40] has-[:checked]:border-[#c46f75] has-[:checked]:bg-[#c46f75] has-[:checked]:text-white"
                        key={day.value}
                      >
                        <input
                          className="sr-only"
                          defaultChecked={closedDays.has(day.value)}
                          name="closedDays"
                          type="checkbox"
                          value={day.value}
                        />
                        {day.label}
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <label>
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Opens</span>
                      <input className="w-full rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" defaultValue={defaultOpensAt} name="opensAt" type="time" />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Closes</span>
                      <input className="w-full rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" defaultValue={defaultClosesAt} name="closesAt" type="time" />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Slot minutes</span>
                      <input className="w-full rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" defaultValue={defaultSlotDuration} min="15" name="slotDuration" step="15" type="number" />
                    </label>
                  </div>
                  <button className="mt-4 w-full rounded-full bg-[#d38a2c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#bf781f]" type="submit">
                    Save weekly schedule
                  </button>
                </form>
              </div>

              <div>
                <div className="rounded-2xl bg-[#fffdfa] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfce] bg-white text-[#5b4d40] hover:bg-[#faf4ec]"
                      href={buildBookingsHref({ month: formatMonthParam(previousCalendarMonth) })}
                    >
                      <ChevronLeft size={18} />
                    </Link>
                    <p className="text-lg font-semibold text-[#4f4338]">
                      {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                    <Link
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfce] bg-white text-[#5b4d40] hover:bg-[#faf4ec]"
                      href={buildBookingsHref({ month: formatMonthParam(nextCalendarMonth) })}
                    >
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                  <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#8d7f72]">
                    {WEEKDAYS.map((day) => (
                      <span key={day.value}>{day.label}</span>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-7 gap-2">
                    {calendarDays.map((date) => {
                      const dateKey = isoDate(date);
                      const inMonth = date.getMonth() === calendarMonth.getMonth();
                      const recurringClosed = closedDays.has(date.getDay());
                      const blockout = singleDayBlockouts.get(dateKey);
                      const isClosed = recurringClosed || Boolean(blockout);
                      return (
                        <form action={toggleShelterBlockoutDateAction} key={dateKey}>
                          <input name="shelterId" type="hidden" value={activeShelter.id} />
                          <input name="date" type="hidden" value={dateKey} />
                          <input name="availabilityId" type="hidden" value={blockout?.id ?? ""} />
                          <button
                            className={`flex aspect-square w-full items-center justify-center rounded-xl border text-sm font-semibold transition ${
                              isClosed
                                ? "border-[#65584f] bg-[#65584f] text-white"
                                : "border-[#eadfce] bg-white text-[#5b4d40] hover:bg-[#faf4ec]"
                            } ${inMonth ? "" : "opacity-35"} ${recurringClosed ? "cursor-not-allowed" : ""}`}
                            disabled={recurringClosed}
                            title={recurringClosed ? "Recurring closed day" : blockout ? "Click to reopen this date" : "Click to block this date"}
                            type="submit"
                          >
                            {date.getDate()}
                          </button>
                        </form>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#74685d]">
                    <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#65584f]" /> Closed</span>
                    <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded border border-[#eadfce] bg-white" /> Open</span>
                  </div>
                </div>

                <form action={createShelterBlockoutAction} className="mt-4 grid gap-3 rounded-2xl bg-[#fffdfa] p-4 md:grid-cols-[1fr_1fr_minmax(0,1.3fr)_auto] md:items-end">
                  <input name="shelterId" type="hidden" value={activeShelter.id} />
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">From</span>
                    <input className="w-full rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" name="startDate" required type="date" />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">To</span>
                    <input className="w-full rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" name="endDate" type="date" />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Reason</span>
                    <input className="w-full rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]" name="note" placeholder="Holiday, staff training, fully booked" />
                  </label>
                  <button className="rounded-full bg-[#d38a2c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#bf781f]" type="submit">
                    Add
                  </button>
                </form>

                <div className="mt-4 grid gap-2">
                  {unavailableRanges.length > 0 ? (
                    unavailableRanges.map((range) => (
                      <div className="flex flex-col gap-3 rounded-2xl border border-[#eadfce] bg-white px-4 py-3 md:flex-row md:items-center md:justify-between" key={range.id}>
                        <div>
                          <p className="text-sm font-semibold text-[#4f4338]">
                            {formatShortDate(range.start_date)}
                            {range.end_date !== range.start_date ? ` - ${formatShortDate(range.end_date)}` : ""}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#74685d]">
                            {range.note?.startsWith("Recurring weekly closure:")
                              ? "Weekly closure"
                              : range.note || "Unavailable"}
                          </p>
                        </div>
                        <form action={deleteShelterAvailabilityAction}>
                          <input name="shelterId" type="hidden" value={activeShelter.id} />
                          <input name="availabilityId" type="hidden" value={range.id} />
                          <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eadfce] bg-white px-4 py-2 text-xs font-semibold text-[#9a3129] hover:bg-[#fff6f4]" type="submit">
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </form>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#eadfce] bg-[#fffdfa] px-4 py-5 text-sm text-[#74685d]">
                      No blockout dates set for {activeShelter.name}.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeShelter && activeShelterView === "dogs" ? (
          <section className="mt-6 rounded-[28px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7f72]">Dog listings</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#4f4338]">{activeShelter.name} dogs</h2>
                <p className="mt-2 text-sm leading-6 text-[#74685d]">
                  Shelter-facing list of dogs attached to this shelter. Founder admin can still use the global listing page for the full database.
                </p>
              </div>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d38a2c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#bf781f]"
                href={`/admin?shelter=${activeShelter.id}`}
              >
                <PawPrint size={16} />
                Create dog for shelter
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              {(shelterDogs ?? []).length > 0 ? (
                (shelterDogs ?? []).map((dog) => (
                  <div className="flex flex-col gap-3 rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4 md:flex-row md:items-center md:justify-between" key={dog.id}>
                    <div>
                      <p className="text-lg font-semibold text-[#4f4338]">{dog.name}</p>
                      <p className="mt-1 text-sm text-[#74685d]">{dog.breed || "Breed not set"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                        dog.adoption_status === "available"
                          ? "bg-[#eaf6df] text-[#3f6f24]"
                          : dog.adoption_status === "adopted"
                            ? "bg-[#f7e3e1] text-[#9a3129]"
                            : "bg-[#fff1dc] text-[#a86a1f]"
                      }`}>
                        {dog.adoption_status}
                      </span>
                      <Link
                        className="rounded-full border border-[#eadfce] bg-white px-4 py-2 text-xs font-semibold text-[#5b4d40] hover:bg-[#faf4ec]"
                        href={`/admin/dogs/${dog.id}/edit`}
                      >
                        Edit listing
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#eadfce] bg-[#fffdfa] p-6 text-sm text-[#74685d]">
                  No dog listings are attached to {activeShelter.name} yet.
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeShelter && activeShelterView === "messages" ? (
          <section className="mt-6 rounded-[28px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7f72]">Messaging</p>
              <h2 className="text-2xl font-semibold text-[#4f4338]">{activeShelter.name} visitor conversations</h2>
              <p className="max-w-3xl text-sm leading-6 text-[#74685d]">
                Appointment-scoped shelter messaging. Staff can answer visit questions from the booking context, while PawJai admin can still see the whole picture.
              </p>
            </div>
            <div className="mt-5 grid gap-4">
              {((messagingAppointments ?? []) as Appointment[]).length > 0 ? (
                ((messagingAppointments ?? []) as Appointment[]).map((appointment) => {
                  const adopter = adopterMap.get(appointment.adopter_id);
                  const dog = appointment.dog_id ? dogMap.get(appointment.dog_id) : null;
                  const threadMessages = messagesByAppointment.get(appointment.id) ?? [];
                  const latestMessage = threadMessages[threadMessages.length - 1];
                  return (
                    <div className="grid gap-4 rounded-[24px] border border-[#eadfce] bg-[#fffdfa] p-4 lg:grid-cols-[320px_minmax(0,1fr)]" key={appointment.id}>
                      <div className="rounded-2xl bg-white p-4">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="text-[#9a6b2a]" size={18} />
                          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5825]">
                            {appointment.booking_code ?? formatBookingCode(appointment.id)}
                          </span>
                        </div>
                        <p className="mt-3 text-lg font-semibold text-[#4f4338]">{fullName(adopter)}</p>
                        <p className="text-sm text-[#74685d]">{adopter?.email ?? "No email"}</p>
                        <p className="mt-2 text-sm font-semibold text-[#4f4338]">
                          {dog?.name ?? "Shelter visit"}
                        </p>
                        <p className="text-sm text-[#74685d]">
                          {formatDate(appointment.appointment_date)} at {formatTime(appointment.appointment_time)}
                        </p>
                        {latestMessage ? (
                          <p className="mt-3 text-xs leading-5 text-[#74685d]">
                            Latest: {messageTimestamp(latestMessage.created_at)}
                          </p>
                        ) : (
                          <p className="mt-3 text-xs leading-5 text-[#74685d]">
                            No messages yet. Send a first note if the visitor needs instructions.
                          </p>
                        )}
                        <Link
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#eadfce] bg-white px-4 py-2 text-xs font-semibold text-[#5b4d40] hover:bg-[#faf4ec]"
                          href={`/admin/bookings/${appointment.id}`}
                        >
                          <ExternalLink size={14} />
                          Open booking
                        </Link>
                      </div>
                      <div className="flex min-h-[260px] flex-col rounded-2xl bg-white p-4">
                        <div className="flex-1 space-y-3 overflow-y-auto">
                          {threadMessages.length > 0 ? (
                            threadMessages.slice(-6).map((message) => {
                              const fromShelter = message.sender_role === "shelter";
                              return (
                                <div className={`flex ${fromShelter ? "justify-end" : "justify-start"}`} key={message.id}>
                                  <div
                                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                                      fromShelter
                                        ? "bg-[#c46f75] text-white"
                                        : "bg-[#f8f0e5] text-[#5b4d40]"
                                    }`}
                                  >
                                    <p>{message.body}</p>
                                    <p className={`mt-1 text-[11px] ${fromShelter ? "text-white/70" : "text-[#74685d]/65"}`}>
                                      {message.sender_label ?? (fromShelter ? "Shelter" : "Visitor")} · {messageTimestamp(message.created_at)}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#eadfce] bg-[#fffdfa] p-6 text-center text-sm leading-6 text-[#74685d]">
                              No conversation yet for this booking.
                            </div>
                          )}
                        </div>
                        <form action={sendShelterMessageAction} className="mt-4 flex gap-2">
                          <input name="appointmentId" type="hidden" value={appointment.id} />
                          <input name="shelterId" type="hidden" value={activeShelter.id} />
                          <input
                            className="min-w-0 flex-1 rounded-full border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]"
                            name="body"
                            placeholder="Write a shelter reply..."
                          />
                          <button className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#d38a2c] text-white hover:bg-[#bf781f]" type="submit">
                            <Send size={17} />
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-[#eadfce] bg-[#fffdfa] p-6 text-sm text-[#74685d]">
                  No booking conversations for {activeShelter.name} yet.
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeShelterView === "bookings" ? (
        <>
        <form className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
          <input name="shelter" type="hidden" value={selectedShelterId} />
          <input name="view" type="hidden" value={activeShelterView} />
          <input name="visit" type="hidden" value={activeVisitBucket} />
          {selectedDate ? <input name="date" type="hidden" value={selectedDate} /> : null}
          {selectedStatus ? <input name="status" type="hidden" value={selectedStatus} /> : null}
          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">
              Search booking code
            </span>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                className="min-w-0 flex-1 rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#4f4338] outline-none focus:border-[#d38a2c]"
                defaultValue={selectedBookingCode}
                name="code"
                placeholder="APT-FA5C9"
              />
              <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d38a2c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#bf781f]" type="submit">
                <Search size={16} />
                Search code
              </button>
              {selectedBookingCode ? (
                <Link
                  className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-white px-6 py-3 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]"
                  href={buildBookingsHref({ code: "" })}
                >
                  Clear
                </Link>
              ) : null}
            </div>
          </label>
          <p className="mt-3 text-xs leading-5 text-[#74685d]">
            Type the visitor booking ID from their appointment card or QR screen.
          </p>
        </form>

        <div className="mt-4">
          <BookingQrScanner />
        </div>

        <div className="mt-6 space-y-4">
          {appointmentRows.length === 0 ? (
            <div className="rounded-[28px] border border-[#eadfce] bg-white p-8 text-center shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
              <p className="text-xl font-semibold text-[#4f4338]">No bookings match this view.</p>
              <p className="mt-2 text-sm text-[#74685d]">Try clearing filters or choosing a different date.</p>
            </div>
          ) : (
            appointmentRows.map((appointment: Appointment) => {
              const adopter = adopterMap.get(appointment.adopter_id);
              const dog = appointment.dog_id ? dogMap.get(appointment.dog_id) : null;
              const shelter = shelterMap.get(appointment.shelter_id);
              const checkedIn = Boolean(appointment.checked_in_at);
              const followUpDue = appointmentFollowUpDue(appointment, now);
              return (
                <section
                  className="rounded-[28px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_50px_rgba(128,92,46,0.08)]"
                  key={appointment.id}
                >
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${statusStyle(appointment.status)}`}>
                          {appointment.status.replace("_", " ")}
                        </span>
                        {checkedIn ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf6df] px-3 py-1 text-xs font-bold text-[#3f6f24]">
                            <CheckCircle2 size={14} />
                            Checked in
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#f7ecda] px-3 py-1 text-xs font-bold text-[#8a5825]">
                          <QrCode size={14} />
                          {appointment.booking_code ?? formatBookingCode(appointment.id)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Visit</p>
                          <p className="mt-1 text-lg font-semibold text-[#4f4338]">{formatDate(appointment.appointment_date)}</p>
                          <p className="text-sm text-[#74685d]">{formatTime(appointment.appointment_time)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Adopter</p>
                          <p className="mt-1 text-lg font-semibold text-[#4f4338]">{fullName(adopter)}</p>
                          <p className="text-sm text-[#74685d]">{adopter?.email ?? "No email"}</p>
                          <p className="text-sm text-[#74685d]">{adopter?.phone_number ?? "No phone"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Dog and Shelter</p>
                          <p className="mt-1 text-lg font-semibold text-[#4f4338]">
                            {dog ? `${dog.name}${dog.breed ? ` - ${dog.breed}` : ""}` : "Shelter visit"}
                          </p>
                          <p className="text-sm text-[#74685d]">{shelter?.name ?? "Unknown shelter"}</p>
                          <p className="text-sm text-[#74685d]">{[shelter?.district, shelter?.province].filter(Boolean).join(", ")}</p>
                        </div>
                      </div>

                      {appointment.visitor_note ? (
                        <div className="mt-4 rounded-2xl bg-[#f8f0e5] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Visitor note</p>
                          <p className="mt-1 text-sm leading-6 text-[#5b4d40]">{appointment.visitor_note}</p>
                        </div>
                      ) : null}
                    </div>

                    <form action={decideBookingAction} className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4">
                      <input name="appointmentId" type="hidden" value={appointment.id} />
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Status</p>
                        <p className="mt-1 text-lg font-semibold text-[#4f4338]">{decisionLabel(appointment.status)}</p>
                        {appointment.shelter_note ? (
                          <p className="mt-2 text-sm leading-6 text-[#74685d]">{appointment.shelter_note}</p>
                        ) : null}
                        {(appointment as any).proposed_appointment_date && (appointment as any).proposed_appointment_time ? (
                          <p className="mt-2 rounded-xl bg-[#fff1dc] px-3 py-2 text-xs font-semibold text-[#8a5825]">
                            Proposed: {formatDate((appointment as any).proposed_appointment_date)} at {formatTime(normalizeAppointmentTime((appointment as any).proposed_appointment_time))}
                          </p>
                        ) : null}
                      </div>

                      <label className="mt-3 block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">
                          Shelter note
                        </span>
                        <textarea
                          className="min-h-[92px] w-full resize-none rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]"
                          defaultValue={appointment.shelter_note ?? ""}
                          name="shelterNote"
                          placeholder="Optional note for denial, date change, or staff context"
                        />
                      </label>
                      {appointment.status === "requested" ? (
                        <div className="mt-3 grid gap-2">
                          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-3">
                            <label className="block">
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8d7f72]">New date</span>
                              <input
                                className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]"
                                defaultValue={(appointment as any).proposed_appointment_date ?? appointment.appointment_date}
                                min={new Date().toISOString().slice(0, 10)}
                                name="proposedAppointmentDate"
                                type="date"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8d7f72]">New time</span>
                              <select
                                className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]"
                                defaultValue={normalizeAppointmentTime((appointment as any).proposed_appointment_time ?? appointment.appointment_time)}
                                name="proposedAppointmentTime"
                              >
                                {APPOINTMENT_TIME_SLOTS.map((slot) => (
                                  <option key={slot} value={slot}>{slot}</option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <button
                            className="w-full rounded-full bg-[#3f7b35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#356b2d]"
                            name="decision"
                            type="submit"
                            value="accept"
                          >
                            Accept booking
                          </button>
                          <button
                            className="w-full rounded-full bg-[#c46f75] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ae5e64]"
                            name="decision"
                            type="submit"
                            value="deny"
                          >
                            Deny booking
                          </button>
                          <button
                            className="w-full rounded-full border border-[#d8c7ab] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]"
                            name="decision"
                            type="submit"
                            value="request_change"
                          >
                            Ask to change date/time
                          </button>
                        </div>
                      ) : (
                        <details className="mt-3 rounded-2xl border border-[#eadfce] bg-white p-3">
                          <summary className="cursor-pointer text-sm font-semibold text-[#5b4d40]">
                            Edit decision
                          </summary>
                          <div className="mt-3 grid gap-2">
                            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#fffaf3] p-3">
                              <label className="block">
                                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8d7f72]">New date</span>
                                <input
                                  className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]"
                                  defaultValue={(appointment as any).proposed_appointment_date ?? appointment.appointment_date}
                                  min={new Date().toISOString().slice(0, 10)}
                                  name="proposedAppointmentDate"
                                  type="date"
                                />
                              </label>
                              <label className="block">
                                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8d7f72]">New time</span>
                                <select
                                  className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]"
                                  defaultValue={normalizeAppointmentTime((appointment as any).proposed_appointment_time ?? appointment.appointment_time)}
                                  name="proposedAppointmentTime"
                                >
                                  {APPOINTMENT_TIME_SLOTS.map((slot) => (
                                    <option key={slot} value={slot}>{slot}</option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <button
                              className="w-full rounded-full bg-[#3f7b35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#356b2d]"
                              name="decision"
                              type="submit"
                              value="accept"
                            >
                              Mark accepted
                            </button>
                            <button
                              className="w-full rounded-full bg-[#c46f75] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ae5e64]"
                              name="decision"
                              type="submit"
                              value="deny"
                            >
                              Mark denied
                            </button>
                            <button
                              className="w-full rounded-full border border-[#d8c7ab] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]"
                              name="decision"
                              type="submit"
                              value="request_change"
                            >
                              Ask to change date/time
                            </button>
                          </div>
                        </details>
                      )}
                      {followUpDue ? (
                        <div className="mt-3 rounded-2xl border border-[#eadfce] bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">
                            Post-visit outcome
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#74685d]">
                            This visit is more than 24 hours old. Record whether the visit happened or the dog was adopted.
                          </p>
                          <div className="mt-3 grid gap-2">
                            <button
                              className="w-full rounded-full bg-[#65584f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#50443b]"
                              name="decision"
                              type="submit"
                              value="complete"
                            >
                              Mark visit completed
                            </button>
                            <button
                              className="w-full rounded-full border border-[#d8c7ab] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]"
                              name="decision"
                              type="submit"
                              value="no_show"
                            >
                              Visitor did not show
                            </button>
                            {appointment.dog_id ? (
                              <button
                                className="w-full rounded-full bg-[#3f7b35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#356b2d]"
                                name="decision"
                                type="submit"
                                value="adopted"
                              >
                                Mark dog adopted
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                      <Link
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#eadfce] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]"
                        href={`/admin/bookings/${appointment.id}/visitor-profile`}
                      >
                        <ExternalLink size={16} />
                        Open visitor profile
                      </Link>
                      <Link
                        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#eadfce] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]"
                        href={`/admin/bookings/${appointment.id}`}
                      >
                        <ExternalLink size={16} />
                        Open booking detail
                      </Link>
                    </form>
                  </div>
                </section>
              );
            })
          )}
        </div>
        </>
        ) : null}
      </div>
    </div>
  );
}
