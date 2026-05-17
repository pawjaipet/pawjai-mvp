import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/auth/actions";

const M = "Montserrat, sans-serif";

const SECTIONS = [
  {
    title: "Adopt",
    items: [
      { label: "Browse dogs",            href: "/swipe",        icon: "🐾" },
      { label: "My preferences",         href: "/filter",       icon: "🎯" },
      { label: "My wishlist",            href: "/profile",      icon: "❤️" },
      { label: "Appointments",           href: "/appointments", icon: "📅" },
      { label: "My documents",           href: "/documents",    icon: "🪪" },
      { label: "Messages",               href: "/messages",     icon: "💬" },
    ],
  },
  {
    title: "About PawJai",
    items: [
      { label: "How adoption works",    href: "/about",         icon: "📖" },
      { label: "Partner shelters",      href: "/about#shelters", icon: "🏥" },
      { label: "Contact us",            href: "/about#contact",  icon: "✉️" },
    ],
  },
] as const;

export default async function MorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div
      className="relative overflow-y-auto overflow-x-hidden min-h-screen"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", background: "#F5F1E8", paddingBottom: "90px", scrollbarWidth: "none", fontFamily: M }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* ── Gradient header with logo ── */}
      <div
        className="sticky top-0 z-20 pointer-events-none h-[94px] w-full"
        style={{ background: "linear-gradient(to bottom, #d6c8ad 0%, rgba(214,200,173,0.75) 38.942%, rgba(214,200,173,0) 100%)" }}
      >
        <div className="pointer-events-auto absolute left-[8px] top-[7px]">
          <Link href="/" className="block h-[80px] w-[80px] relative">
            <Image src="/pawjai-logo.png" alt="PawJai" fill className="object-contain object-left" priority />
          </Link>
        </div>
      </div>

      {/* ── User card ── */}
      <div className="px-[16px] pt-[8px] pb-[20px]">
        {user ? (
          <div className="rounded-[16px] p-[16px] flex items-center gap-[14px]" style={{ background: "white" }}>
            {/* Avatar placeholder */}
            <div className="size-[52px] rounded-full flex items-center justify-center shrink-0" style={{ background: "#d6c8ad" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12ZM12 14C8.66667 14 2 15.675 2 19V21H22V19C22 15.675 15.3333 14 12 14Z" fill="#65584f" fillOpacity="0.4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[16px] text-[#65584f] truncate" style={{ fontFamily: M }}>{user.email}</p>
              <p className="text-[12px] text-[#65584f]/60 mt-[2px]" style={{ fontFamily: M }}>PawJai member</p>
            </div>
            <Link href="/profile" className="shrink-0 text-[12px] font-semibold text-[#cd8188]" style={{ fontFamily: M }}>
              Edit →
            </Link>
          </div>
        ) : (
          <Link
            href="/auth"
            className="block rounded-[16px] p-[16px] text-center"
            style={{ background: "#cd8188" }}
          >
            <p className="font-bold text-[18px] text-white" style={{ fontFamily: M }}>Sign in / Create account</p>
            <p className="text-[13px] text-white/80 mt-[4px]" style={{ fontFamily: M }}>Save dogs and book shelter visits</p>
          </Link>
        )}
      </div>

      {/* ── Menu sections ── */}
      <div className="px-[16px] space-y-[20px]">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-[10px]" style={{ color: "rgba(101,88,79,0.5)", fontFamily: M }}>
              {section.title}
            </p>
            <div className="rounded-[16px] overflow-hidden" style={{ background: "white" }}>
              {section.items.map((item, i) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-[14px] px-[16px] py-[15px] active:bg-[#d6c8ad]/30 transition-colors"
                  style={{ borderTop: i > 0 ? "1px solid rgba(214,200,173,0.5)" : undefined }}
                >
                  <span className="text-[20px] shrink-0">{item.icon}</span>
                  <span className="flex-1 text-[15px] text-[#65584f] font-medium" style={{ fontFamily: M }}>{item.label}</span>
                  <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                    <path d="M1 1L6 6L1 11" stroke="#65584f" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* ── Sign out ── */}
        {user && (
          <form action={signOut}>
            <button
              className="w-full rounded-[16px] py-[15px] text-[15px] font-semibold border-2 transition-all active:opacity-70"
              style={{ background: "white", borderColor: "rgba(101,88,79,0.2)", color: "#65584f", fontFamily: M }}
            >
              Sign out
            </button>
          </form>
        )}

        <p className="text-center text-[11px] pb-[10px]" style={{ color: "rgba(101,88,79,0.3)", fontFamily: M }}>
          PawJai v0.1 · Made with ❤️ for Thai dogs
        </p>
      </div>
    </div>
  );
}
