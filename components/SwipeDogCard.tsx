"use client";

import { useRef, useState, useTransition, useLayoutEffect } from "react";
import Link from "next/link";
import { Share2, CalendarDays, Bookmark } from "lucide-react";
import { toggleWishlistAction } from "@/app/actions/wishlist";
import { useAuthModal } from "@/components/auth/AuthProvider";
import TreatButton from "@/components/donations/TreatButton";
import type { Dog, DogPhoto, DogTrait } from "@/types/database";
import type { DogMediaItem } from "@/utils/dog-media";

export type SwipeDog = Dog & {
  photos: Pick<DogPhoto, "public_url" | "is_cover" | "sort_order">[];
  traits?: Pick<DogTrait, "trait_type" | "trait_value">[];
  media?: DogMediaItem[];
  video?: { poster_url: string | null; public_url: string } | null;
  shelter_name?: string | null;
};

function ageLabel(months: number | null) {
  if (!months) return null;
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y}y ${m}mo` : `${y}y`;
}

// Subtle shadow so beige tags stay visible on placeholder beige background
const TAG_BEIGE = "bg-[#d6c8ad] text-black shadow-[0_1px_4px_rgba(0,0,0,0.18)]";
const TAG_ROSE  = "bg-[#cd8188] text-white shadow-[0_1px_4px_rgba(0,0,0,0.18)]";

interface Props {
  dog: SwipeDog;
  initialSaved: boolean;
  isLoggedIn: boolean;
  isActive?: boolean;
  cardWidth?: number | string;
  cardHeight?: number | string;
}

export default function SwipeDogCard({
  dog,
  initialSaved,
  isLoggedIn,
  isActive = true,
  // CSS clamp: max Figma 370x620, shrinks on narrow viewports / small dvh
  cardWidth = "min(370px, calc(100vw - 32px))",
  cardHeight = "min(620px, calc(100dvh - 160px))",
}: Props) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [imgIdx, setImgIdx]     = useState(0);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [visibleTagCount, setVisibleTagCount] = useState(10);
  const collapsedRowRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved]       = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const { openAuthModal } = useAuthModal();

  const photos = dog.photos.length
    ? dog.photos
    : [{ public_url: null, is_cover: true, sort_order: 0 }];

  const orderedPhotos = [...photos].sort((a, b) => {
    if (a.is_cover) return -1;
    if (b.is_cover) return 1;
    return a.sort_order - b.sort_order;
  });
  const photoMedia = orderedPhotos.map((photo, index) => ({
    id: `photo-${index}`,
    isCover: photo.is_cover,
    posterUrl: null,
    publicUrl: photo.public_url,
    sortOrder: photo.sort_order,
    type: "photo" as const,
  }));
  const orderedMedia = dog.media?.length
    ? dog.media
    : dog.video?.public_url
      ? [
          {
            id: "legacy-cover-video",
            isCover: true,
            posterUrl: dog.video.poster_url ?? photoMedia[0]?.publicUrl ?? null,
            publicUrl: dog.video.public_url,
            sortOrder: -1,
            type: "video" as const,
          },
          ...photoMedia.map((photo, index) => ({ ...photo, isCover: false, sortOrder: index })),
        ]
      : photoMedia;
  const personalityTags =
    dog.traits
      ?.filter((trait) => trait.trait_type === "personality")
      .map((trait) => trait.trait_value)
      .slice(0, 4) ?? [];

  useLayoutEffect(() => {
    const row = collapsedRowRef.current;
    if (!row) return;
    const GAP = 6; // gap-1.5 = 6px
    const PLUS_W = 48; // "+" pill approximate width
    const available = row.offsetWidth - PLUS_W - GAP;
    const spans = Array.from(row.querySelectorAll<HTMLElement>("[data-tag]"));
    let used = 0, count = 0;
    for (const span of spans) {
      const add = (count > 0 ? GAP : 0) + span.offsetWidth;
      if (used + add > available) break;
      used += add;
      count++;
    }
    setVisibleTagCount(Math.max(1, count));
  }, []);

  function onCarouselScroll() {
    if (!carouselRef.current) return;
    const idx = Math.round(carouselRef.current.scrollLeft / carouselRef.current.offsetWidth);
    setImgIdx(idx);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: dog.name, url: `/dogs/${dog.id}` }).catch(() => {});
    }
  }

  function handleBookmark() {
    if (!isLoggedIn) {
      openAuthModal({
        nextPath: "/swipe",
        reason: "Sign in to save dogs to your wishlist.",
      });
      return;
    }
    const next = !saved;
    setSaved(next); // optimistic
    startTransition(async () => {
      const result = await toggleWishlistAction(dog.id);
      if (result.error) setSaved(!next); // rollback on error
    });
  }

  // Collapsed tags
  const collapsedTags: string[] = [
    dog.breed ?? "Mixed",
    ageLabel(dog.age_months) ?? "",
    dog.gender === "unknown" ? "Unknown" : dog.gender === "male" ? "Male" : "Female",
  ].filter(Boolean);

  // Expanded rows
  const row1: string[] = [
    dog.breed ?? "Mixed",
    ageLabel(dog.age_months) ?? "",
    ...personalityTags.slice(0, 2),
    dog.energy_level ? `${dog.energy_level.charAt(0).toUpperCase() + dog.energy_level.slice(1)} energy` : "",
    dog.sterilized ? "Sterilized" : "",
  ].filter(Boolean);

  const row2: string[] = [
    dog.gender === "unknown" ? "Unknown" : dog.gender === "male" ? "Male" : "Female",
    ...personalityTags.slice(2),
    dog.size ? dog.size.replace("_", " ") : "",
    dog.weight_kg ? `${dog.weight_kg}kg` : "",
    dog.good_with_kids ? "Good w/ kids" : "",
    dog.good_with_dogs ? "Good w/ dogs" : "",
    dog.good_with_cats ? "Good w/ cats" : "",
    dog.house_trained ? "House trained" : "",
  ].filter(Boolean);

  return (
    <div className="relative" style={{ width: cardWidth }}>
      {/* Image carousel */}
      <div
        ref={carouselRef}
        onScroll={onCarouselScroll}
        className="flex overflow-x-auto snap-x snap-mandatory rounded-[22px]"
        style={{ width: cardWidth, scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {orderedMedia.map((item, i) => (
          <Link key={item.id} href={`/dogs/${dog.id}`} className="snap-center block flex-shrink-0" style={{ width: cardWidth }}>
            <div className="rounded-[22px] overflow-hidden bg-[#d6c8ad]" style={{ height: cardHeight, width: cardWidth }}>
              {item.type === "video" && item.publicUrl && isActive && i === imgIdx ? (
                <video
                  src={item.publicUrl}
                  poster={item.posterUrl ?? undefined}
                  className="h-full w-full object-cover"
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                />
              ) : item.type === "video" && item.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.posterUrl}
                  alt={dog.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : item.type === "photo" && item.publicUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.publicUrl}
                  alt={dog.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl select-none">🐾</div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Dog name + breed overlay */}
      <div className="absolute top-4 left-4 right-20 pointer-events-none z-10">
        <p
          className="font-black text-[36px] leading-[1.0] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] break-words"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {dog.name}
        </p>
        {dog.breed && (
          <p
            className="font-black text-[18px] leading-[1.1] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] break-words mt-[6px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {dog.breed}
          </p>
        )}
      </div>

      {/* Image dots */}
      {orderedMedia.length > 1 && (
        <div className="absolute bottom-[90px] left-0 right-0 flex justify-center pointer-events-none z-10">
          <div className="bg-[rgba(214,200,173,0.5)] px-[12px] py-[6px] rounded-[12px] flex gap-[8px]">
            {orderedMedia.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${i === imgIdx ? "bg-[#cd8188]" : "bg-[rgba(101,88,79,0.3)]"}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tags overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        {!tagsOpen ? (
          <div ref={collapsedRowRef} className="flex gap-1.5 items-center overflow-hidden">
            {collapsedTags.map((t, i) => (
              <span
                key={t}
                data-tag
                className={`${TAG_BEIGE} text-[14px] font-semibold px-[14px] py-[7px] rounded-[22px] whitespace-nowrap shrink-0${i >= visibleTagCount ? " hidden" : ""}`}
              >{t}</span>
            ))}
            <button
              onClick={() => setTagsOpen(true)}
              className={`${TAG_ROSE} text-[14px] font-semibold px-[14px] py-[7px] rounded-[22px] shrink-0 active:scale-95 transition-transform`}
            >
              +
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-1.5 w-max">
              {row1.map((t) => (
                <span key={t} className={`${TAG_BEIGE} text-[14px] font-semibold px-[14px] py-[7px] rounded-[22px] whitespace-nowrap`}>{t}</span>
              ))}
              <button
                onClick={() => setTagsOpen(false)}
                className={`${TAG_ROSE} text-[14px] font-semibold px-[14px] py-[7px] rounded-[22px] active:scale-95 transition-transform`}
              >
                −
              </button>
            </div>
            <div className="flex gap-1.5 w-max">
              {row2.map((t) => (
                <span key={t} className={`${TAG_BEIGE} text-[14px] font-semibold px-[14px] py-[7px] rounded-[22px] whitespace-nowrap`}>{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="absolute right-4 top-1/2 -translate-y-[calc(50%-50px)] flex flex-col gap-4 z-10">
        <button
          onClick={handleShare}
          className="bg-[#cd8188] w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          aria-label="Share"
        >
          <Share2 size={24} stroke="white" strokeWidth={2} />
        </button>
        <Link
          href={`/schedule/${dog.id}`}
          className="bg-[#cd8188] w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          aria-label="Book appointment"
        >
          <CalendarDays size={24} stroke="white" strokeWidth={2} />
        </Link>
        <button
          onClick={handleBookmark}
          disabled={pending}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-60"
          style={{ background: saved ? "#65584f" : "#cd8188" }}
          aria-label={saved ? "Saved" : "Save"}
        >
          <Bookmark size={24} stroke="white" fill={saved ? "white" : "none"} strokeWidth={2} />
        </button>
      </div>

      {/* Treat button — left edge, vertically aligned with the bookmark button */}
      <div className="absolute left-4 top-1/2 translate-y-[94px] z-10">
        <TreatButton
          variant="swipe"
          dogId={dog.id}
          dogName={dog.name}
          shelterId={dog.shelter_id}
          shelterName={dog.shelter_name ?? "their shelter"}
          dogPhotoUrl={photoMedia[0]?.publicUrl ?? null}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </div>
  );
}
