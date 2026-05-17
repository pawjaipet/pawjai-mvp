import Link from "next/link";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import { canBookAppointment, ensureAdopterForUser, getAdopterVerificationSnapshot } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const M = "Montserrat, sans-serif";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; tab?: string }>;
}) {
  const { message, tab: tabParam } = await searchParams;
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

  // Split by date — past = before today OR status completed/cancelled/no_show
  const today = new Date().toISOString().slice(0, 10);
  const isPast = (appt: { appointment_date: string; status: string }) => {
    if (appt.status === "completed" || appt.status === "cancelled" || appt.status === "no_show") return true;
    return appt.appointment_date < today;
  };

  const upcomingAppointments = (allAppointments ?? []).filter((a) => !isPast(a));
  const pastAppointments = (allAppointments ?? []).filter((a) => isPast(a));
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
            const statusLabel =
              appt.status === "completed" ? "Visited"
              : appt.status === "cancelled" ? "Cancelled"
              : appt.status === "no_show" ? "Missed"
              : "Past";

            return (
              <Link
                key={appt.id}
                href={`/appointments/${appt.id}`}
                className={`block rounded-[14px] overflow-hidden active:scale-[0.99] transition-transform ${isPastCard ? "opacity-90" : ""}`}
                style={{ boxShadow: "0 2px 10px rgba(101,88,79,0.10)" }}
              >
                <div className="flex">
                  <div className="w-[112px] shrink-0 flex flex-col items-center justify-center py-[20px]" style={{ background: dateBg }}>
                    <p className="font-bold text-[44px] text-white leading-[1]" style={{ fontFamily: M }}>{day}</p>
                    <p className="text-[14px] text-white/85 mt-[4px]" style={{ fontFamily: M }}>{month}</p>
                    <p className="text-[13px] text-white/70" style={{ fontFamily: M }}>{year} BE</p>
                  </div>

                  <div className="flex-1 px-[16px] py-[16px] bg-white">
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
                  </div>
                </div>

                <div className="px-[18px] py-[12px] flex items-center justify-between" style={{ background: footerBg }}>
                  <p className="text-[14px] font-bold text-white truncate" style={{ fontFamily: M }}>
                    {dog ? `${dog.name}${dog.breed ? ` - ${dog.breed}` : ""}` : "Shelter visit"}
                  </p>
                  <span
                    className="ml-[12px] rounded-full px-[14px] py-[6px] text-[12px] font-bold flex items-center gap-[6px] flex-shrink-0"
                    style={{ background: "white", color: isPastCard ? "#65584f" : "#cd8188", fontFamily: M }}
                  >
                    {isPastCard ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#65584f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {statusLabel}
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#cd8188" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Message
                      </>
                    )}
                  </span>
                </div>
              </Link>
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
