"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import SwipeDogCard, { type SwipeDog } from "./SwipeDogCard";
import AdCard from "./AdCard";
import type { Ad } from "@/utils/ads";
import { buildSwipeFeed, isActiveDogFeedItem } from "@/utils/swipe-feed-model";

// Match Figma site visible proportions (370 x 540, aspect ~1:1.46).
// Photos / videos / ad images use object-cover so cropping handles
// any source aspect ratio. CSS clamp scales DOWN on tiny viewports.
const CARD_W = "min(370px, calc(100vw - 32px))";
const CARD_H = "min(540px, calc(100dvh - 160px))";
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
      {/* Gradient overlay — floats above cards, pointer-events-none so scroll still works */}
      <div
        className="absolute top-0 left-0 right-0 h-[170px] pointer-events-none z-20"
        style={{ background: "linear-gradient(to bottom, #d6c8ad 0%, rgba(214,200,173,0.75) 38.942%, rgba(214,200,173,0) 100%)" }}
      >
        <Link
          href="/"
          className="pointer-events-auto absolute left-[14px] top-[5px] block h-[150px] w-[150px]"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.06))" }}
        >
          <img
            src="/pawjai-logo.png"
            alt="PawJai"
            className="h-full w-full object-contain object-left"
          />
        </Link>
      </div>

      {/* Snap scroll container — full height, gradient overlays from above */}
      <div
        ref={containerRef}
        onScroll={handleFeedScroll}
        className="h-full overflow-y-scroll overflow-x-hidden snap-y snap-mandatory"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        <style>{`.snap-mandatory::-webkit-scrollbar{display:none}`}</style>

        {dogs.length === 0 && (
          <div className="snap-start flex flex-col items-center justify-center gap-4 px-8 text-center" style={{ minHeight: "100dvh" }}>
            <p className="text-6xl">🐾</p>
            <p className="text-xl font-bold text-[#65584f]">No dogs available yet</p>
            <p className="text-sm text-[#65584f]/60">Shelters are getting ready — check back soon!</p>
          </div>
        )}

        {feed.map((item, idx) =>
          item.kind === "ad" ? (
            <div
              key={item.key}
              className="snap-start flex items-start justify-center px-[16px] pt-[10px]"
              style={{ minHeight: "100dvh", scrollSnapStop: "always" }}
            >
              <AdCard ad={item.ad} cardWidth={CARD_W} cardHeight={CARD_H} />
            </div>
          ) : (
            <div
              key={item.dog.id}
              className="snap-start flex items-start justify-center px-[16px] pt-[10px]"
              style={{ minHeight: "100dvh", scrollSnapStop: "always" }}
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
            style={{ minHeight: "100dvh", scrollSnapStop: "always" }}
          >
            <p className="font-['Montserrat',sans-serif] text-[18px] font-semibold text-[#65584f]" style={{ fontFamily: "Montserrat, sans-serif" }}>You&apos;ve seen them all!</p>
            <p className="text-[14px] text-[#65584f]/60" style={{ fontFamily: "Montserrat, sans-serif" }}>All available dogs are shown above.</p>
            <Link
              href="/filter"
              className="bg-[#cd8188] text-white font-semibold px-[24px] py-[12px] rounded-[22px] shadow-lg active:bg-[#b87179] hover:bg-[#b87179] flex items-center gap-[8px]"
              style={{ fontFamily: "Montserrat, sans-serif", fontSize: 14 }}
            >
              Set preferences
            </Link>
            <button
              onClick={scrollToTop}
              className="bg-[#cd8188] text-white font-semibold px-[32px] py-[14px] rounded-[22px] shadow-lg active:bg-[#b87179] hover:bg-[#b87179] flex items-center gap-[12px]"
              style={{ fontFamily: "Montserrat, sans-serif", fontSize: 16 }}
            >
              Back to top
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
