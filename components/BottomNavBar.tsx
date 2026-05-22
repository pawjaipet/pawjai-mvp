"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, SlidersHorizontal, Calendar, User, MoreHorizontal } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/filter", label: "Filter", Icon: SlidersHorizontal },
  { href: "/appointments", label: "Appointments", Icon: Calendar },
  { href: "/profile", label: "Profile", Icon: User },
  { href: "/more", label: "More", Icon: MoreHorizontal },
] as const;

export default function BottomNavBar() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/onboarding")) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 z-50 bg-white border-t border-[#d6c8ad] shadow-[0_-2px_10px_rgba(101,88,79,0.1)]"
      style={{ width: "100%", maxWidth: 402, left: "50%", transform: "translateX(-50%)" }}
    >
      <div className="flex items-center justify-around h-[70px] px-2">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors active:bg-[#d6c8ad]/20"
            >
              <Icon
                size={24}
                className={`mb-1 transition-colors ${active ? "text-[#cd8188]" : "text-[#65584f]/60"}`}
                strokeWidth={2}
                aria-hidden="true"
              />
              <span className={`text-[11px] transition-colors ${active ? "text-[#cd8188] font-semibold" : "text-[#65584f]/60 font-medium"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
