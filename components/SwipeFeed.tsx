"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import SwipeDogCard, { type SwipeDog } from "./SwipeDogCard";
import AdCard from "./AdCard";
import SwipeFeedTutorial from "@/components/SwipeFeedTutorial";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { Ad } from "@/utils/ads";
import { sendProductAnalyticsEvent } from "@/utils/product-analytics-client";
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
  const activeIndexRef = useRef(0);
  const backwardFeedSwipesRef = useRef(0);
  const feedVisitIdRef = useRef<string | null>(null);
  const forwardFeedSwipesRef = useRef(0);
  const seenDogIdsRef = useRef(new Set<string>());
  const settledIndexRef = useRef(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visitStartedAtRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFallbackNotice, setShowFallbackNotice] = useState(showNoFilterResultsNotice);
  const { t } = useLanguage();

  const feed = useMemo(() => buildSwipeFeed(dogs, ads, AD_EVERY), [ads, dogs]);

  const ensureFeedVisit = useCallback(() => {
    feedVisitIdRef.current ??= window.crypto.randomUUID();
    visitStartedAtRef.current ??= Date.now();
    return feedVisitIdRef.current;
  }, []);

  const trackDogImpression = useCallback((index: number) => {
    const item = feed[index];
    if (!item || item.kind !== "dog" || seenDogIdsRef.current.has(item.dog.id)) return;

    const feedVisitId = ensureFeedVisit();
    seenDogIdsRef.current.add(item.dog.id);
    sendProductAnalyticsEvent({
      dedupeKey: `feed-impression:${feedVisitId}:${item.dog.id}`,
      dogId: item.dog.id,
      eventName: "dog_feed_impression",
      metadata: {
        cardPosition: index + 1,
        dogPosition: item.dogIndex + 1,
        feedVisitId,
        totalDogs: dogs.length,
      },
    });
  }, [dogs.length, ensureFeedVisit, feed]);

  const settleFeedIndex = useCallback((index: number) => {
    const previousIndex = settledIndexRef.current;
    if (index === previousIndex) return;

    if (index > previousIndex) {
      forwardFeedSwipesRef.current += index - previousIndex;
    } else {
      backwardFeedSwipesRef.current += previousIndex - index;
    }
    settledIndexRef.current = index;
    trackDogImpression(index);
  }, [trackDogImpression]);

  const sendFeedSummary = useCallback((exitReason: string) => {
    if (dogs.length === 0 || visitStartedAtRef.current === null) return;

    if (settleTimerRef.current !== null) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
      settleFeedIndex(activeIndexRef.current);
    }

    const feedVisitId = ensureFeedVisit();
    const durationSeconds = Math.max(0, Math.round((Date.now() - visitStartedAtRef.current) / 1000));
    const totalFeedSwipes = forwardFeedSwipesRef.current + backwardFeedSwipesRef.current;
    const reachedEnd = activeIndexRef.current >= feed.length || seenDogIdsRef.current.size >= dogs.length;
    sendProductAnalyticsEvent({
      dedupeKey: `feed-summary:${feedVisitId}:${seenDogIdsRef.current.size}:${totalFeedSwipes}:${durationSeconds}`,
      eventName: "feed_session_summary",
      metadata: {
        backwardFeedSwipes: backwardFeedSwipesRef.current,
        dogsViewed: seenDogIdsRef.current.size,
        durationSeconds,
        exitReason,
        feedVisitId,
        forwardFeedSwipes: forwardFeedSwipesRef.current,
        reachedEnd,
        totalFeedSwipes,
        totalDogs: dogs.length,
      },
    });
  }, [dogs.length, ensureFeedVisit, feed.length, settleFeedIndex]);

  useEffect(() => {
    setShowFallbackNotice(showNoFilterResultsNotice);
  }, [showNoFilterResultsNotice]);

  useEffect(() => {
    if (dogs.length === 0) return;

    ensureFeedVisit();
    trackDogImpression(activeIndexRef.current);
    const handlePageHide = () => sendFeedSummary("page_hidden");
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") sendFeedSummary("page_hidden");
    };

    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      sendFeedSummary("navigation");
    };
  }, [dogs.length, ensureFeedVisit, sendFeedSummary, trackDogImpression]);

  function scrollToTop() {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFeedScroll() {
    if (!containerRef.current) return;
    const sectionHeight = containerRef.current.clientHeight;
    if (sectionHeight <= 0) return;
    const nextIndex = Math.round(containerRef.current.scrollTop / sectionHeight);
    const clampedIndex = Math.min(Math.max(nextIndex, 0), Math.max(feed.length, 0));
    if (clampedIndex === activeIndexRef.current) return;

    activeIndexRef.current = clampedIndex;
    setActiveIndex(clampedIndex);
    if (settleTimerRef.current !== null) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      settleTimerRef.current = null;
      settleFeedIndex(clampedIndex);
    }, 180);
  }

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{ width: 402, maxWidth: "100vw", margin: "0 auto", height: "100dvh", background: "#F5EEDD" }}
    >
      {/* Solid header — push-down, card sits below */}
      <div
        className="shrink-0 h-[110px] w-full z-20"
        style={{ background: "#F5EEDD" }}
      >
        <Link
          href="/"
          className="absolute left-[16px] top-[17px] block h-[84px] w-[164px]"
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
