import type { Metadata } from "next";
import Image from "next/image";
import {
  buildPawjaiContactHref,
  loadPawjaiProfileContent,
  pawjaiContactIcon,
} from "@/utils/pawjai-profile";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import JsonLd from "@/components/seo/JsonLd";
import { createClient } from "@/utils/supabase/server";
import { webPageJsonLd } from "@/utils/json-ld";
import { canonicalUrl } from "@/utils/seo";

const M = "Montserrat, sans-serif";

const HOW_IT_WORKS = [
  { step: "1", icon: "🔍", title: "Browse & Match", desc: "Swipe through profiles of dogs waiting for homes. Our smart matching learns your preferences over time." },
  { step: "2", icon: "📅", title: "Book a Visit", desc: "Schedule a meet-and-greet at the shelter at a time that suits you. No adoption pressure — just a friendly visit." },
  { step: "3", icon: "🏠", title: "Adopt & Celebrate", desc: "Complete the adoption paperwork with the shelter and bring your new companion home!" },
];

export const metadata: Metadata = {
  title: "About PawJai",
  description: "Learn how PawJai helps people in Thailand discover, match with, and adopt dogs from shelter partners.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About PawJai",
    description: "Learn how PawJai helps people in Thailand adopt dogs from shelter partners.",
    url: canonicalUrl("/about"),
    type: "website",
  },
};

export default async function AboutPage() {
  const supabase = await createClient();
  const content = await loadPawjaiProfileContent(supabase);

  return (
    <div
      className="relative overflow-y-auto overflow-x-hidden"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", minHeight: "100vh", paddingBottom: "90px", background: "#F5F1E8", scrollbarWidth: "none", fontFamily: M }}
    >
      <JsonLd
        data={webPageJsonLd({
          description: "Learn how PawJai helps people in Thailand discover, match with, and adopt dogs from shelter partners.",
          name: "About PawJai",
          path: "/about",
        })}
      />
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* Hero */}
      <div
        className="relative w-full flex flex-col items-center justify-center pt-[48px] pb-[36px] px-[24px]"
        style={{ background: "linear-gradient(160deg, #d6c8ad 0%, #c4b49a 100%)", minHeight: 360 }}
      >
        <div className="absolute right-[16px] top-[18px]">
          <LanguageSwitcher />
        </div>
        <div className="relative h-[220px] w-[300px] mb-[18px]">
          <Image src="/pawjai-logo.png" alt="PawJai" fill className="object-contain" priority />
        </div>
        <p className="text-[15px] font-semibold text-[#65584f] text-center opacity-80" style={{ fontFamily: M }}>
          {content.heroSlogan}
        </p>
      </div>

      <div className="px-[16px] pt-[24px] space-y-[28px]">

        {/* Partner Shelters — first */}
        <div id="shelters">
          <p className="font-bold text-[11px] text-[#65584f]/60 uppercase tracking-widest mb-[14px]" style={{ fontFamily: M }}>
            Partner Shelters
          </p>
          <div className="space-y-[12px]">
            {content.partnerShelters.map((shelter, index) => (
              <div
                key={`${shelter.name}-${index}`}
                className="rounded-[20px] p-[18px] flex items-center gap-[16px]"
                style={{ background: "white" }}
              >
                {/* Logo area — large square for real logos */}
                <div
                  className="shrink-0 rounded-[16px] overflow-hidden flex items-center justify-center"
                  style={{ width: 76, height: 76, background: "#ede8df" }}
                >
                  {shelter.logo_url ? (
                    <img
                      src={shelter.logo_url}
                      alt={shelter.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[32px]">🏥</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[16px] text-[#65584f] leading-snug" style={{ fontFamily: M }}>
                    {shelter.name}
                  </p>
                  <p className="text-[13px] text-[#65584f]/50 mt-[3px]" style={{ fontFamily: M }}>
                    {shelter.detail.split(" · ")[0]}
                  </p>
                  <div
                    className="inline-flex items-center mt-[8px] px-[10px] py-[3px] rounded-full"
                    style={{ background: "rgba(205,129,136,0.12)" }}
                  >
                    <span className="text-[12px] font-semibold text-[#cd8188]" style={{ fontFamily: M }}>
                      {shelter.detail.split(" · ")[1] ?? shelter.detail}
                    </span>
                  </div>
                </div>

                <svg className="shrink-0" width="7" height="12" viewBox="0 0 7 12" fill="none">
                  <path d="M1 1L6 6L1 11" stroke="#65584f" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Mission */}
        <div className="rounded-[20px] p-[20px]" style={{ background: "white" }}>
          <p className="font-bold text-[18px] text-[#65584f] mb-[10px]" style={{ fontFamily: M }}>
            {content.missionTitle}
          </p>
          <p className="text-[14px] text-[#65584f]/70 leading-relaxed whitespace-pre-line" style={{ fontFamily: M }}>
            {content.missionBody}
          </p>
        </div>

        {/* How Adoption Works */}
        <div>
          <p className="font-bold text-[11px] text-[#65584f]/60 uppercase tracking-widest mb-[14px]" style={{ fontFamily: M }}>
            How Adoption Works
          </p>
          <div className="space-y-[12px]">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="rounded-[16px] p-[16px] flex items-start gap-[16px]" style={{ background: "white" }}>
                <div className="shrink-0 w-[44px] h-[44px] rounded-full flex items-center justify-center" style={{ background: "#d6c8ad" }}>
                  <span className="text-[22px]">{step.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-[8px] mb-[4px]">
                    <span className="text-[11px] font-bold text-[#cd8188] rounded-full w-[18px] h-[18px] flex items-center justify-center" style={{ background: "rgba(205,129,136,0.15)" }}>
                      {step.step}
                    </span>
                    <p className="font-bold text-[15px] text-[#65584f]" style={{ fontFamily: M }}>
                      {step.title}
                    </p>
                  </div>
                  <p className="text-[13px] text-[#65584f]/60 leading-relaxed" style={{ fontFamily: M }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div id="contact">
          <p className="font-bold text-[11px] text-[#65584f]/60 uppercase tracking-widest mb-[14px]" style={{ fontFamily: M }}>
            Contact Us
          </p>
          <div className="rounded-[16px] overflow-hidden" style={{ background: "white" }}>
            {content.contactItems.map((item, index) => {
              const href = buildPawjaiContactHref(item);
              const body = (
                <>
                  <span className="text-[20px]">{pawjaiContactIcon(item.type)}</span>
                  <p className="text-[14px] text-[#65584f]" style={{ fontFamily: M }}>
                    {item.label}
                  </p>
                </>
              );

              return href ? (
                <a
                  key={`${item.label}-${index}`}
                  href={href}
                  className="flex items-center gap-[14px] px-[16px] py-[14px]"
                  style={{ borderTop: index > 0 ? "1px solid rgba(214,200,173,0.5)" : undefined }}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noreferrer" : undefined}
                >
                  {body}
                </a>
              ) : (
                <div
                  key={`${item.label}-${index}`}
                  className="flex items-center gap-[14px] px-[16px] py-[14px]"
                  style={{ borderTop: index > 0 ? "1px solid rgba(214,200,173,0.5)" : undefined }}
                >
                  {body}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-[11px] pb-[10px]" style={{ color: "rgba(101,88,79,0.3)", fontFamily: M }}>
          PawJai v0.1 · Made with ❤️ for Thai dogs
        </p>
      </div>
    </div>
  );
}
