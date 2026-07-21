"use client";

import type { Ad } from "@/utils/ads";
import { normalizeDogMediaUrl } from "@/utils/dog-media";

interface Props {
  ad: Ad;
  cardWidth: number | string;
  cardHeight: number | string;
}

const M = "Montserrat, sans-serif";

export default function AdCard({ ad, cardWidth, cardHeight }: Props) {
  const imageUrl = normalizeDogMediaUrl(ad.imageUrl) ?? ad.imageUrl;

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
        src={imageUrl}
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
