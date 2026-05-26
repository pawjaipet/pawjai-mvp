import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/auth/actions";

const M = "Montserrat, sans-serif";

// Adopt section removed entirely — duplicates of bottom-nav destinations.
// Messages kept under its own one-item section since it has no other home.
// Reroutes: My wishlist -> /profile (Wishlist section), My documents -> /profile (Verification card),
// Appointments/Browse dogs/My preferences -> bottom-nav tabs.
const SECTIONS: ReadonlyArray<{
  title: string | null;
  items: ReadonlyArray<{ label: string; href: string; icon: string }>;
}> = [
  {
    title: null,
    items: [
      { label: "Messages", href: "/messages", icon: "💬" },
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
];

export default async function MorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div
      className="relative overflow-y-auto overflow-x-hidden min-h-screen"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", background: "#F5F1E8", paddingBottom: "90px", scrollbarWidth: "none", fontFamily: M }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* ── Inline header with logo ── */}
      <div className="px-[8px] pt-[7px] pb-[12px]">
        <Link href="/" className="block h-[80px] w-[80px] relative active:scale-95 transition-transform" aria-label="PawJai home">
          <Image src="/pawjai-logo.png" alt="PawJai" fill className="object-contain object-left" priority />
        </Link>
      </div>

      {/* User profile card removed — email/edit moved to Profile tab + Settings */}
      {!user && (
        <div className="px-[16px] pt-[8px] pb-[20px]">
          <Link
            href="/auth"
            className="block rounded-[16px] p-[16px] text-center"
            style={{ background: "#cd8188" }}
          >
            <p className="font-bold text-[18px] text-white" style={{ fontFamily: M }}>Sign in / Create account</p>
            <p className="text-[13px] text-white/80 mt-[4px]" style={{ fontFamily: M }}>Save dogs and book shelter visits</p>
          </Link>
        </div>
      )}

      {/* ── Menu sections ── */}
      <div className="px-[16px] space-y-[20px]">
        {SECTIONS.map((section, sIdx) => (
          <div key={section.title ?? `section-${sIdx}`}>
            {section.title && (
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-[10px]" style={{ color: "rgba(101,88,79,0.5)", fontFamily: M }}>
                {section.title}
              </p>
            )}
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
