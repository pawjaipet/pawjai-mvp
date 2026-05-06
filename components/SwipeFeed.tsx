"use client";

import Link from "next/link";
import { useRef } from "react";
import SwipeDogCard, { type SwipeDog } from "./SwipeDogCard";
import { ChevronUp } from "lucide-react";

interface Props {
  dogs: SwipeDog[];
  savedIds: string[];
  isLoggedIn: boolean;
}

export default function SwipeFeed({ dogs, savedIds, isLoggedIn }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  function scrollToTop() {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div
      className="relative flex flex-col bg-white"
      style={{ width: 402, maxWidth: "100vw", margin: "0 auto", height: "100dvh" }}
    >
      {/* Sticky header with gradient */}
      <div
        className="absolute top-0 left-0 right-0 z-20 pointer-events-none h-[94px]"
        style={{
          background:
            "linear-gradient(to bottom, #d6c8ad 0%, rgba(214,200,173,0.75) 38.942%, rgba(214,200,173,0) 100%)",
        }}
      >
        <div className="pointer-events-auto absolute left-[8px] top-[39px]">
          <Link href="/swipe" className="block h-[55px] w-[110px] relative">
            <img
              src="/pawjai-logo.png"
              alt="PawJai"
              className="h-full w-full object-contain object-left"
            />
          </Link>
        </div>
      </div>

      {/* Snap scroll container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll overflow-x-hidden snap-y snap-mandatory"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        <style>{`.snap-mandatory::-webkit-scrollbar{display:none}`}</style>

        {dogs.length === 0 && (
          <div className="snap-start h-[calc(100dvh-70px)] flex flex-col items-center justify-center gap-4 px-8 text-center mt-[70px]">
            <p className="text-6xl">🐾</p>
            <p className="text-xl font-bold text-[#65584f]">No dogs available yet</p>
            <p className="text-sm text-[#65584f]/60">Shelters are getting ready — check back soon!</p>
          </div>
        )}

        {dogs.map((dog) => (
          <div
            key={dog.id}
            className="snap-start flex items-start justify-center px-4 pt-[80px] pb-[80px]"
            style={{ minHeight: "100dvh", scrollSnapStop: "always" }}
          >
            <SwipeDogCard
              dog={dog}
              initialSaved={savedIds.includes(dog.id)}
              isLoggedIn={isLoggedIn}
            />
          </div>
        ))}

        {/* End of feed */}
        {dogs.length > 0 && (
          <div
            className="snap-start flex flex-col items-center justify-center gap-5 px-6 text-center"
            style={{ minHeight: "100dvh", scrollSnapStop: "always" }}
          >
            <p className="text-xl font-bold text-[#65584f]">You've seen them all!</p>
            <p className="text-sm text-[#65584f]/60">All available dogs are shown above.</p>
            <Link
              href="/filter"
              className="bg-[#cd8188] text-white font-semibold px-6 py-3 rounded-full shadow-lg active:scale-95 transition-transform"
            >
              Set preferences
            </Link>
            <button
              onClick={scrollToTop}
              className="mt-2 bg-[#65584f] text-white font-semibold px-8 py-3.5 rounded-full shadow-lg active:scale-95 transition-transform flex items-center gap-3"
            >
              <ChevronUp size={20} stroke="white" strokeWidth={2.5} />
              Back to top
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
