import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/auth/actions";

const MENU_SECTIONS = [
  {
    title: "Adopt",
    items: [
      { label: "Browse dogs", href: "/swipe", icon: "🐾" },
      { label: "My filter preferences", href: "/filter", icon: "🎯" },
      { label: "My wishlist", href: "/profile", icon: "❤️" },
      { label: "Appointments", href: "/appointments", icon: "📅" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile & preferences", href: "/profile", icon: "👤" },
      { label: "Sign in / Create account", href: "/auth", icon: "🔐" },
    ],
  },
  {
    title: "About",
    items: [
      { label: "About PawJai", href: "#", icon: "🏠" },
      { label: "Partner shelters", href: "#", icon: "🏥" },
      { label: "How adoption works", href: "#", icon: "📖" },
    ],
  },
];

export default async function MorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div
      className="relative overflow-y-auto overflow-x-hidden min-h-screen"
      style={{
        width: "402px",
        maxWidth: "100vw",
        margin: "0 auto",
        background: "#F5F1E8",
        paddingBottom: "90px",
        scrollbarWidth: "none",
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* Gradient header with logo */}
      <div
        className="sticky top-0 z-20 pointer-events-none h-[94px] w-full"
        style={{
          background:
            "linear-gradient(to bottom, #d6c8ad 0%, rgba(214,200,173,0.75) 38.942%, rgba(214,200,173,0) 100%)",
        }}
      >
        <div className="pointer-events-auto absolute left-[8px] top-[39px]">
          <Link href="/swipe" className="block h-[55px] w-[110px] relative">
            <Image
              src="/pawjai-logo.png"
              alt="PawJai"
              fill
              className="object-contain object-left"
              priority
            />
          </Link>
        </div>
      </div>

      {/* User greeting */}
      <div className="px-[20px] pt-[8px] pb-[24px]">
        {user ? (
          <div
            className="rounded-[16px] p-[16px] flex items-center gap-[14px]"
            style={{ background: "white" }}
          >
            <div
              className="size-[52px] rounded-full flex items-center justify-center shrink-0"
              style={{ background: "#d6c8ad" }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12ZM12 14C8.66667 14 2 15.675 2 19V21H22V19C22 15.675 15.3333 14 12 14Z"
                  fill="#65584f"
                  fillOpacity="0.5"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[16px] text-[#65584f] truncate">
                {user.email}
              </p>
              <p className="text-[12px] text-[#65584f]/60 mt-[2px]">PawJai member</p>
            </div>
          </div>
        ) : (
          <Link
            href="/auth"
            className="block rounded-[16px] p-[16px] text-center"
            style={{ background: "#cd8188" }}
          >
            <p className="font-bold text-[16px] text-white">Sign in / Create account</p>
            <p className="text-[13px] text-white/80 mt-[4px]">Save dogs and book visits</p>
          </Link>
        )}
      </div>

      {/* Menu sections */}
      <div className="px-[20px] space-y-[20px]">
        {MENU_SECTIONS.map((section) => (
          <div key={section.title}>
            <p
              className="text-[11px] font-semibold uppercase tracking-widest mb-[10px]"
              style={{ color: "rgba(101,88,79,0.5)" }}
            >
              {section.title}
            </p>
            <div className="rounded-[16px] overflow-hidden" style={{ background: "white" }}>
              {section.items.map((item, i) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-[14px] px-[16px] py-[15px] active:bg-[#d6c8ad]/30 transition-colors"
                  style={{
                    borderTop: i > 0 ? "1px solid rgba(214,200,173,0.5)" : undefined,
                  }}
                >
                  <span className="text-[20px] shrink-0">{item.icon}</span>
                  <span className="flex-1 text-[15px] text-[#65584f] font-medium">
                    {item.label}
                  </span>
                  <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                    <path
                      d="M1 1L7 7L1 13"
                      stroke="#65584f"
                      strokeOpacity="0.3"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Sign out */}
        {user && (
          <form action={signOut}>
            <button
              className="w-full rounded-[16px] py-[15px] text-[15px] font-semibold border-2 transition-all active:opacity-70"
              style={{
                background: "white",
                borderColor: "rgba(101,88,79,0.2)",
                color: "#65584f",
              }}
            >
              Sign out
            </button>
          </form>
        )}

        {/* Version */}
        <p className="text-center text-[11px] pb-[10px]" style={{ color: "rgba(101,88,79,0.3)" }}>
          PawJai v0.1 · Made with ❤️ for Thai dogs
        </p>
      </div>
    </div>
  );
}
