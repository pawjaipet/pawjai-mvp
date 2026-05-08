import Link from "next/link";
import Image from "next/image";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import { ensureAdopterForUser } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const M = "Montserrat, sans-serif";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
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

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();
  const { data: appointments } = await admin
    .from("appointments")
    .select("*")
    .eq("adopter_id", adopter.id)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  const dogIds = [...new Set((appointments ?? []).map((a) => a.dog_id).filter(Boolean))] as string[];
  const shelterIds = [...new Set((appointments ?? []).map((a) => a.shelter_id))];

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
    <PageShell message={message}>
      {(appointments ?? []).length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-[16px]">
          {appointments!.map((appt) => {
            const dog     = appt.dog_id ? dogMap.get(appt.dog_id) : null;
            const shelter = shelterMap.get(appt.shelter_id);
            const date    = new Date(appt.appointment_date);
            const day   = date.getDate();
            const month = date.toLocaleString("en-US", { month: "long" });
            const year  = date.getFullYear() + 543;

            return (
              <div key={appt.id} className="border border-[#65584f] rounded-[12px] overflow-hidden">
                {/* Date sidebar + details */}
                <div className="flex">
                  {/* Dark date sidebar */}
                  <div className="w-[100px] shrink-0 flex flex-col items-center justify-center py-[16px]" style={{ background: "#65584f" }}>
                    <p className="font-bold text-[48px] text-white leading-[1]" style={{ fontFamily: M }}>{day}</p>
                    <p className="text-[14px] text-white/90 mt-[4px]" style={{ fontFamily: M }}>{month}</p>
                    <p className="text-[14px] text-white/90" style={{ fontFamily: M }}>{year} BE</p>
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-[16px]">
                    <p className="text-[13px] text-[#65584f]/80 mb-[4px]" style={{ fontFamily: M }}>
                      {shelter?.name ?? "Shelter"}
                    </p>
                    {(shelter?.district || shelter?.province) && (
                      <p className="text-[11px] text-[#65584f]/60 mb-[8px]" style={{ fontFamily: M }}>
                        {[shelter.district, shelter.province].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {appt.appointment_time && (
                      <p className="text-[12px] font-semibold text-[#65584f] mb-[4px]" style={{ fontFamily: M }}>
                        {appt.appointment_time}
                      </p>
                    )}
                    {shelter?.phone_number && (
                      <p className="text-[11px] text-[#cd8188] font-semibold" style={{ fontFamily: M }}>
                        📞 {shelter.phone_number}
                      </p>
                    )}
                    {appt.visitor_note && (
                      <p className="text-[11px] text-[#65584f]/60 mt-[6px] italic" style={{ fontFamily: M }}>
                        "{appt.visitor_note}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Dog info / status banner */}
                <div className="px-[16px] py-[10px] flex items-center justify-between" style={{ background: "#cd8188" }}>
                  <p className="text-[13px] font-semibold text-white" style={{ fontFamily: M }}>
                    {dog ? `${dog.name}${dog.breed ? ` — ${dog.breed}` : ""}` : "Shelter visit"}
                  </p>
                  <span
                    className="rounded-[14px] px-[16px] py-[6px] text-[12px] font-semibold capitalize bg-white text-[#cd8188]"
                    style={{ fontFamily: M }}
                  >
                    {appt.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

/* ─── sub-components ─────────────────────────────────────────────────── */

function PageShell({ children, message }: { children: React.ReactNode; message?: string }) {
  return (
    <div
      className="relative overflow-y-auto"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", minHeight: "100vh", paddingBottom: "90px", background: "white", scrollbarWidth: "none" }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* White sticky header — matches Figma */}
      <div className="sticky top-0 z-10 px-[16px] py-[20px] border-b border-[#d6c8ad]" style={{ background: "white" }}>
        <h1 className="font-bold text-[32px] text-[#65584f] leading-[1.2]" style={{ fontFamily: M }}>Appointments</h1>
        <p className="text-[14px] text-[#65584f]/80 mt-[4px]" style={{ fontFamily: M }}>Your upcoming shelter visits</p>
      </div>

      {/* UPCOMING / PAST tabs */}
      <div className="flex border-b border-[#d6c8ad]/30">
        <button className="flex-1 py-[12px] text-[14px] font-semibold border-b-2 border-[#cd8188] text-[#cd8188]" style={{ fontFamily: M }}>
          UPCOMING
        </button>
        <button className="flex-1 py-[12px] text-[14px] font-semibold text-[#65584f]/40" style={{ fontFamily: M }}>
          PAST
        </button>
      </div>

      {/* Your Documents button */}
      <div className="px-[16px] py-[16px]">
        <a href="/documents" className="w-full h-[48px] rounded-[12px] flex items-center justify-between px-[16px] shadow-md" style={{ background: "#cd8188" }}>
          <div className="flex items-center gap-[12px]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <p className="text-[16px] font-semibold text-white" style={{ fontFamily: M }}>Your Documents</p>
          </div>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M1 1L7 7L1 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      {message && (
        <div className="mx-[16px] mb-[12px] rounded-[12px] bg-[#d6c8ad]/30 px-4 py-3 text-[13px] text-[#65584f]" style={{ fontFamily: M }}>
          {message}
        </div>
      )}

      <div className="px-[16px] pb-[20px]">{children}</div>

      {/* Sticky gradient header with logo */}
      <div
        className="fixed top-0 z-20 pointer-events-none h-[94px]"
        style={{
          width: "402px", maxWidth: "100vw", left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(to bottom, #d6c8ad 0%, rgba(214,200,173,0.75) 38.942%, rgba(214,200,173,0) 100%)",
        }}
      >
        <div className="pointer-events-auto absolute left-[8px] top-[39px]">
          <a href="/swipe" className="block h-[55px] w-[110px] relative">
            <Image src="/pawjai-logo.png" alt="PawJai" fill className="object-contain object-left" priority />
          </a>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-[60px] px-[20px]">
      <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-[16px]" style={{ background: "rgba(214,200,173,0.3)" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      <p className="text-[18px] font-semibold text-[#65584f] text-center mb-[8px]" style={{ fontFamily: M }}>No appointments yet</p>
      <p className="text-[14px] text-[#65584f]/60 text-center mb-[24px]" style={{ fontFamily: M }}>
        Book a shelter visit to meet your future companion
      </p>
      <Link
        href="/dogs"
        className="rounded-full px-[32px] py-[12px] text-white text-[14px] font-semibold"
        style={{ background: "#cd8188", fontFamily: M }}
      >
        Browse Dogs
      </Link>
    </div>
  );
}

function GuestView() {
  return (
    <PageShell>
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
