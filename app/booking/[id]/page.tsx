import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, QrCode, ShieldCheck } from "lucide-react";
import PawjaiWorkspaceShell from "@/components/admin/PawjaiWorkspaceShell";
import type { Database } from "@/types/database";
import { APPOINTMENT_TIME_SLOTS, normalizeAppointmentTime } from "@/utils/appointments-model";
import { formatBookingCode } from "@/utils/booking";
import {
  bookingWorkspaceDetailHref,
  bookingWorkspaceVisitorHref,
} from "@/utils/booking-workspace-routes";
import { canAccessShelter } from "@/utils/admin-authorization";
import { getAdminAuthContext, type AdminAuthContext } from "@/utils/admin-auth";
import { getShelterPortalTarget, slugifyShelterName } from "@/utils/shelter-portal";
import { createAdminClient } from "@/utils/supabase/admin";
import { checkInBookingAction, decideBookingAction } from "@/app/admin/bookings/actions";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Adopter = Database["public"]["Tables"]["adopters"]["Row"];
type Dog = Pick<Database["public"]["Tables"]["dogs"]["Row"], "breed" | "id" | "name">;
type Shelter = Pick<Database["public"]["Tables"]["shelters"]["Row"], "district" | "id" | "name" | "phone_number" | "province">;

function withReturnTo(path: string, returnTo: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}

async function requireBookingAccess(shelterId: string) {
  const context = await getAdminAuthContext();

  if (!context) {
    redirect("/shelter?message=Sign in to view this booking.");
  }

  if (!canAccessShelter({ role: context.role, shelterIds: context.shelterIds, targetShelterId: shelterId })) {
    if (context.role === "shelter_admin") {
      redirect(await getShelterPortalTarget(context) ?? "/shelter");
    }
    redirect("/admindraft");
  }

  return context;
}

function defaultBookingListHref(context: AdminAuthContext, shelter: Shelter | null, shelterId: string) {
  if (context.isGlobalAdmin) {
    return `/admindraft?shelter=${shelterId}&view=bookings`;
  }

  return shelter?.name
    ? `/shelter/${slugifyShelterName(shelter.name)}?view=bookings`
    : "/shelter";
}

function safeBookingReturnTo({
  context,
  requestedReturnTo,
  shelter,
  shelterId,
}: {
  context: AdminAuthContext;
  requestedReturnTo?: string;
  shelter: Shelter | null;
  shelterId: string;
}) {
  const fallback = defaultBookingListHref(context, shelter, shelterId);
  const requested = requestedReturnTo?.trim() ?? "";

  if (!requested || !requested.startsWith("/") || requested.startsWith("//")) {
    return fallback;
  }

  if (requested.startsWith("/admindraft")) {
    return context.isGlobalAdmin ? requested : fallback;
  }

  if (requested.startsWith("/admin/bookings")) {
    return context.isGlobalAdmin ? requested : fallback;
  }

  if (requested.startsWith("/shelter/")) {
    return !context.isGlobalAdmin && context.shelterIds.includes(shelterId) ? requested : fallback;
  }

  return fallback;
}

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
      return "bg-[#f1e7db] text-[#65584f]";
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
      <p className="mt-1 text-lg font-semibold text-[#65584f]">{value}</p>
      {secondary ? <p className="text-sm text-[#65584f]">{secondary}</p> : null}
    </div>
  );
}

type BookingDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ checkedIn?: string; returnTo?: string; token?: string }>;
};

type BookingDetailRenderProps = BookingDetailPageProps & {
  shelterPortalSlug?: string;
};

