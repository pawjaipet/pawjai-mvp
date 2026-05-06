import Link from "next/link";
import Image from "next/image";
import { ensureAdopterForUser } from "@/utils/adopter";
import { createClient } from "@/utils/supabase/server";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // No auth guard — show empty state if not logged in
  if (!user) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen px-[24px] text-center"
        style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", fontFamily: "Montserrat, sans-serif" }}
      >
        <p className="text-[48px] mb-[16px]">📅</p>
        <p className="text-[20px] font-bold text-[#65584f] mb-[8px]">Your appointments</p>
        <p className="text-[14px] text-[#65584f]/60 mb-[24px]">Sign in to view and book shelter visits</p>
        <Link
          href="/auth"
          className="rounded-full px-[32px] py-[12px] text-white text-[15px] font-semibold"
          style={{ background: "#cd8188" }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  const adopter = await ensureAdopterForUser(supabase, user);
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("adopter_id", adopter.id)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  const dogIds = [
    ...new Set(
      (appointments ?? []).map((a) => a.dog_id).filter(Boolean)
    ),
  ] as string[];
  const shelterIds = [...new Set((appointments ?? []).map((a) => a.shelter_id))];

  const [{ data: dogs }, { data: shelters }] = await Promise.all([
    dogIds.length
      ? supabase.from("dogs").select("id, name, breed").in("id", dogIds)
      : Promise.resolve({ data: [] }),
    shelterIds.length
      ? supabase.from("shelters").select("id, name, phone_number, district, province").in("id", shelterIds)
      : Promise.resolve({ data: [] }),
  ]);

  const dogMap = new Map((dogs ?? []).map((d) => [d.id, d]));
  const shelterMap = new Map((shelters ?? []).map((s) => [s.id, s]));

  return (
    <div
      className="bg-white relative overflow-y-auto"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", minHeight: "100vh", paddingBottom: "90px", scrollbarWidth: "none" }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 px-[16px] py-[20px]"
        style={{ background: "#d6c8ad" }}
      >
        <h1
          className="text-[32px] font-bold text-[#65584f] leading-[1.2]"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Appointments
        </h1>
        <p className="text-[14px] text-[#65584f]/80 mt-[4px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Your upcoming shelter visits
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#d6c8ad]/30">
        <button
          className="flex-1 py-[12px] text-[14px] font-semibold border-b-2 border-[#cd8188] text-[#cd8188]"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          UPCOMING
        </button>
        <button
          className="flex-1 py-[12px] text-[14px] font-semibold text-[#65584f]/40"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          PAST
        </button>
      </div>

      {/* Your Documents button */}
      <div className="px-[16px] py-[16px]">
        <div className="w-full h-[48px] rounded-[12px] flex items-center justify-between px-[16px] shadow-md" style={{ background: "#cd8188" }}>
          <div className="flex items-center gap-[12px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <p className="text-[16px] font-semibold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Your Documents
            </p>
          </div>
          <svg width="20" height="12" viewBox="0 0 15 8" fill="none">
            <path d="M1 1L7.5 7L14 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(270 7.5 4)" />
          </svg>
        </div>
      </div>

      {message && (
        <div className="mx-[16px] rounded-[12px] bg-[#d6c8ad]/30 px-4 py-3 text-sm text-[#65584f] mb-[8px]">
          {message}
        </div>
      )}

      {/* Appointments list */}
      <div className="px-[16px] pb-[20px] space-y-[16px]">
        {(appointments ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-[60px] px-[20px]">
            <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-[16px] bg-[#d6c8ad]/30">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-[18px] font-semibold text-[#65584f] text-center mb-[8px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
              No appointments yet
            </p>
            <p className="text-[14px] text-[#65584f]/60 text-center mb-[20px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Book a shelter visit to meet your future companion
            </p>
            <Link
              href="/dogs"
              className="rounded-[22px] px-[32px] py-[12px] text-white text-[14px] font-semibold"
              style={{ background: "#cd8188", fontFamily: "Montserrat, sans-serif" }}
            >
              Browse Dogs
            </Link>
          </div>
        ) : (
          appointments!.map((appointment) => {
            const dog = appointment.dog_id ? dogMap.get(appointment.dog_id) : null;
            const shelter = shelterMap.get(appointment.shelter_id);

            // Parse date for display
            const date = new Date(appointment.appointment_date);
            const day = date.getDate();
            const month = date.toLocaleString("en-US", { month: "long" });
            const year = date.getFullYear() + 543; // Buddhist era

            return (
              <div
                key={appointment.id}
                className="border border-[#65584f] rounded-[12px] overflow-hidden"
              >
                {/* Date + details row */}
                <div className="flex">
                  {/* Date sidebar */}
                  <div
                    className="w-[100px] flex flex-col items-center justify-center py-[16px] shrink-0"
                    style={{ background: "#65584f" }}
                  >
                    <p
                      className="text-[48px] font-bold text-white leading-[1]"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      {day}
                    </p>
                    <p className="text-[14px] text-white/90 mt-[4px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {month}
                    </p>
                    <p className="text-[14px] text-white/90" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {year} BE
                    </p>
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-[16px]">
                    <p className="text-[13px] text-[#65584f]/80 mb-[4px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {shelter?.name ?? "Shelter"}
                    </p>
                    {(shelter?.district || shelter?.province) && (
                      <p className="text-[11px] text-[#65584f]/60 mb-[6px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        {[shelter.district, shelter.province].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {appointment.appointment_time && (
                      <p className="text-[12px] font-semibold text-[#65584f] mb-[6px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        {appointment.appointment_time}
                      </p>
                    )}
                    {shelter?.phone_number && (
                      <p className="text-[11px] text-[#65584f]/60" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        📞 {shelter.phone_number}
                      </p>
                    )}
                    {appointment.visitor_note && (
                      <p className="text-[11px] text-[#65584f]/70 mt-[6px] italic" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        "{appointment.visitor_note}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Dog info banner */}
                <div
                  className="px-[16px] py-[10px] flex items-center justify-between"
                  style={{ background: "#cd8188" }}
                >
                  <p className="text-[13px] font-semibold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    {dog ? `${dog.name}${dog.breed ? ` — ${dog.breed}` : ""}` : "Shelter visit"}
                  </p>
                  <span
                    className="rounded-full px-[10px] py-[3px] text-[11px] font-semibold capitalize bg-white text-[#cd8188]"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    {appointment.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky gradient header */}
      <div
        className="fixed top-0 z-20 pointer-events-none h-[94px]"
        style={{
          width: "402px",
          maxWidth: "100vw",
          left: "50%",
          transform: "translateX(-50%)",
          background:
            "linear-gradient(to bottom, #d6c8ad 0%, rgba(214,200,173,0.75) 38.942%, rgba(214,200,173,0) 100%)",
        }}
      >
        <div className="pointer-events-auto absolute left-[8px] top-[39px]">
          <a href="/swipe" className="block h-[55px] w-[110px] relative">
            <Image
              src="/pawjai-logo.png"
              alt="PawJai"
              fill
              className="object-contain object-left"
              priority
            />
          </a>
        </div>
      </div>
    </div>
  );
}
