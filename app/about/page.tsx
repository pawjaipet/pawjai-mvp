import Image from "next/image";
import Link from "next/link";

const M = "Montserrat, sans-serif";

const HOW_IT_WORKS = [
  { step: "1", icon: "🔍", title: "Browse & Match", desc: "Swipe through profiles of dogs waiting for homes. Our smart matching learns your preferences over time." },
  { step: "2", icon: "📅", title: "Book a Visit", desc: "Schedule a meet-and-greet at the shelter at a time that suits you. No adoption pressure — just a friendly visit." },
  { step: "3", icon: "🏠", title: "Adopt & Celebrate", desc: "Complete the adoption paperwork with the shelter and bring your new companion home!" },
];

const SHELTERS = [
  { name: "Soi Dog Foundation",      province: "Phuket",  count: "1,600+ dogs" },
  { name: "Ban Rak Nong Shelter",    province: "Bangkok", count: "200+ dogs"   },
  { name: "Happy Paws Bangkok",      province: "Bangkok", count: "120+ dogs"   },
  { name: "Chiang Mai Dog Rescue",   province: "Chiang Mai", count: "80+ dogs" },
];

export default function AboutPage() {
  return (
    <div
      className="relative overflow-y-auto overflow-x-hidden"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", minHeight: "100vh", paddingBottom: "90px", background: "#F5F1E8", scrollbarWidth: "none", fontFamily: M }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* Gradient hero header — #5: one logo, centered, as large as possible */}
      <div
        className="w-full flex flex-col items-center justify-center pt-[48px] pb-[36px] px-[24px]"
        style={{ background: "linear-gradient(160deg, #d6c8ad 0%, #c4b49a 100%)", minHeight: 360 }}
      >
        <div className="relative h-[220px] w-[300px] mb-[18px]">
          <Image src="/pawjai-logo.png" alt="PawJai" fill className="object-contain" priority />
        </div>
        <p className="text-[15px] font-semibold text-[#65584f] text-center opacity-80" style={{ fontFamily: M }}>
          Connecting Thai dogs with loving homes
        </p>
      </div>

      <div className="px-[16px] pt-[24px] space-y-[28px]">

        {/* Mission */}
        <div className="rounded-[20px] p-[20px]" style={{ background: "white" }}>
          <p className="font-bold text-[18px] text-[#65584f] mb-[10px]" style={{ fontFamily: M }}>Our Mission</p>
          <p className="text-[14px] text-[#65584f]/70 leading-relaxed" style={{ fontFamily: M }}>
            Thailand is home to an estimated <span className="font-semibold text-[#cd8188]">3.5 million stray dogs</span>. PawJai was built to change that —
            one adoption at a time. We partner with shelters across the country to make the adoption process joyful, transparent, and accessible to everyone.
          </p>
        </div>

        {/* How it works */}
        <div>
          <p className="font-bold text-[16px] text-[#65584f]/60 uppercase tracking-widest text-[11px] mb-[14px]" style={{ fontFamily: M }}>How Adoption Works</p>
          <div className="space-y-[12px]">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="rounded-[16px] p-[16px] flex items-start gap-[16px]" style={{ background: "white" }}>
                <div className="shrink-0 w-[44px] h-[44px] rounded-full flex items-center justify-center" style={{ background: "#d6c8ad" }}>
                  <span className="text-[22px]">{step.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-[8px] mb-[4px]">
                    <span className="text-[11px] font-bold text-[#cd8188] rounded-full w-[18px] h-[18px] flex items-center justify-center" style={{ background: "rgba(205,129,136,0.15)" }}>{step.step}</span>
                    <p className="font-bold text-[15px] text-[#65584f]" style={{ fontFamily: M }}>{step.title}</p>
                  </div>
                  <p className="text-[13px] text-[#65584f]/60 leading-relaxed" style={{ fontFamily: M }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partner shelters */}
        <div>
          <p className="font-bold text-[16px] text-[#65584f]/60 uppercase tracking-widest text-[11px] mb-[14px]" style={{ fontFamily: M }}>Partner Shelters</p>
          <div className="rounded-[16px] overflow-hidden" style={{ background: "white" }}>
            {SHELTERS.map((s, i) => (
              <div
                key={s.name}
                className="flex items-center gap-[14px] px-[16px] py-[14px]"
                style={{ borderTop: i > 0 ? "1px solid rgba(214,200,173,0.5)" : undefined }}
              >
                <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0" style={{ background: "#d6c8ad" }}>
                  <span className="text-[18px]">🏥</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[14px] text-[#65584f] truncate" style={{ fontFamily: M }}>{s.name}</p>
                  <p className="text-[12px] text-[#65584f]/50" style={{ fontFamily: M }}>{s.province} · {s.count}</p>
                </div>
                <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                  <path d="M1 1L6 6L1 11" stroke="#65584f" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <p className="font-bold text-[16px] text-[#65584f]/60 uppercase tracking-widest text-[11px] mb-[14px]" style={{ fontFamily: M }}>Contact Us</p>
          <div className="rounded-[16px] overflow-hidden" style={{ background: "white" }}>
            {[
              { icon: "✉️", label: "hello@pawjai.co.th" },
              { icon: "📱", label: "@pawjai.official" },
              { icon: "🌐", label: "pawjai.co.th" },
            ].map((item, i) => (
              <div
                key={item.label}
                className="flex items-center gap-[14px] px-[16px] py-[14px]"
                style={{ borderTop: i > 0 ? "1px solid rgba(214,200,173,0.5)" : undefined }}
              >
                <span className="text-[20px]">{item.icon}</span>
                <p className="text-[14px] text-[#65584f]" style={{ fontFamily: M }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/"
          className="block w-full rounded-full py-[15px] text-white font-bold text-[16px] text-center active:scale-[0.98] transition-transform"
          style={{ background: "#cd8188", fontFamily: M }}
        >
          Start Browsing Dogs 🐾
        </Link>

        <p className="text-center text-[11px] pb-[10px]" style={{ color: "rgba(101,88,79,0.3)", fontFamily: M }}>
          PawJai v0.1 · Made with ❤️ for Thai dogs
        </p>
      </div>
    </div>
  );
}
