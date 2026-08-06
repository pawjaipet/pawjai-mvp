"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import SwipeDogCard, { type SwipeDog } from "./SwipeDogCard";
import AdCard from "./AdCard";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { Ad } from "@/utils/ads";
import { buildSwipeFeed, isActiveDogFeedItem } from "@/utils/swipe-feed-model";

const CARD_W = "min(370px, calc(100vw - 32px))";
const CARD_H = "min(560px, calc(100dvh - 230px))";
// Insert one live ad after every N dogs. The server shuffles active ads
// daily so limited slots rotate fairly when ad inventory is larger.
const AD_EVERY = 3;

interface Props {
  dogs: SwipeDog[];
  savedIds: string[];
  isLoggedIn: boolean;
  ads?: Ad[];
}

export default function SwipeFeed({ dogs, savedIds, isLoggedIn, ads = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { t } = useLanguage();

  const feed = buildSwipeFeed(dogs, ads, AD_EVERY);

  function scrollToTop() {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFeedScroll() {
    if (!containerRef.current) return;
    const sectionHeight = containerRef.current.clientHeight;
    if (sectionHeight <= 0) return;
    const nextIndex = Math.round(containerRef.current.scrollTop / sectionHeight);
    setActiveIndex(Math.min(Math.max(nextIndex, 0), Math.max(feed.length - 1, 0)));
  }

  return (
    <div
      className="relative flex flex-col bg-white overflow-hidden"
      style={{ width: 402, maxWidth: "100vw", margin: "0 auto", height: "100dvh" }}
    >
      {/* Gradient header — push-down, card sits below */}
      <div
        className="shrink-0 h-[130px] w-full z-20"
        style={{ background: "linear-gradient(to bottom, #d6c8ad 0%, rgba(214,200,173,0.75) 38.942%, rgba(214,200,173,0) 100%)" }}
      >
        <Link
          href="/"
          className="absolute left-[14px] top-[5px] block h-[120px] w-[160px]"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.06))" }}
        >
          <img
            src="/pawjai-logo.png"
            alt="PawJai"
            className="h-full w-full object-contain object-left"
          />
        </Link>
        <div className="absolute right-[16px] top-[20px]">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Snap scroll container */}
      <div
        ref={containerRef}
        onScroll={handleFeedScroll}
        className="flex-1 overflow-y-scroll overflow-x-hidden snap-y snap-mandatory"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        <style>{`.snap-mandatory::-webkit-scrollbar{display:none}`}</style>

        {dogs.length === 0 && (
          <div className="snap-start flex flex-col items-center justify-center gap-4 px-8 text-center" style={{ minHeight: "calc(100dvh - 134px)" }}>
            <p className="text-6xl">🐾</p>
            <p className="text-xl font-bold text-[#65584f]">{t("No dogs available yet")}</p>
            <p className="text-sm text-[#65584f]/60">{t("Shelters are getting ready — check back soon!")}</p>
          </div>
        )}

        {feed.map((item, idx) =>
          item.kind === "ad" ? (
            <div
              key={item.key}
              className="snap-start flex items-start justify-center px-[16px] pt-[10px]"
              style={{ minHeight: "calc(100dvh - 134px)", scrollSnapStop: "always" }}
            >
              <AdCard ad={item.ad} cardWidth={CARD_W} cardHeight={CARD_H} />
            </div>
          ) : (
            <div
              key={item.dog.id}
              className="snap-start flex items-start justify-center px-[16px] pt-[10px]"
              style={{ minHeight: "calc(100dvh - 134px)", scrollSnapStop: "always" }}
            >
              <SwipeDogCard
                dog={item.dog}
                initialSaved={savedIds.includes(item.dog.id)}
                isActive={isActiveDogFeedItem(item, idx, activeIndex)}
                isLoggedIn={isLoggedIn}
                cardWidth={CARD_W}
                cardHeight={CARD_H}
              />
            </div>
          )
        )}

        {/* End of feed */}
        {dogs.length > 0 && (
          <div
            className="snap-start flex flex-col items-center justify-center gap-5 px-6 text-center"
            style={{ minHeight: "calc(100dvh - 134px)", scrollSnapStop: "always" }}
          >
            <p className="font-['Montserrat',sans-serif] text-[18px] font-semibold text-[#65584f]" style={{ fontFamily: "Montserrat, sans-serif" }}>{t("You've seen them all!")}</p>
            <p className="text-[14px] text-[#65584f]/60" style={{ fontFamily: "Montserrat, sans-serif" }}>{t("All available dogs are shown above.")}</p>
            <Link
              href="/filter"
              className="bg-[#cd8188] text-white font-semibold px-[24px] py-[12px] rounded-[22px] shadow-lg active:bg-[#b87179] hover:bg-[#b87179] flex items-center gap-[8px]"
              style={{ fontFamily: "Montserrat, sans-serif", fontSize: 14 }}
            >
              {t("Set preferences")}
            </Link>
            <button
              onClick={scrollToTop}
              className="bg-[#cd8188] text-white font-semibold px-[32px] py-[14px] rounded-[22px] shadow-lg active:bg-[#b87179] hover:bg-[#b87179] flex items-center gap-[12px]"
              style={{ fontFamily: "Montserrat, sans-serif", fontSize: 16 }}
            >
              {t("Back to top")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