export async function renderBookingDetailPage({
  params,
  searchParams,
  shelterPortalSlug,
}: BookingDetailRenderProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams?.token ?? "";

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
  const context = await requireBookingAccess(typedAppointment.shelter_id);
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

  if (!context.isGlobalAdmin && !shelterPortalSlug) {
    const canonicalSlug = typedShelter?.name
      ? slugifyShelterName(typedShelter.name)
      : null;
    const portalTarget = canonicalSlug
      ? `/shelter/${canonicalSlug}`
      : await getShelterPortalTarget(context);

    if (!portalTarget) redirect("/shelter");

    const bookingListHref = `${portalTarget}?view=bookings`;
    redirect(withReturnTo(`${portalTarget}/bookings/${typedAppointment.id}`, bookingListHref));
  }

  const bookingCode = typedAppointment.booking_code ?? formatBookingCode(typedAppointment.id);
  const checkedIn = Boolean(typedAppointment.checked_in_at);
  const bookingListHref = safeBookingReturnTo({
    context,
    requestedReturnTo: resolvedSearchParams?.returnTo,
    shelter: typedShelter,
    shelterId: typedAppointment.shelter_id,
  });
  const currentBookingHref = withReturnTo(
    bookingWorkspaceDetailHref({ appointmentId: typedAppointment.id, bookingListHref }),
    bookingListHref,
  );
  const visitorProfileHref = withReturnTo(
    bookingWorkspaceVisitorHref({ appointmentId: typedAppointment.id, bookingListHref }),
    bookingListHref,
  );

  return (
    <PawjaiWorkspaceShell
      actions={(
        <Link
          className="inline-flex items-center gap-2 rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] transition hover:border-[#cd8188] hover:bg-[#f8e8ea]"
          href={bookingListHref}
        >
          <ArrowLeft className="h-4 w-4" />
          {context.isGlobalAdmin ? "Back to all bookings" : "Back to shelter bookings"}
        </Link>
      )}
      description={`${bookingCode} · ${formatDate(typedAppointment.appointment_date)} at ${formatTime(typedAppointment.appointment_time)}`}
      eyebrow={context.isGlobalAdmin ? "PawJai Booking Workspace" : "Shelter Booking Workspace"}
      homeHref={bookingListHref}
      maxWidth="max-w-7xl"
      title="Booking detail"
    >
        {resolvedSearchParams?.checkedIn === "1" || checkedIn ? (
          <div className="mb-5 flex items-center gap-3 rounded-[24px] border border-[#cfe4c5] bg-[#f2faee] px-5 py-4 text-[#3f6f24]">
            <CheckCircle2 size={22} />
            <p className="text-sm font-semibold">
              Visitor checked in{typedAppointment.checked_in_at ? ` at ${new Date(typedAppointment.checked_in_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : ""}.
            </p>
          </div>
        ) : null}

        <section className="rounded-[28px] border border-[#d6c8ad] bg-white/90 p-5 shadow-[0_16px_50px_rgba(101,88,79,0.08)]">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${statusClass(typedAppointment.status)}`}>
                  {typedAppointment.status.replace("_", " ")}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f8e8ea] px-3 py-1 text-xs font-bold text-[#65584f]">
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
                <div className="mt-5 rounded-2xl bg-[#f8e8ea] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Visitor note</p>
                  <p className="mt-1 text-sm leading-6 text-[#65584f]">{typedAppointment.visitor_note}</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-4">
              <form action={decideBookingAction}>
                <input name="appointmentId" type="hidden" value={typedAppointment.id} />
                <input name="returnTo" type="hidden" value={currentBookingHref} />
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Status</p>
                  <p className="mt-1 text-lg font-semibold text-[#65584f]">{decisionLabel(typedAppointment.status)}</p>
                  {typedAppointment.shelter_note ? (
                    <p className="mt-2 text-sm leading-6 text-[#65584f]">{typedAppointment.shelter_note}</p>
                  ) : null}
                  {(typedAppointment as any).proposed_appointment_date && (typedAppointment as any).proposed_appointment_time ? (
                    <p className="mt-2 rounded-xl bg-[#fff1dc] px-3 py-2 text-xs font-semibold text-[#65584f]">
                      Proposed: {formatDate((typedAppointment as any).proposed_appointment_date)} at {formatTime(normalizeAppointmentTime((typedAppointment as any).proposed_appointment_time))}
                    </p>
                  ) : null}
                </div>
                <label className="mt-3 block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">
                    Shelter note
                  </span>
                  <textarea
                    className="min-h-[92px] w-full resize-none rounded-2xl border border-[#d6c8ad] bg-white px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
                    defaultValue={typedAppointment.shelter_note ?? ""}
                    name="shelterNote"
                    placeholder="Optional note for denial, date change, or staff context"
                  />
                </label>
                <details className="mt-3 rounded-2xl border border-[#d6c8ad] bg-white p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-[#65584f]">
                    Edit decision
                  </summary>
                  <div className="mt-3 grid gap-2">
                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#f5f1e8] p-3">
                      <label className="block">
                        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8d7f72]">New date</span>
                        <input
                          className="h-11 w-full rounded-xl border border-[#d6c8ad] bg-white px-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
                          defaultValue={(typedAppointment as any).proposed_appointment_date ?? typedAppointment.appointment_date}
                          min={new Date().toISOString().slice(0, 10)}
                          name="proposedAppointmentDate"
                          type="date"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8d7f72]">New time</span>
                        <select
                          className="h-11 w-full rounded-xl border border-[#d6c8ad] bg-white px-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
                          defaultValue={normalizeAppointmentTime((typedAppointment as any).proposed_appointment_time ?? typedAppointment.appointment_time)}
                          name="proposedAppointmentTime"
                        >
                          {APPOINTMENT_TIME_SLOTS.map((slot) => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <button className="w-full rounded-full bg-[#3f7b35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#356b2d]" name="decision" type="submit" value="accept">
                      Mark accepted
                    </button>
                    <button className="w-full rounded-full bg-[#c46f75] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ae5e64]" name="decision" type="submit" value="deny">
                      Mark denied
                    </button>
                    <button className="w-full rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8]" name="decision" type="submit" value="request_change">
                      Ask to change date/time
                    </button>
                  </div>
                </details>
              </form>

              {token ? (
                <form action={checkInBookingAction} className="mt-3 rounded-2xl border border-[#d6c8ad] bg-white p-3">
                  <input name="token" type="hidden" value={token} />
                  <input name="returnTo" type="hidden" value={currentBookingHref} />
                  <div className="flex items-center gap-2 text-[#3f6f24]">
                    <ShieldCheck size={18} />
                    <p className="text-sm font-semibold text-[#65584f]">QR check-in</p>
                  </div>
                  <textarea
                    className="mt-3 min-h-[82px] w-full resize-none rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
                    defaultValue={typedAppointment.check_in_note ?? ""}
                    name="checkInNote"
                    placeholder="Optional check-in note"
                  />
                  <button className="mt-3 w-full rounded-full bg-[#cd8188] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b87179] disabled:cursor-not-allowed disabled:opacity-55" disabled={checkedIn} type="submit">
                    {checkedIn ? "Already checked in" : "Confirm check-in"}
                  </button>
                </form>
              ) : null}

              <Link
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8]"
                href={visitorProfileHref}
              >
                <ExternalLink size={16} />
                Open visitor profile
              </Link>
            </div>
          </div>
        </section>
    </PawjaiWorkspaceShell>
  );
}

export default async function AdminBookingDetailPage(props: BookingDetailPageProps) {
  return renderBookingDetailPage(props);
}
