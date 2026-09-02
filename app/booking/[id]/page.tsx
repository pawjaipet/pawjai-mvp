import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, MessageCircle, QrCode, ShieldCheck } from "lucide-react";
import PawjaiWorkspaceShell from "@/components/admin/PawjaiWorkspaceShell";
import type { Database } from "@/types/database";
import { APPOINTMENT_TIME_SLOTS, appointmentFollowUpDue, normalizeAppointmentTime } from "@/utils/appointments-model";
import { formatBookingCode } from "@/utils/booking";
import {
  bookingWorkspaceDetailHref,
  bookingWorkspaceMessageHref,
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
    redirect("/admin");
  }

  return context;
}

function defaultBookingListHref(context: AdminAuthContext, shelter: Shelter | null, shelterId: string) {
  if (context.isGlobalAdmin) {
    return `/admin?shelter=${shelterId}&view=bookings`;
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
    return context.isGlobalAdmin ? requested.replace(/^\/admindraft/, "/admin") : fallback;
  }

  if (requested === "/admin" || requested.startsWith("/admin?") || requested.startsWith("/admin/bookings")) {
    return context.isGlobalAdmin ? requested : fallback;
  }

  if (requested.startsWith("/shelter/")) {
    return !context.isGlobalAdmin && context.shelterIds.includes(shelterId) ? requested : fallback;
  }

  return fallback;
}

