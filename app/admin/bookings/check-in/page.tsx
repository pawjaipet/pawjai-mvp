import Link from "next/link";
import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import type { Database } from "@/types/database";
import { formatBookingCode, hashCheckInToken } from "@/utils/booking";
import { isAdminGateOpen } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";
import AdminGateForm from "../../dogs/new/AdminGateForm";
import { unlockAdminGateAction } from "../../dogs/new/actions";
import { initialAdminGateState } from "../../dogs/new/form-state";
import { checkInBookingAction } from "../actions";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Adopter = Database["public"]["Tables"]["adopters"]["Row"];
type Dog = Pick<Database["public"]["Tables"]["dogs"]["Row"], "breed" | "id" | "name">;
type Shelter = Pick<Database["public"]["Tables"]["shelters"]["Row"], "district" | "id" | "name" | "phone_number" | "province">;

function formatDateTime(date: string, time: string) {
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  });
  const timeLabel = new Date(`1970-01-01T${time}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dateLabel} at ${timeLabel}`;
}

function fullName(adopter: Adopter | null) {
  return [adopter?.first_name, adopter?.last_name].filter(Boolean).join(" ") || "Unknown adopter";
}

function InfoBlock({
  label,
  value,
  secondary,
}: {
  label: string;
  secondary?: string | null;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#4f4338]">{value}</p>
      {secondary ? <p className="mt-1 text-sm text-[#74685d]">{secondary}</p> : null}
    </div>
  );
}

export default async function AdminBookingCheckInPage({
  searchParams,
}: {
  searchParams?: Promise<{ checkedIn?: string; invalid?: string; token?: string }>;
}) {
  const gateOpen = await isAdminGateOpen();
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

  if (!token || resolvedSearchParams?.invalid === "1") {
    return (
      <div className="min-h-screen bg-[#fffaf3] px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-[#f1c4c0] bg-white p-8 text-center shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
          <ShieldAlert className="mx-auto text-[#9a3129]" size={42} />
          <h1 className="mt-4 text-3xl font-semibold text-[#4f4338]">Booking QR not recognized</h1>
          <p className="mt-3 text-sm leading-6 text-[#74685d]">
            This code is missing, expired, or does not match a PawJai booking record.
          </p>
          <Link className="mt-6 inline-flex rounded-full bg-[#d38a2c] px-6 py-3 text-sm font-semibold text-white" href="/admin/bookings">
            Back to bookings
          </Link>
        </div>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: appointment } = await admin
    .from("appointments")
    .select("*")
    .eq("check_in_token_hash", hashCheckInToken(token))
    .maybeSingle();

  if (!appointment) {
    return (
      <div className="min-h-screen bg-[#fffaf3] px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-[#f1c4c0] bg-white p-8 text-center shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
          <ShieldAlert className="mx-auto text-[#9a3129]" size={42} />
          <h1 className="mt-4 text-3xl font-semibold text-[#4f4338]">Booking QR not recognized</h1>
          <p className="mt-3 text-sm leading-6 text-[#74685d]">
            Ask the visitor to open their latest appointment details in PawJai and scan the QR again.
          </p>
          <Link className="mt-6 inline-flex rounded-full bg-[#d38a2c] px-6 py-3 text-sm font-semibold text-white" href="/admin/bookings">
            Back to bookings
          </Link>
        </div>
      </div>
    );
  }

  const typedAppointment = appointment as Appointment;
  const [{ data: adopter }, { data: dog }, { data: shelter }] = await Promise.all([
    admin
      .from("adopters")
      .select("id, first_name, last_name, email, phone_number, verification_status, address_line, district, province")
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
  const alreadyCheckedIn = Boolean(typedAppointment.checked_in_at);

  return (
    <div className="min-h-screen bg-[#fffaf3] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#b77624]">
              QR Check-in
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-[#4f4338]">
              {typedAppointment.booking_code ?? formatBookingCode(typedAppointment.id)}
            </h1>
            <p className="mt-2 text-sm text-[#74685d]">
              {formatDateTime(typedAppointment.appointment_date, typedAppointment.appointment_time)}
            </p>
          </div>
          <Link className="rounded-full border border-[#eadfce] bg-white px-5 py-2 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]" href="/admin/bookings">
            Booking list
          </Link>
        </div>

        {resolvedSearchParams?.checkedIn === "1" || alreadyCheckedIn ? (
          <div className="mb-5 flex items-center gap-3 rounded-[24px] border border-[#cfe4c5] bg-[#f2faee] px-5 py-4 text-[#3f6f24]">
            <CheckCircle2 size={22} />
            <p className="text-sm font-semibold">
              Visitor checked in{typedAppointment.checked_in_at ? ` at ${new Date(typedAppointment.checked_in_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : ""}.
            </p>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-[32px] border border-[#eadfce] bg-white p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoBlock
                label="Adopter"
                secondary={[typedAdopter?.email, typedAdopter?.phone_number].filter(Boolean).join(" · ")}
                value={fullName(typedAdopter)}
              />
              <InfoBlock
                label="Verification"
                value={typedAdopter?.verification_status.replace("_", " ") ?? "unknown"}
              />
              <InfoBlock
                label="Dog"
                secondary={typedDog?.breed}
                value={typedDog?.name ?? "Shelter visit"}
              />
              <InfoBlock
                label="Shelter"
                secondary={[typedShelter?.district, typedShelter?.province].filter(Boolean).join(", ")}
                value={typedShelter?.name ?? "Unknown shelter"}
              />
            </div>

            {typedAppointment.visitor_note ? (
              <div className="mt-5 rounded-2xl bg-[#f8f0e5] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Visitor note</p>
                <p className="mt-1 text-sm leading-6 text-[#5b4d40]">{typedAppointment.visitor_note}</p>
              </div>
            ) : null}
          </section>

          <form action={checkInBookingAction} className="rounded-[32px] border border-[#eadfce] bg-white p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
            <input name="token" type="hidden" value={token} />
            <div className="flex items-center gap-3 text-[#3f6f24]">
              <ShieldCheck size={22} />
              <p className="font-semibold text-[#4f4338]">Staff check-in</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#74685d]">
              Confirm the visitor is physically at the shelter entrance before checking them in.
            </p>
            <label className="mt-5 block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Check-in note</span>
              <textarea
                className="min-h-[112px] w-full resize-none rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]"
                defaultValue={typedAppointment.check_in_note ?? ""}
                name="checkInNote"
                placeholder="Optional: ID checked, documents reviewed, staff initials"
              />
            </label>
            <button
              className="mt-4 w-full rounded-full bg-[#d38a2c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#bf781f] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={alreadyCheckedIn}
              type="submit"
            >
              {alreadyCheckedIn ? "Already checked in" : "Confirm check-in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
