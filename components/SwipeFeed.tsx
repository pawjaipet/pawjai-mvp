"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import SwipeDogCard, { type SwipeDog } from "./SwipeDogCard";
import AdCard from "./AdCard";
import SwipeFeedTutorial from "@/components/SwipeFeedTutorial";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { Ad } from "@/utils/ads";
import { buildSwipeFeed, isActiveDogFeedItem } from "@/utils/swipe-feed-model";

const CARD_W = "min(370px, calc(100vw - 32px))";
const CARD_H = "min(590px, calc(100dvh - 200px))";
// Insert one live ad after every N dogs. The server shuffles active ads
// daily so limited slots rotate fairly when ad inventory is larger.
const AD_EVERY = 3;

interface Props {
  dogs: SwipeDog[];
  savedIds: string[];
  isLoggedIn: boolean;
  ads?: Ad[];
  showNoFilterResultsNotice?: boolean;
}

export default function SwipeFeed({ dogs, savedIds, isLoggedIn, ads = [], showNoFilterResultsNotice = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFallbackNotice, setShowFallbackNotice] = useState(showNoFilterResultsNotice);
  const { t } = useLanguage();

  const feed = buildSwipeFeed(dogs, ads, AD_EVERY);

  useEffect(() => {
    setShowFallbackNotice(showNoFilterResultsNotice);
  }, [showNoFilterResultsNotice]);

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
      className="relative flex flex-col overflow-hidden"
      style={{ width: 402, maxWidth: "100vw", margin: "0 auto", height: "100dvh", background: "#d6c8ad" }}
    >
      {/* Solid header — push-down, card sits below */}
      <div
        className="shrink-0 h-[110px] w-full z-20"
        style={{ background: "#d6c8ad" }}
      >
        <Link
          href="/"
          className="absolute left-[16px] top-[12px] block h-[84px] w-[164px]"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.06))" }}
        >
          <img
            src="/pawjai-logo.png"
            alt="PawJai"
            className="h-full w-full object-contain object-left"
          />
        </Link>
        <div className="absolute right-[16px] top-[34px]">
          <LanguageSwitcher />
        </div>
      </div>

      <SwipeFeedTutorial enabled={feed.length > 0} isLoggedIn={isLoggedIn} />

      {showFallbackNotice && (
        <div className="absolute left-[16px] right-[16px] top-[88px] z-30">
          <div
            className="flex items-start gap-[12px] rounded-[18px] bg-white px-[16px] py-[13px]"
            style={{ boxShadow: "0 14px 34px rgba(101,88,79,0.16)", border: "1px solid rgba(205,129,136,0.18)" }}
            role="status"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-[#65584f]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {t("No results found")}
              </p>
              <p className="mt-[3px] text-[12px] leading-[1.35] text-[#65584f]/62" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {t("Showing all dogs instead.")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFallbackNotice(false)}
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full transition-transform active:scale-95"
              style={{ background: "rgba(101,88,79,0.08)", color: "#65584f" }}
              aria-label={t("Close")}
            >
              <X size={15} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      )}

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
            className="snap-start flex items-start justify-center px-[16px] pt-[4px]"
            style={{ minHeight: "calc(100dvh - 114px)", scrollSnapStop: "always" }}
            >
              <AdCard ad={item.ad} cardWidth={CARD_W} cardHeight={CARD_H} />
            </div>
          ) : (
            <div
              key={item.dog.id}
              className="snap-start flex items-start justify-center px-[16px] pt-[4px]"
              style={{ minHeight: "calc(100dvh - 114px)", scrollSnapStop: "always" }}
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
            style={{ minHeight: "calc(100dvh - 114px)", scrollSnapStop: "always" }}
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