function isMessagesReturnHref(href: string) {
  try {
    return new URL(href, "https://pawjai.local").searchParams.get("view") === "messages";
  } catch {
    return false;
  }
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

function bookingHasChangeRequest({
  proposedAppointmentDate,
  proposedAppointmentTime,
  status,
}: {
  proposedAppointmentDate?: string | null;
  proposedAppointmentTime?: string | null;
  status: string;
}) {
  return status === "requested" && Boolean(proposedAppointmentDate && proposedAppointmentTime);
}

function bookingStatusTone(status: string, hasChangeRequest = false) {
  if (hasChangeRequest) {
    return {
      label: "Change requested",
      pillClass: "bg-[#fff0cf] text-[#9a6215]",
      panelClass: "border-[#efc979] bg-[#fff7e6] text-[#8a5b00]",
      proposedClass: "bg-[#ffe9bc] text-[#8a5b00]",
    };
  }

  switch (status) {
    case "confirmed":
      return {
        label: "Accepted",
        pillClass: "bg-[#eaf6df] text-[#3f6f24]",
        panelClass: "border-[#cfe4c5] bg-[#f2faee] text-[#3f6f24]",
        proposedClass: "bg-[#e2f2dc] text-[#3f6f24]",
      };
    case "completed":
      return {
        label: "Completed",
        pillClass: "bg-[#e9f2ff] text-[#285f9d]",
        panelClass: "border-[#d4e2f5] bg-[#eef6ff] text-[#285f9d]",
        proposedClass: "bg-[#dcecff] text-[#285f9d]",
      };
    case "cancelled":
      return {
        label: "Denied",
        pillClass: "bg-[#f7e3e1] text-[#9a3129]",
        panelClass: "border-[#efc9c5] bg-[#fff1ee] text-[#9a3129]",
        proposedClass: "bg-[#f8e2e4] text-[#9a3129]",
      };
    case "no_show":
      return {
        label: "No show",
        pillClass: "bg-[#f1e7db] text-[#65584f]",
        panelClass: "border-[#d6c8ad] bg-[#f5f1e8] text-[#65584f]",
        proposedClass: "bg-[#eee6d7] text-[#65584f]",
      };
    default:
      return {
        label: "Awaiting decision",
        pillClass: "bg-[#fff0cf] text-[#9a6215]",
        panelClass: "border-[#efc979] bg-[#fff7e6] text-[#8a5b00]",
        proposedClass: "bg-[#ffe9bc] text-[#8a5b00]",
      };
  }
}

function statusClass(status: string, hasChangeRequest = false) {
  return bookingStatusTone(status, hasChangeRequest).pillClass;
}

function decisionLabel(status: string, hasChangeRequest = false) {
  return bookingStatusTone(status, hasChangeRequest).label;
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

    const bookingListHref = safeBookingReturnTo({
      context,
      requestedReturnTo: resolvedSearchParams?.returnTo,
      shelter: typedShelter,
      shelterId: typedAppointment.shelter_id,
    });
    redirect(withReturnTo(`${portalTarget}/bookings/${typedAppointment.id}`, bookingListHref));
  }

  const bookingCode = typedAppointment.booking_code ?? formatBookingCode(typedAppointment.id);
  const checkedIn = Boolean(typedAppointment.checked_in_at);
  const canRecordPostVisitOutcome = appointmentFollowUpDue({
    appointment_date: typedAppointment.appointment_date,
    appointment_time: typedAppointment.appointment_time,
    status: typedAppointment.status,
  });
  const canEditPreVisitDecision = !canRecordPostVisitOutcome
    && (typedAppointment.status === "requested" || typedAppointment.status === "confirmed");
  const canChangeBookingStatus = canEditPreVisitDecision || canRecordPostVisitOutcome;
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
  const messageHref = bookingWorkspaceMessageHref({
    appointmentId: typedAppointment.id,
    bookingListHref,
  });
  const backToMessages = isMessagesReturnHref(bookingListHref);
  const proposedAppointmentDate = (typedAppointment as { proposed_appointment_date?: string | null }).proposed_appointment_date ?? null;
  const proposedAppointmentTime = (typedAppointment as { proposed_appointment_time?: string | null }).proposed_appointment_time ?? null;
  const hasChangeRequest = bookingHasChangeRequest({
    proposedAppointmentDate,
    proposedAppointmentTime,
    status: typedAppointment.status,
  });
  const statusTone = bookingStatusTone(typedAppointment.status, hasChangeRequest);

  return (
    <PawjaiWorkspaceShell
      actions={(
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] transition hover:border-[#cd8188] hover:bg-[#f8e8ea]"
            href={bookingListHref}
          >
            <ArrowLeft className="h-4 w-4" />
            {backToMessages ? "Back to messages" : context.isGlobalAdmin ? "Back to all bookings" : "Back to shelter bookings"}
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-[#cd8188] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b87179]"
            href={messageHref}
          >
            <MessageCircle className="h-4 w-4" />
            Message adopter
          </Link>
        </div>
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
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${statusClass(typedAppointment.status, hasChangeRequest)}`}>
                  {statusTone.label}
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
                <div className={`rounded-2xl border px-4 py-3 ${statusTone.panelClass}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">Status</p>
                  <p className="mt-1 text-lg font-semibold">{decisionLabel(typedAppointment.status, hasChangeRequest)}</p>
                  {typedAppointment.shelter_note ? (
                    <p className="mt-2 text-sm leading-6 opacity-85">{typedAppointment.shelter_note}</p>
                  ) : null}
                  {proposedAppointmentDate && proposedAppointmentTime ? (
                    <p className={`mt-2 rounded-xl px-3 py-2 text-xs font-semibold ${statusTone.proposedClass}`}>
                      Proposed: {formatDate(proposedAppointmentDate)} at {formatTime(normalizeAppointmentTime(proposedAppointmentTime))}
                    </p>
                  ) : null}
                </div>
                {canChangeBookingStatus ? (
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
                ) : null}
                {canEditPreVisitDecision ? (
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
                            defaultValue={proposedAppointmentDate ?? typedAppointment.appointment_date}
                            min={new Date().toISOString().slice(0, 10)}
                            name="proposedAppointmentDate"
                            type="date"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8d7f72]">New time</span>
                          <select
                            className="h-11 w-full rounded-xl border border-[#d6c8ad] bg-white px-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
                            defaultValue={normalizeAppointmentTime(proposedAppointmentTime ?? typedAppointment.appointment_time)}
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
                ) : null}
                {canRecordPostVisitOutcome ? (
                  <div className="mt-3 rounded-2xl border border-[#d6c8ad] bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Post-visit outcome</p>
                    <div className="mt-3 grid gap-2">
                      <button className="w-full rounded-full bg-[#65584f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#50443b]" name="decision" type="submit" value="complete">
                        Mark visit completed
                      </button>
                      <button className="w-full rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8]" name="decision" type="submit" value="no_show">
                        Visitor did not show
                      </button>
                      {typedAppointment.dog_id ? (
                        <button className="w-full rounded-full bg-[#3f7b35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#356b2d]" name="decision" type="submit" value="adopted">
                          Mark dog adopted
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
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
              <Link
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#cd8188] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b87179]"
                href={messageHref}
              >
                <MessageCircle size={16} />
                Message adopter
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
