import Link from "next/link";
import { Pencil } from "lucide-react";
import { acceptRescheduleRequestAction, cancelAppointmentFromListAction, updateAppointmentDateTimeAction } from "@/app/appointments/actions";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import { canBookAppointment, getAdopterVerificationSnapshot } from "@/utils/adopter";
import {
  APPOINTMENT_TIME_SLOTS,
  canEditAppointmentDateTime,
  getAppointmentStatusCopy,
  isPastAppointmentByTime,
  normalizeAppointmentTime,
} from "@/utils/appointments-model";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const M = "Montserrat, sans-serif";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; message?: string; tab?: string }>;
}) {
  const { edit: editingAppointmentId, message, tab: tabParam } = await searchParams;
  const tab: "upcoming" | "past" = tabParam === "past" ? "past" : "upcoming";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <ProtectedRouteGate
        nextPath="/appointments"
        reason="Sign in to view and manage your shelter visits."
      />
    );
  }

  const verification = await getAdopterVerificationSnapshot(supabase, user);
  const adopter = verification.adopter;
  const admin = createAdminClient();
  const { data: allAppointments } = await admin
    .from("appointments")
    .select("*")
    .eq("adopter_id", adopter.id)
    .order("appointment_date", { ascending: tab === "past" ? false : true })
    .order("appointment_time", { ascending: tab === "past" ? false : true });

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const upcomingAppointments = (allAppointments ?? []).filter((a) => !isPastAppointmentByTime(a, now));
  const pastAppointments = (allAppointments ?? []).filter((a) => isPastAppointmentByTime(a, now));
  const appointments = tab === "past" ? pastAppointments : upcomingAppointments;

  const dogIds = [...new Set((allAppointments ?? []).map((a) => a.dog_id).filter(Boolean))] as string[];
  const shelterIds = [...new Set((allAppointments ?? []).map((a) => a.shelter_id))];

  const [{ data: dogs }, { data: shelters }] = await Promise.all([
    dogIds.length
      ? admin.from("dogs").select("id, name, breed").in("id", dogIds)
      : Promise.resolve({ data: [] }),
    shelterIds.length
      ? admin.from("shelters").select("id, name, phone_number, district, province").in("id", shelterIds)
      : Promise.resolve({ data: [] }),
  ]);

  const dogMap  = new Map((dogs    ?? []).map((d) => [d.id, d]));
  const shelterMap = new Map((shelters ?? []).map((s) => [s.id, s]));

  return (
    <PageShell
      message={message}
      canBook={canBookAppointment(verification)}
      verificationStatus={verification.status}
      tab={tab}
      upcomingCount={upcomingAppointments.length}
      pastCount={pastAppointments.length}
    >
      {appointments.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="space-y-[16px]">
          {appointments.map((appt) => {
            const dog     = appt.dog_id ? dogMap.get(appt.dog_id) : null;
            const shelter = shelterMap.get(appt.shelter_id);
            const date    = new Date(appt.appointment_date);
            const day   = date.getDate();
            const month = date.toLocaleString("en-US", { month: "long" });
            const year  = date.getFullYear() + 543;

            const timeLabel = appt.appointment_time
              ? new Date(`1970-01-01T${appt.appointment_time}`).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "";

            const isPastCard = tab === "past";
            const dateBg = isPastCard ? "#9c8f82" : "#65584f";
            const footerBg = isPastCard ? "rgba(101,88,79,0.45)" : "#cd8188";
            const statusCopy = getAppointmentStatusCopy(appt.status);
            const canEditDateTime = canEditAppointmentDateTime(appt, today);
            const isEditing = editingAppointmentId === appt.id;
            const editHref = `/appointments?tab=${tab}&edit=${appt.id}`;
            const cancelEditHref = `/appointments?tab=${tab}`;
            const currentTime = normalizeAppointmentTime(appt.appointment_time ?? "");
            const reschedule = appt as unknown as {
              proposed_appointment_date?: string | null;
              proposed_appointment_time?: string | null;
              reschedule_note?: string | null;
            };
            const proposedTime = reschedule.proposed_appointment_time
              ? new Date(`1970-01-01T${normalizeAppointmentTime(reschedule.proposed_appointment_time)}`).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "";
            const proposedDate = reschedule.proposed_appointment_date
              ? new Date(`${reschedule.proposed_appointment_date}T00:00:00`).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  weekday: "short",
                  year: "numeric",
                })
              : "";
            const hasRescheduleRequest = Boolean(reschedule.proposed_appointment_date && reschedule.proposed_appointment_time && !isPastCard);

            return (
              <article
                key={appt.id}
                className={`relative rounded-[14px] overflow-hidden ${isPastCard ? "opacity-90" : ""}`}
                style={{ boxShadow: "0 2px 10px rgba(101,88,79,0.10)" }}
              >
                {canEditDateTime && (
                  <Link
                    aria-label="Modify visit date and time"
                    className="absolute right-[12px] top-[12px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#eadfce] bg-white text-[#65584f] shadow-[0_2px_8px_rgba(101,88,79,0.14)] active:scale-95"
                    href={isEditing ? cancelEditHref : editHref}
                    replace
                  >
                    <Pencil size={15} strokeWidth={2.4} />
                  </Link>
                )}

                <Link
                  href={`/appointments/${appt.id}`}
                  className="block active:scale-[0.99] transition-transform"
                >
                  <div className="flex">
                    <div className="w-[112px] shrink-0 flex flex-col items-center justify-center py-[20px]" style={{ background: dateBg }}>
                      <p className="font-bold text-[44px] text-white leading-[1]" style={{ fontFamily: M }}>{day}</p>
                      <p className="text-[14px] text-white/85 mt-[4px]" style={{ fontFamily: M }}>{month}</p>
                      <p className="text-[13px] text-white/70" style={{ fontFamily: M }}>{year} BE</p>
                    </div>

                    <div className="flex-1 px-[16px] py-[16px] pr-[54px] bg-white">
                      {timeLabel && (
                        <p className="font-bold text-[20px] text-[#65584f] leading-[1.1]" style={{ fontFamily: M }}>
                          {timeLabel}
                        </p>
                      )}
                      <p className="mt-[4px] text-[14px] font-semibold text-[#65584f]/85" style={{ fontFamily: M }}>
                        {shelter?.name ?? "Shelter"}
                      </p>
                      {(shelter?.district || shelter?.province) && (
                        <p className="mt-[6px] text-[12px] text-[#65584f]/55 leading-[1.4]" style={{ fontFamily: M }}>
                          {[shelter.district, shelter.province].filter(Boolean).join(", ")}
                        </p>
                      )}
                      <div
                        className="mt-[10px] inline-flex rounded-[9px] px-[10px] py-[6px] text-[11px] font-bold"
                        style={{ background: statusCopy.background, color: statusCopy.color, fontFamily: M }}
                      >
                        {statusCopy.label}
                      </div>
                      <p className="mt-[6px] text-[11px] leading-[1.35] text-[#65584f]/55" style={{ fontFamily: M }}>
                        {appt.shelter_note || statusCopy.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-[18px] py-[12px] flex items-center justify-between" style={{ background: footerBg }}>
                    <p className="text-[14px] font-bold text-white truncate" style={{ fontFamily: M }}>
                      {dog ? `${dog.name}${dog.breed ? ` - ${dog.breed}` : ""}` : "Shelter visit"}
                    </p>
                    <span
                      className="ml-[12px] rounded-full px-[14px] py-[6px] text-[12px] font-bold flex items-center gap-[6px] flex-shrink-0"
                      style={{ background: "white", color: isPastCard ? "#65584f" : statusCopy.color, fontFamily: M }}
                    >
                      {statusCopy.label}
                    </span>
                  </div>
                </Link>

                {hasRescheduleRequest && (
                  <div className="border-t border-[#eadfce] bg-[#fffaf2] px-[14px] py-[14px]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8d7f72]" style={{ fontFamily: M }}>
                      Shelter requested a new time
                    </p>
                    <p className="mt-[6px] text-[14px] font-bold leading-[1.4] text-[#65584f]" style={{ fontFamily: M }}>
                      {proposedDate} at {proposedTime}
                    </p>
                    {reschedule.reschedule_note || appt.shelter_note ? (
                      <p className="mt-[5px] text-[12px] leading-[1.5] text-[#65584f]/65" style={{ fontFamily: M }}>
                        {reschedule.reschedule_note || appt.shelter_note}
                      </p>
                    ) : null}
                    <div className="mt-[12px] grid grid-cols-3 gap-[8px]">
                      <form action={acceptRescheduleRequestAction}>
                        <input name="appointmentId" type="hidden" value={appt.id} />
                        <button className="h-[40px] w-full rounded-full bg-[#3f7d34] px-[10px] text-[12px] font-bold text-white active:scale-[0.98]" style={{ fontFamily: M }} type="submit">
                          Accept
                        </button>
                      </form>
                      <Link
                        className="flex h-[40px] items-center justify-center rounded-full border border-[#eadfce] bg-white px-[10px] text-center text-[12px] font-bold text-[#65584f]"
                        href={editHref}
                        replace
                        style={{ fontFamily: M }}
                      >
                        Different
                      </Link>
                      <form action={cancelAppointmentFromListAction}>
                        <input name="appointmentId" type="hidden" value={appt.id} />
                        <button className="h-[40px] w-full rounded-full bg-[#c46f75] px-[10px] text-[12px] font-bold text-white active:scale-[0.98]" style={{ fontFamily: M }} type="submit">
                          Cancel
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {isEditing && canEditDateTime && (
                  <form action={updateAppointmentDateTimeAction} className="border-t border-[#eadfce] bg-[#fffaf2] px-[14px] py-[14px]">
                    <input type="hidden" name="appointmentId" value={appt.id} />
                    <p className="mb-[10px] text-[11px] font-bold uppercase tracking-[0.16em] text-[#8d7f72]" style={{ fontFamily: M }}>
                      Modify date and time
                    </p>
                    <div className="grid grid-cols-[1fr_112px] gap-[10px]">
                      <label className="block">
                        <span className="mb-[5px] block text-[11px] font-semibold text-[#65584f]/60" style={{ fontFamily: M }}>Date</span>
                        <input
                          className="h-[42px] w-full rounded-[12px] border border-[#eadfce] bg-white px-[12px] text-[13px] font-semibold text-[#65584f] outline-none"
                          defaultValue={appt.appointment_date}
                          min={today}
                          name="appointmentDate"
                          type="date"
                          style={{ fontFamily: M }}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-[5px] block text-[11px] font-semibold text-[#65584f]/60" style={{ fontFamily: M }}>Time</span>
                        <select
                          className="h-[42px] w-full rounded-[12px] border border-[#eadfce] bg-white px-[10px] text-[13px] font-semibold text-[#65584f] outline-none"
                          defaultValue={currentTime}
                          name="appointmentTime"
                          style={{ fontFamily: M }}
                        >
                          {APPOINTMENT_TIME_SLOTS.map((slot) => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="mt-[12px] flex gap-[8px]">
                      <button
                        className="flex-1 rounded-full bg-[#cd8188] px-[14px] py-[10px] text-[13px] font-bold text-white active:scale-[0.98]"
                        style={{ fontFamily: M }}
                        type="submit"
                      >
                        Request update
                      </button>
                      <Link
                        className="rounded-full border border-[#eadfce] bg-white px-[14px] py-[10px] text-[13px] font-bold text-[#65584f]"
                        href={cancelEditHref}
                        replace
                        style={{ fontFamily: M }}
                      >
                        Cancel
                      </Link>
                    </div>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

/* ─── sub-components ─────────────────────────────────────────────────── */

function PageShell({
  canBook,
  children,
  message,
  pastCount,
  tab,
  upcomingCount,
  verificationStatus,
}: {
  canBook: boolean;
  children: React.ReactNode;
  message?: string;
  pastCount?: number;
  tab?: "upcoming" | "past";
  upcomingCount?: number;
  verificationStatus: string;
}) {
  const activeTab = tab ?? "upcoming";
  return (
    <div
      className="relative overflow-y-auto"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", minHeight: "100vh", paddingBottom: "90px", background: "white", scrollbarWidth: "none" }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* Beige header with PAWJAI logo — matches Figma */}
      <div className="px-[16px] pt-[14px] pb-[24px]" style={{ background: "#d6c8ad" }}>
        <Link href="/" className="block h-[60px] w-[60px] mb-[18px]">
          <img src="/pawjai-logo.png" alt="PawJai" className="h-full w-full object-contain object-left" />
        </Link>
        <h1 className="font-bold text-[34px] text-[#65584f] leading-[1.1]" style={{ fontFamily: M }}>Appointments</h1>
        <p className="text-[14px] text-[#65584f]/75 mt-[4px]" style={{ fontFamily: M }}>Your upcoming shelter visits</p>
      </div>

      {/* UPCOMING / PAST tabs */}
      <div className="flex border-b border-[#d6c8ad]/30">
        <Link
          href="/appointments?tab=upcoming"
          replace
          className="flex-1 py-[14px] text-center text-[14px] font-bold tracking-wider transition-colors"
          style={{
            color: activeTab === "upcoming" ? "#cd8188" : "rgba(101,88,79,0.45)",
            borderBottom: activeTab === "upcoming" ? "3px solid #cd8188" : "3px solid transparent",
            fontFamily: M,
          }}
        >
          UPCOMING{typeof upcomingCount === "number" && upcomingCount > 0 ? ` (${upcomingCount})` : ""}
        </Link>
        <Link
          href="/appointments?tab=past"
          replace
          className="flex-1 py-[14px] text-center text-[14px] font-bold tracking-wider transition-colors"
          style={{
            color: activeTab === "past" ? "#cd8188" : "rgba(101,88,79,0.45)",
            borderBottom: activeTab === "past" ? "3px solid #cd8188" : "3px solid transparent",
            fontFamily: M,
          }}
        >
          PAST{typeof pastCount === "number" && pastCount > 0 ? ` (${pastCount})` : ""}
        </Link>
      </div>

      {/* Your Documents pink pill — matches Figma */}
      <div className="px-[16px] py-[18px]">
        <Link href="/documents" className="w-full h-[58px] rounded-[14px] flex items-center justify-between px-[18px]" style={{ background: "#cd8188", boxShadow: "0 4px 14px rgba(205,129,136,0.30)" }}>
          <div className="flex items-center gap-[14px]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <p className="text-[18px] font-bold text-white" style={{ fontFamily: M }}>
              Your Documents
            </p>
          </div>
          <svg width="9" height="15" viewBox="0 0 8 14" fill="none">
            <path d="M1 1L7 7L1 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        {!canBook && (
          <p className="mt-[8px] text-[12px] font-semibold text-center" style={{ color: "#cd8188", fontFamily: M }}>
            Complete verification to unlock bookings · status: {verificationStatus.replace("_", " ")}
          </p>
        )}
      </div>

      {message && (
        <div className="mx-[16px] mb-[12px] rounded-[12px] bg-[#d6c8ad]/30 px-4 py-3 text-[13px] text-[#65584f]" style={{ fontFamily: M }}>
          {message}
        </div>
      )}

      <div className="px-[16px] pb-[20px]">{children}</div>

    </div>
  );
}

function EmptyState({ tab }: { tab: "upcoming" | "past" }) {
  const isPast = tab === "past";
  return (
    <div className="flex flex-col items-center justify-center py-[60px] px-[20px]">
      <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-[16px]" style={{ background: "rgba(214,200,173,0.3)" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isPast ? (
            <>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </>
          ) : (
            <>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </>
          )}
        </svg>
      </div>
      <p className="text-[18px] font-semibold text-[#65584f] text-center mb-[8px]" style={{ fontFamily: M }}>
        {isPast ? "No past visits yet" : "No appointments yet"}
      </p>
      <p className="text-[14px] text-[#65584f]/60 text-center mb-[24px]" style={{ fontFamily: M }}>
        {isPast ? "Visits you completed or missed will appear here" : "Book a shelter visit to meet your future companion"}
      </p>
      <Link
        href={isPast ? "/appointments?tab=upcoming" : "/"}
        className="rounded-full px-[32px] py-[12px] text-white text-[14px] font-semibold"
        style={{ background: "#cd8188", fontFamily: M }}
      >
        {isPast ? "See upcoming" : "Browse Dogs"}
      </Link>
    </div>
  );
}

function GuestView() {
  return (
    <PageShell canBook={false} verificationStatus="not_started">
      <div className="flex flex-col items-center justify-center py-[60px] px-[20px]">
        <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-[16px]" style={{ background: "rgba(214,200,173,0.3)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <p className="text-[18px] font-semibold text-[#65584f] text-center mb-[8px]" style={{ fontFamily: M }}>Your appointments</p>
        <p className="text-[14px] text-[#65584f]/60 text-center mb-[24px]" style={{ fontFamily: M }}>
          Sign in to view and book shelter visits
        </p>
        <Link
          href="/auth"
          className="rounded-full px-[32px] py-[12px] text-white text-[15px] font-semibold"
          style={{ background: "#cd8188", fontFamily: M }}
        >
          Sign in
        </Link>
      </div>
    </PageShell>
  );
}
