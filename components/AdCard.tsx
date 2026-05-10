"use client";

import type { Ad } from "@/utils/ads";

interface Props {
  /**
   * Ad payload to render. When null, the slot renders a reserved
   * placeholder so the feed shape stays stable. Insert rows into the
   * `ads` table (with is_active=true and current date in range) to
   * fill these slots automatically — no code change needed.
   */
  ad: Ad | null;
  cardWidth: number;
  cardHeight: number;
}

const M = "Montserrat, sans-serif";

export default function AdCard({ ad, cardWidth, cardHeight }: Props) {
  // Placeholder slot — no ad available
  if (!ad || !ad.imageUrl) {
    return (
      <div
        className="relative overflow-hidden rounded-[24px] flex flex-col items-center justify-center text-center px-[24px]"
        style={{
          width: cardWidth,
          height: cardHeight,
          flexShrink: 0,
          background: "linear-gradient(135deg, #f5efe2 0%, #ece1c9 50%, #e0d3b8 100%)",
          border: "2px dashed rgba(101,88,79,0.18)",
        }}
        data-ad-slot="placeholder"
      >
        {/* Sponsored badge */}
        <div
          className="absolute top-[14px] right-[14px] rounded-full px-[10px] py-[4px]"
          style={{ background: "rgba(101,88,79,0.55)", backdropFilter: "blur(6px)" }}
        >
          <span className="text-white text-[11px] font-semibold tracking-wide" style={{ fontFamily: M }}>
            Sponsored
          </span>
        </div>

        {/* Soft paw watermark */}
        <div className="opacity-[0.18] mb-[16px]">
          <svg width="80" height="80" viewBox="0 0 100 100" fill="#65584f">
            <ellipse cx="50" cy="75" rx="22" ry="18" />
            <ellipse cx="20" cy="55" rx="10" ry="13" />
            <ellipse cx="80" cy="55" rx="10" ry="13" />
            <ellipse cx="35" cy="40" rx="9" ry="11" />
            <ellipse cx="65" cy="40" rx="9" ry="11" />
          </svg>
        </div>

        <p
          className="text-[18px] font-bold text-[#65584f]"
          style={{ fontFamily: M }}
        >
          Partner spot
        </p>
        <p
          className="mt-[8px] text-[13px] text-[#65584f]/55 max-w-[260px] leading-relaxed"
          style={{ fontFamily: M }}
        >
          This space is reserved for partners who help PawJai dogs find homes.
        </p>
      </div>
    );
  }

  // Real ad
  return (
    <a
      href={ad.clickUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="block relative overflow-hidden rounded-[24px] shadow-lg select-none"
      style={{ width: cardWidth, height: cardHeight, flexShrink: 0 }}
      data-ad-slot="filled"
      data-ad-id={ad.id}
    >
      <img
        src={ad.imageUrl}
        alt={ad.companyName}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Sponsored badge */}
      <div className="absolute top-[14px] right-[14px] bg-black/50 backdrop-blur-sm rounded-full px-[10px] py-[4px]">
        <span className="text-white text-[11px] font-semibold tracking-wide" style={{ fontFamily: M }}>
          Sponsored
        </span>
      </div>

      {/* Bottom gradient + company name */}
      <div className="absolute bottom-0 inset-x-0 h-[100px] bg-gradient-to-t from-black/70 to-transparent flex items-end px-[20px] pb-[20px]">
        <span className="text-white font-semibold text-[16px] truncate" style={{ fontFamily: M }}>
          {ad.companyName}
        </span>
      </div>
    </a>
  );
}
