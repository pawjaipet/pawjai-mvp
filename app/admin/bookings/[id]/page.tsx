import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink, QrCode, ShieldCheck } from "lucide-react";
import type { Database } from "@/types/database";
import { formatBookingCode } from "@/utils/booking";
import { isAdminGateOpen } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";
import AdminGateForm from "../../dogs/new/AdminGateForm";
import { unlockAdminGateAction } from "../../dogs/new/actions";
import { initialAdminGateState } from "../../dogs/new/form-state";
import { checkInBookingAction, decideBookingAction } from "../actions";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Adopter = Database["public"]["Tables"]["adopters"]["Row"];
type Dog = Pick<Database["public"]["Tables"]["dogs"]["Row"], "breed" | "id" | "name">;
type Shelter = Pick<Database["public"]["Tables"]["shelters"]["Row"], "district" | "id" | "name" | "phone_number" | "province">;

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    weekday: "short",
    year: "numeric",
  });
}

function formatTime(time: string) {
  return new Date(`1970-01-01T${time}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function fullName(adopter: Adopter | null) {
  return [adopter?.first_name, adopter?.last_name].filter(Boolean).join(" ") || "Unknown adopter";
}

function statusClass(status: string) {
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

function decisionLabel(status: string) {
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

function InfoBlock({
  label,
  secondary,
  value,
}: {
  label: string;
  secondary?: string | null;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#4f4338]">{value}</p>
      {secondary ? <p className="text-sm text-[#74685d]">{secondary}</p> : null}
    </div>
  );
}

export default async function AdminBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ checkedIn?: string; token?: string }>;
}) {
  const gateOpen = await isAdminGateOpen();
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams?.token ?? "";

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

  const admin = createAdminClient();
  const { data: appointment } = await admin
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!appointment) {
    notFound();
  }

  const typedAppointment = appointment as Appointment;
  const [{ data: adopter }, { data: dog }, { data: shelter }] = await Promise.all([
    admin
      .from("adopters")
      .select("id, first_name, last_name, email, phone_number, verification_status")
      .eq("id", typedAppointment.adopter_id)
      .maybeSingle(),
    typedAppointment.dog_id
      ? admin.from("dogs").select("id, name, breed").eq("id", typedAppointment.dog_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("shelters")
      .select("id, name, phone_number, district, province")
      .eq("id", typedAppointment.shelter_id)
      .maybeSingle(),
  ]);

  const typedAdopter = adopter as Adopter | null;
  const typedDog = dog as Dog | null;
  const typedShelter = shelter as Shelter | null;
  const bookingCode = typedAppointment.booking_code ?? formatBookingCode(typedAppointment.id);
  const checkedIn = Boolean(typedAppointment.checked_in_at);

  return (
    <div className="min-h-screen bg-[#fffaf3] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#b77624]">
              PawJai Admin
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-[#4f4338]">Booking Detail</h1>
            <p className="mt-2 text-sm text-[#74685d]">
              {bookingCode} · {formatDate(typedAppointment.appointment_date)} at {formatTime(typedAppointment.appointment_time)}
            </p>
          </div>
          <Link className="rounded-full border border-[#eadfce] bg-white px-5 py-2 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]" href="/admin/bookings">
            Booking list
          </Link>
        </div>

        {resolvedSearchParams?.checkedIn === "1" || checkedIn ? (
          <div className="mb-5 flex items-center gap-3 rounded-[24px] border border-[#cfe4c5] bg-[#f2faee] px-5 py-4 text-[#3f6f24]">
            <CheckCircle2 size={22} />
            <p className="text-sm font-semibold">
              Visitor checked in{typedAppointment.checked_in_at ? ` at ${new Date(typedAppointment.checked_in_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : ""}.
            </p>
          </div>
        ) : null}

        <section className="rounded-[28px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${statusClass(typedAppointment.status)}`}>
                  {typedAppointment.status.replace("_", " ")}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f7ecda] px-3 py-1 text-xs font-bold text-[#8a5825]">
                  <QrCode size={14} />
                  {bookingCode}
                </span>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-3">
                <InfoBlock
                  label="Visit"
                  secondary={formatTime(typedAppointment.appointment_time)}
                  value={formatDate(typedAppointment.appointment_date)}
                />
                <InfoBlock
                  label="Adopter"
                  secondary={[typedAdopter?.email, typedAdopter?.phone_number].filter(Boolean).join(" · ")}
                  value={fullName(typedAdopter)}
                />
                <InfoBlock
                  label="Dog and Shelter"
                  secondary={typedShelter?.name ?? "Unknown shelter"}
                  value={typedDog ? `${typedDog.name}${typedDog.breed ? ` - ${typedDog.breed}` : ""}` : "Shelter visit"}
                />
              </div>

              {typedAppointment.visitor_note ? (
                <div className="mt-5 rounded-2xl bg-[#f8f0e5] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Visitor note</p>
                  <p className="mt-1 text-sm leading-6 text-[#5b4d40]">{typedAppointment.visitor_note}</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4">
              <form action={decideBookingAction}>
                <input name="appointmentId" type="hidden" value={typedAppointment.id} />
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Status</p>
                  <p className="mt-1 text-lg font-semibold text-[#4f4338]">{decisionLabel(typedAppointment.status)}</p>
                  {typedAppointment.shelter_note ? (
                    <p className="mt-2 text-sm leading-6 text-[#74685d]">{typedAppointment.shelter_note}</p>
                  ) : null}
                </div>
                <label className="mt-3 block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">
                    Shelter note
                  </span>
                  <textarea
                    className="min-h-[92px] w-full resize-none rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]"
                    defaultValue={typedAppointment.shelter_note ?? ""}
                    name="shelterNote"
                    placeholder="Optional note for denial, date change, or staff context"
                  />
                </label>
                <details className="mt-3 rounded-2xl border border-[#eadfce] bg-white p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-[#5b4d40]">
                    Edit decision
                  </summary>
                  <div className="mt-3 grid gap-2">
                    <button className="w-full rounded-full bg-[#3f7b35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#356b2d]" name="decision" type="submit" value="accept">
                      Mark accepted
                    </button>
                    <button className="w-full rounded-full bg-[#c46f75] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ae5e64]" name="decision" type="submit" value="deny">
                      Mark denied
                    </button>
                    <button className="w-full rounded-full border border-[#d8c7ab] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]" name="decision" type="submit" value="request_change">
                      Ask to change date/time
                    </button>
                  </div>
                </details>
              </form>

              {token ? (
                <form action={checkInBookingAction} className="mt-3 rounded-2xl border border-[#eadfce] bg-white p-3">
                  <input name="token" type="hidden" value={token} />
                  <div className="flex items-center gap-2 text-[#3f6f24]">
                    <ShieldCheck size={18} />
                    <p className="text-sm font-semibold text-[#4f4338]">QR check-in</p>
                  </div>
                  <textarea
                    className="mt-3 min-h-[82px] w-full resize-none rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]"
                    defaultValue={typedAppointment.check_in_note ?? ""}
                    name="checkInNote"
                    placeholder="Optional check-in note"
                  />
                  <button className="mt-3 w-full rounded-full bg-[#d38a2c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#bf781f] disabled:cursor-not-allowed disabled:opacity-55" disabled={checkedIn} type="submit">
                    {checkedIn ? "Already checked in" : "Confirm check-in"}
                  </button>
                </form>
              ) : null}

              <Link
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#eadfce] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]"
                href={`/admin/bookings/${typedAppointment.id}/visitor-profile`}
              >
                <ExternalLink size={16} />
                Open visitor profile
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
