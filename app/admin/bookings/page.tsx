import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, ExternalLink, QrCode, Search, ShieldCheck } from "lucide-react";
import type { Database } from "@/types/database";
import { formatBookingCode, normalizeBookingCodeSearch } from "@/utils/booking";
import { isAdminGateOpen } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";
import AdminGateForm from "../dogs/new/AdminGateForm";
import { unlockAdminGateAction } from "../dogs/new/actions";
import { initialAdminGateState } from "../dogs/new/form-state";
import { decideBookingAction } from "./actions";
import BookingQrScanner from "./BookingQrScanner";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Adopter = Database["public"]["Tables"]["adopters"]["Row"];
type Dog = Pick<Database["public"]["Tables"]["dogs"]["Row"], "breed" | "id" | "name">;
type Shelter = Pick<Database["public"]["Tables"]["shelters"]["Row"], "district" | "id" | "name" | "phone_number" | "province">;
type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

const STATUS_OPTIONS: AppointmentStatus[] = [
  "requested",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
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
  searchParams?: Promise<{ code?: string; date?: string; shelter?: string; status?: string }>;
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
  const admin = createAdminClient();
  const { data: allShelters } = await admin
    .from("shelters")
    .select("id, name, phone_number, district, province")
    .order("name", { ascending: true });
  const shelterTabs = (allShelters ?? []) as Shelter[];
  const selectedShelterId = shelterTabs.some((shelter) => shelter.id === resolvedSearchParams?.shelter)
    ? resolvedSearchParams?.shelter ?? ""
    : shelterTabs[0]?.id ?? "";
  const buildBookingsHref = ({
    code = selectedBookingCode,
    date = selectedDate,
    shelter = selectedShelterId,
    status = selectedStatus,
  }: {
    code?: string;
    date?: string;
    shelter?: string;
    status?: string;
  } = {}) => {
    const params = new URLSearchParams();
    if (code) params.set("code", code);
    if (date) params.set("date", date);
    if (shelter) params.set("shelter", shelter);
    if (status) params.set("status", status);
    const query = params.toString();
    return query ? `/admin/bookings?${query}` : "/admin/bookings";
  };
  let appointmentsQuery = admin
    .from("appointments")
    .select("*")
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })
    .limit(selectedBookingCode ? 500 : 80);

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
  const appointmentRows = selectedBookingCode
    ? (appointments ?? []).filter((appointment) => {
        const displayCode = appointment.booking_code ?? formatBookingCode(appointment.id);
        return displayCode.toUpperCase().startsWith(selectedBookingCode);
      })
    : appointments ?? [];
  const adopterIds = [...new Set(appointmentRows.map((appointment) => appointment.adopter_id))];
  const dogIds = [...new Set(appointmentRows.map((appointment) => appointment.dog_id).filter(Boolean))] as string[];

  const [{ data: adopters }, { data: dogs }] = await Promise.all([
    adopterIds.length
      ? admin.from("adopters").select("id, first_name, last_name, email, phone_number, verification_status").in("id", adopterIds)
      : Promise.resolve({ data: [] }),
    dogIds.length
      ? admin.from("dogs").select("id, name, breed").in("id", dogIds)
      : Promise.resolve({ data: [] }),
  ]);

  const adopterMap = new Map((adopters ?? []).map((adopter) => [adopter.id, adopter as Adopter]));
  const dogMap = new Map((dogs ?? []).map((dog) => [dog.id, dog as Dog]));
  const shelterMap = new Map(shelterTabs.map((shelter) => [shelter.id, shelter]));
  const activeShelter = shelterMap.get(selectedShelterId);
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

        <form className="mt-6 flex flex-col gap-3 rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-[0_16px_50px_rgba(128,92,46,0.08)] md:flex-row md:items-end">
          <input name="shelter" type="hidden" value={selectedShelterId} />
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

        {activeShelter ? (
          <div className="mt-4 rounded-[20px] bg-[#f8f0e5] px-5 py-4">
            <p className="text-sm font-semibold text-[#4f4338]">{activeShelter.name}</p>
            <p className="mt-1 text-sm text-[#74685d]">
              {[activeShelter.district, activeShelter.province].filter(Boolean).join(", ") || "No location set"}
              {activeShelter.phone_number ? ` · ${activeShelter.phone_number}` : ""}
            </p>
          </div>
        ) : null}

        <form className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
          <input name="shelter" type="hidden" value={selectedShelterId} />
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
      </div>
    </div>
  );
}
