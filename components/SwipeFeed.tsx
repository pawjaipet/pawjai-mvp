"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import SwipeDogCard, { type SwipeDog } from "./SwipeDogCard";

interface Props {
  dogs: SwipeDog[];
  savedIds: string[];
  isLoggedIn: boolean;
}

export default function SwipeFeed({ dogs, savedIds, isLoggedIn }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function scrollToTop() {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div
      className="relative flex flex-col bg-white h-screen overflow-hidden"
      style={{ width: 402, maxWidth: "100vw", margin: "0 auto" }}
    >
      {/* Swipe page header — 70px, logo centered, hamburger right */}
      <div
        className="bg-gradient-to-b from-[#d6c8ad] h-[70px] pointer-events-auto shrink-0 to-[rgba(214,200,173,0)] via-[38.942%] via-[rgba(214,200,173,0.75)] w-full z-20"
      >
        <div className="absolute content-stretch flex items-center justify-center left-[8px] top-[20px] w-[386px]">
          <Link href="/swipe" className="block h-[55px] w-[110px] relative">
            <img
              src="/pawjai-logo.png"
              alt="PawJai"
              className="h-full w-full object-contain object-center"
            />
          </Link>
        </div>
        {/* Hamburger menu */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="absolute right-[16px] top-[27px] h-[16px] w-[20px] flex flex-col justify-between cursor-pointer z-30"
          aria-label="Menu"
        >
          <span className="absolute bg-[#65584f] h-[2px] left-0 rounded-[10px] top-0 w-[20px]" />
          <span className="absolute bg-[#65584f] h-[2px] left-0 rounded-[10px] top-[7px] w-[20px]" />
          <span className="absolute bg-[#65584f] h-[2px] left-0 rounded-[10px] top-[14px] w-[20px]" />
        </button>
      </div>

      {/* Hamburger dropdown */}
      {menuOpen && (
        <div className="absolute top-[70px] right-[12px] z-50 bg-[#65584f] rounded-[12px] shadow-lg overflow-hidden">
          {[
            { label: "My wishlist", href: "/profile" },
            { label: "Appointments", href: "/appointments" },
            { label: "Preferences", href: "/filter" },
            { label: "Messages", href: "/messages" },
            { label: "More", href: "/more" },
          ].map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-[20px] py-[14px] text-white font-['Montserrat',sans-serif] text-[14px] hover:bg-[#524739] active:bg-[#524739] ${i > 0 ? "border-t border-white/10" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Snap scroll container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll overflow-x-hidden snap-y snap-mandatory"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        <style>{`.snap-mandatory::-webkit-scrollbar{display:none}`}</style>

        {dogs.length === 0 && (
          <div className="snap-start h-full min-h-[calc(100vh-70px)] flex flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-6xl">🐾</p>
            <p className="text-xl font-bold text-[#65584f]">No dogs available yet</p>
            <p className="text-sm text-[#65584f]/60">Shelters are getting ready — check back soon!</p>
          </div>
        )}

        {dogs.map((dog, idx) => (
          <div
            key={dog.id}
            className={`snap-start h-full ${idx === 0 ? "min-h-[calc(100vh-74px)] flex items-start justify-center px-[16px] pt-[10px]" : "min-h-[calc(100vh-108px)] flex items-center justify-center px-[16px]"}`}
            style={{ scrollSnapStop: "always" }}
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
