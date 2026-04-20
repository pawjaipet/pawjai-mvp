"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, SlidersHorizontal, Calendar, User, MoreHorizontal } from "lucide-react";

const TABS = [
  { href: "/swipe", label: "Home", Icon: Home },
  { href: "/dogs", label: "Filter", Icon: SlidersHorizontal },
  { href: "/appointments", label: "Appointments", Icon: Calendar },
  { href: "/profile", label: "Profile", Icon: User },
  { href: "/more", label: "More", Icon: MoreHorizontal },
] as const;

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#d6c8ad] shadow-[0_-2px_10px_rgba(101,88,79,0.1)]"
      style={{ maxWidth: 402, margin: "0 auto" }}
    >
      <div className="flex items-center justify-around h-[70px] px-2">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors active:bg-[#d6c8ad]/20"
            >
              <Icon
                size={24}
                className={`mb-1 transition-colors ${active ? "text-[#cd8188]" : "text-[#65584f]/60"}`}
                strokeWidth={active ? 0 : 2}
                fill={active ? "currentColor" : "none"}
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
