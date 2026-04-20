"use client";

import Link from "next/link";
import { useRef } from "react";
import SwipeDogCard, { type SwipeDog } from "./SwipeDogCard";
import { ChevronUp } from "lucide-react";

export default function SwipeFeed({ dogs }: { dogs: SwipeDog[] }) {
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
        className="absolute top-0 left-0 right-0 z-20 pointer-events-none h-[70px]"
        style={{ background: "linear-gradient(to bottom, #d6c8ad 0%, rgba(214,200,173,0.75) 39%, rgba(214,200,173,0) 100%)" }}
      >
        <div className="pointer-events-auto flex items-center justify-center pt-5">
          <Link href="/" className="block h-[40px]">
            <span className="text-2xl font-black text-[#65584f] tracking-tight">PawJai</span>
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

        {dogs.map((dog, i) => (
          <div
            key={dog.id}
            className="snap-start flex items-start justify-center px-4 pt-[80px] pb-[80px]"
            style={{ minHeight: "100dvh", scrollSnapStop: "always" }}
          >
            <SwipeDogCard dog={dog} />
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
              href="/profile"
              className="bg-[#cd8188] text-white font-semibold px-6 py-3 rounded-full shadow-lg active:scale-95 transition-transform"
            >
              Upgrade for unlimited browsing
            </Link>
            <button
              onClick={scrollToTop}
              className="mt-4 bg-[#cd8188] text-white font-semibold px-8 py-3.5 rounded-full shadow-lg active:scale-95 transition-transform flex items-center gap-3"
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
