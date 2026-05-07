import Image from "next/image";
import Link from "next/link";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import { createClient } from "@/utils/supabase/server";

const M = "Montserrat, sans-serif";

const PLACEHOLDER_THREADS = [
  { id: "1", shelter: "Soi Dog Foundation", lastMsg: "Thank you for your interest! We'd love to meet you.", time: "2h", unread: 2 },
  { id: "2", shelter: "Ban Rak Nong Shelter", lastMsg: "Mochi is doing great today 🐾", time: "1d", unread: 0 },
  { id: "3", shelter: "Happy Paws Bangkok", lastMsg: "Your appointment is confirmed for next Saturday.", time: "3d", unread: 0 },
];

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div
      className="relative overflow-y-auto overflow-x-hidden"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", minHeight: "100vh", paddingBottom: "90px", background: "#F5F1E8", scrollbarWidth: "none", fontFamily: M }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* Dark header — matches Figma */}
      <div className="sticky top-0 z-10 px-[16px] py-[20px] shrink-0" style={{ background: "#65584f" }}>
        <h1 className="font-bold text-[32px] text-white leading-[1.2]" style={{ fontFamily: M }}>Messages</h1>
        <p className="text-[14px] text-white/80 mt-[4px]" style={{ fontFamily: M }}>Your conversations with shelters</p>
      </div>

      {/* Gradient header with logo (fixed, on top) */}
      <div
        className="fixed top-0 z-20 pointer-events-none h-[94px]"
        style={{ width: "402px", maxWidth: "100vw", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(to bottom, #d6c8ad 0%, rgba(214,200,173,0.75) 38.942%, rgba(214,200,173,0) 100%)" }}
      >
        <div className="pointer-events-auto absolute left-[8px] top-[39px]">
          <Link href="/swipe" className="block h-[55px] w-[110px] relative">
            <Image src="/pawjai-logo.png" alt="PawJai" fill className="object-contain object-left" priority />
          </Link>
        </div>
      </div>

      {!user ? (
        <ProtectedRouteGate
          nextPath="/messages"
          reason="Sign in to message shelters and track your adoption journey."
        />
      ) : (
        <div className="px-[16px] pt-[16px] space-y-[2px]">
          {PLACEHOLDER_THREADS.map((thread) => (
            <Link
              key={thread.id}
              href={`/messages/${thread.id}`}
              className="flex items-center gap-[14px] px-[4px] py-[14px] active:bg-[#d6c8ad]/20 transition-colors rounded-[12px]"
            >
              {/* Thumbnail — 60×60px rounded-[10px] */}
              <div className="shrink-0 w-[60px] h-[60px] rounded-[10px] overflow-hidden flex items-center justify-center relative" style={{ background: "#d6c8ad" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#65584f" fillOpacity="0.35" />
                </svg>
                {thread.unread > 0 && (
                  <span className="absolute top-[-4px] right-[-4px] w-[20px] h-[20px] rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: "#cd8188" }}>
                    {thread.unread}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-[8px] mb-[4px]">
                  <p className="font-semibold text-[16px] text-[#65584f] leading-[1.3] truncate" style={{ fontFamily: M }}>{thread.shelter}</p>
                  <p className="text-[11px] text-[#65584f]/60 shrink-0" style={{ fontFamily: M }}>{thread.time}</p>
                </div>
                <p className={`text-[14px] text-[#65584f]/80 leading-[1.3] truncate mb-[4px] ${thread.unread > 0 ? "font-semibold" : ""}`} style={{ fontFamily: M }}>
                  {thread.lastMsg}
                </p>
              </div>
            </Link>
          ))}

          {/* Divider + hint */}
          <div className="pt-[24px] text-center">
            <p className="text-[12px] text-[#65584f]/30" style={{ fontFamily: M }}>
              Conversations are enabled when you book a shelter visit
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
