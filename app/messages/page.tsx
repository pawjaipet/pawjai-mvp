import Image from "next/image";
import Link from "next/link";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { ensureAdopterForUser } from "@/utils/adopter";
import type { AppointmentMessageRow } from "@/utils/appointment-messages";
import { isAppointmentMessagesUnavailableError } from "@/utils/appointment-messages";
import { loadAdopterMessageAppointments } from "@/utils/appointment-queries";
import { formatBookingCode } from "@/utils/booking";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const M = "Montserrat, sans-serif";

function formatTime(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div
        className="relative overflow-y-auto overflow-x-hidden"
        style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", minHeight: "100vh", paddingBottom: "90px", background: "#F5F1E8", scrollbarWidth: "none", fontFamily: M }}
      >
        <ProtectedRouteGate
          nextPath="/messages"
          reason="Sign in to message shelters and track your adoption journey."
        />
      </div>
    );
  }

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();
  const { data: appointments, error: appointmentsError } = await loadAdopterMessageAppointments(admin, adopter.id);
  if (appointmentsError) {
    console.error("Message appointments failed to load", appointmentsError);
  }
  const appointmentRows = appointments ?? [];
  const dogIds = [...new Set(appointmentRows.map((appointment) => appointment.dog_id).filter(Boolean))] as string[];
  const shelterIds = [...new Set(appointmentRows.map((appointment) => appointment.shelter_id))];
  const appointmentIds = appointmentRows.map((appointment) => appointment.id);
  const [{ data: dogs }, { data: shelters }, messagesResult] = await Promise.all([
    dogIds.length ? admin.from("dogs").select("id, name").in("id", dogIds) : Promise.resolve({ data: [] }),
    shelterIds.length ? admin.from("shelters").select("id, name, logo_url").in("id", shelterIds) : Promise.resolve({ data: [] }),
    appointmentIds.length
      ? admin
          .from("appointment_messages")
          .select("appointment_id, body, created_at, sender_role")
          .in("appointment_id", appointmentIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);
  const messagesUnavailable = Boolean(messagesResult.error);
  if (messagesResult.error && !isAppointmentMessagesUnavailableError(messagesResult.error)) {
    console.error("Appointment messages failed to load", messagesResult.error);
  }
  const messages = messagesResult.data ?? [];
  const dogMap = new Map((dogs ?? []).map((dog) => [dog.id, dog]));
  const shelterMap = new Map(((shelters ?? []) as { id: string; logo_url?: string | null; name: string }[]).map((shelter) => [shelter.id, shelter]));
  const latestMessageByAppointment = new Map<string, Pick<AppointmentMessageRow, "appointment_id" | "body" | "created_at" | "sender_role">>();
  for (const message of (messages as Pick<AppointmentMessageRow, "appointment_id" | "body" | "created_at" | "sender_role">[])) {
    if (!latestMessageByAppointment.has(message.appointment_id)) {
      latestMessageByAppointment.set(message.appointment_id, message);
    }
  }

  return (
    <div
      className="relative overflow-y-auto overflow-x-hidden"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", minHeight: "100vh", paddingBottom: "90px", background: "#F5F1E8", scrollbarWidth: "none", fontFamily: M }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      <div className="sticky top-0 z-10 px-[16px] pt-[14px] pb-[20px] shrink-0" style={{ background: "#65584f" }}>
        <div className="mb-[10px] flex items-start justify-between">
          <Link href="/" className="block h-[56px] w-[56px] active:scale-95 transition-transform" aria-label="PawJai home" style={{ filter: "brightness(0) invert(1)" }}>
            <Image src="/pawjai-logo.png" alt="PawJai" width={56} height={56} className="h-full w-full object-contain object-left" priority />
          </Link>
          <LanguageSwitcher className="mt-[2px]" />
        </div>
        <h1 className="font-bold text-[32px] text-white leading-[1.2]" style={{ fontFamily: M }}>Messages</h1>
        <p className="text-[14px] text-white/80 mt-[4px]" style={{ fontFamily: M }}>Your conversations with shelters</p>
      </div>

      <div className="px-[16px] pt-[16px] space-y-[2px]">
        {messagesUnavailable ? (
          <div className="mb-[12px] rounded-[14px] border border-[#eadfce] bg-[#fffdfa] px-[14px] py-[12px]">
            <p className="text-[13px] leading-[1.45] text-[#65584f]" style={{ fontFamily: M }}>
              Messages are temporarily unavailable. Your appointment conversations will appear here again soon.
            </p>
          </div>
        ) : null}
        {appointmentRows.length > 0 ? (
          appointmentRows.map((appointment) => {
            const shelter = shelterMap.get(appointment.shelter_id);
            const dog = appointment.dog_id ? dogMap.get(appointment.dog_id) : null;
            const latest = latestMessageByAppointment.get(appointment.id);
            return (
              <Link
                key={appointment.id}
                href={`/appointments/${appointment.id}?tab=messages`}
                className="flex items-center gap-[14px] px-[4px] py-[14px] active:bg-[#d6c8ad]/20 transition-colors rounded-[12px]"
              >
                <div className="relative flex h-[60px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-[10px]" style={{ background: "#d6c8ad" }}>
                  {shelter?.logo_url ? (
                    <img src={shelter.logo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#65584f" fillOpacity="0.35" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-[4px] flex items-start justify-between gap-[8px]">
                    <p className="truncate text-[16px] font-semibold leading-[1.3] text-[#65584f]" style={{ fontFamily: M }}>{shelter?.name ?? "Shelter"}</p>
                    <p className="shrink-0 text-[11px] text-[#65584f]/60" style={{ fontFamily: M }}>{formatTime(latest?.created_at ?? appointment.appointment_date)}</p>
                  </div>
                  <p className="mb-[4px] truncate text-[14px] leading-[1.3] text-[#65584f]/80" style={{ fontFamily: M }}>
                    {latest ? latest.body : `Booking ${appointment.booking_code ?? formatBookingCode(appointment.id)}${dog ? ` for ${dog.name}` : ""}`}
                  </p>
                  <p className="truncate text-[11px] text-[#65584f]/45" style={{ fontFamily: M }}>
                    {dog?.name ?? "Shelter visit"} · {appointment.status.replace("_", " ")}
                  </p>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="pt-[24px] text-center">
            <p className="text-[13px] text-[#65584f]/45" style={{ fontFamily: M }}>
              Conversations are enabled when you book a shelter visit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
