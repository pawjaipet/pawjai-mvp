import Link from "next/link";
import { CreditCard, HelpCircle, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import { createClient } from "@/utils/supabase/server";

const M = "Montserrat, sans-serif";

type SettingsItem = {
  label: string;
  Icon: LucideIcon;
  hint: string;
  href: string;
};

type SettingsSection = {
  title: string;
  items: SettingsItem[];
};

// Notifications + Language removed: system runs notifications via email/SMS,
// language handled by browser/webapp translation. APP section removed entirely.
// Privacy renamed to Subscription & Payment Methods, routes to /settings/subscription.
const SECTIONS: SettingsSection[] = [
  {
    title: "Account",
    items: [
      { label: "Email & password", Icon: Mail, hint: "Manage your sign-in", href: "/settings" },
      { label: "Subscription & Payment Methods", Icon: CreditCard, hint: "Manage your plan and billing", href: "/settings/subscription" },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Help center", Icon: HelpCircle, hint: "FAQs and guides", href: "/more" },
    ],
  },
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <ProtectedRouteGate
        nextPath="/settings"
        reason="Sign in to manage your settings."
      />
    );
  }

  return (
    <div
      className="overflow-y-auto overflow-x-hidden"
      style={{
        width: "402px",
        maxWidth: "100vw",
        margin: "0 auto",
        minHeight: "100dvh",
        paddingBottom: "90px",
        background: "#F5F1E8",
        fontFamily: M,
      }}
    >
      {/* Header — logo top-left as home link */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-[14px] h-[64px]"
        style={{ background: "rgba(245,241,232,0.95)", backdropFilter: "blur(8px)" }}
      >
        <Link
          href="/"
          className="block h-[56px] w-[56px] active:scale-95 transition-transform"
          aria-label="PawJai home"
        >
          <img src="/pawjai-logo.png" alt="PawJai" className="h-full w-full object-contain object-left" />
        </Link>
        <h1 className="text-[18px] font-bold" style={{ color: "#65584f" }}>Settings</h1>
      </div>

      {/* Account email */}
      <div className="mx-[16px] mt-[16px] rounded-[16px] px-[16px] py-[14px]" style={{ background: "white", boxShadow: "0 2px 12px rgba(101,88,79,0.07)" }}>
        <p className="text-[11px] uppercase tracking-widest text-[#65584f]/50 font-semibold">Signed in as</p>
        <p className="text-[14px] text-[#65584f] mt-[4px] truncate">{user.email}</p>
      </div>

      {/* Sections */}
      <div className="mt-[24px] space-y-[24px] px-[16px]">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-[11px] uppercase tracking-widest text-[#65584f]/50 font-semibold mb-[8px] px-[4px]">
              {section.title}
            </p>
            <div
              className="rounded-[16px] overflow-hidden"
              style={{ background: "white", boxShadow: "0 2px 12px rgba(101,88,79,0.07)" }}
            >
              {section.items.map(({ label, Icon, hint, href }, idx) => (
                <Link
                  key={label}
                  href={href}
                  className={`w-full flex items-center gap-[14px] px-[16px] py-[14px] text-left transition-colors active:bg-[#d6c8ad]/20 ${
                    idx > 0 ? "border-t border-[#d6c8ad]/40" : ""
                  }`}
                >
                  <div
                    className="w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(205,129,136,0.12)" }}
                  >
                    <Icon size={18} stroke="#cd8188" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#65584f]">{label}</p>
                    <p className="text-[12px] text-[#65584f]/55 truncate">{hint}</p>
                  </div>
                  <span className="text-[#65584f]/30 text-[18px]">›</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[11px] text-[#65584f]/40 mt-[32px]">PawJai · v0.1</p>
    </div>
  );
}
