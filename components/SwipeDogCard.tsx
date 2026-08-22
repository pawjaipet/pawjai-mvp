"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarDays, Bookmark, Info } from "lucide-react";
import { toggleWishlistAction } from "@/app/actions/wishlist";
import { useAuthModal } from "@/components/auth/AuthProvider";
import DogVideoFrame from "@/components/dogs/DogVideoFrame";
import TreatButton from "@/components/donations/TreatButton";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { translateAgeLabel, translateDogValue } from "@/components/i18n/translations";
import type { Dog, DogPhoto, DogTrait } from "@/types/database";
import { canonicalizeBreedLabel } from "@/utils/dog-breeds";
import { normalizeDogMediaUrl, type DogMediaItem } from "@/utils/dog-media";

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

function CurvedShareArrow() {
  return (
    <svg
      aria-hidden="true"
      width="31"
      height="31"
      viewBox="0 0 64 64"
      fill="none"
      className="translate-x-[1px]"
    >
      <path
        d="M10 50C12 33 24 22 38 21V10L56 28L38 46V35C26 35 16 39 10 50Z"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const [saved, setSaved]       = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const { openAuthModal } = useAuthModal();
  const { language, t } = useLanguage();

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
    publicUrl: normalizeDogMediaUrl(photo.public_url),
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
            posterUrl: normalizeDogMediaUrl(dog.video.poster_url) ?? photoMedia[0]?.publicUrl ?? null,
            publicUrl: normalizeDogMediaUrl(dog.video.public_url),
            sortOrder: -1,
            type: "video" as const,
          },
          ...photoMedia.map((photo, index) => ({ ...photo, isCover: false, sortOrder: index })),
        ]
      : photoMedia;
  const breedLabel = canonicalizeBreedLabel(dog.breed);
  const breedDisplay = breedLabel || "Breed not set";

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
        reason: t("Sign in to save dogs to your wishlist."),
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

  const primaryTags: string[] = [
    breedDisplay,
    ageLabel(dog.age_months) ?? "",
    dog.gender === "unknown" ? "Unknown" : dog.gender === "male" ? "Male" : "Female",
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
              {item.type === "video" && item.publicUrl ? (
                <DogVideoFrame
                  active={isActive && i === imgIdx}
                  alt={dog.name}
                  className="w-full h-full object-cover"
                  posterUrl={item.posterUrl}
                  videoUrl={item.publicUrl}
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

      {orderedMedia.length > 1 && (
        <div className="pointer-events-none absolute left-4 right-4 top-[10px] z-20 flex gap-[5px]">
          {orderedMedia.map((item, i) => (
            <div
              key={item.id}
              className="h-[5px] flex-1 overflow-hidden rounded-full bg-white/45"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: i === imgIdx ? "100%" : "0%",
                  background: "#cd8188",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Dog name + breed overlay */}
      <div className={`absolute left-4 right-20 pointer-events-none z-10 ${orderedMedia.length > 1 ? "top-[34px]" : "top-4"}`}>
        <p
          className="font-black text-[36px] leading-[1.0] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] break-words"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {dog.name}
        </p>
        <p
          className="font-black text-[18px] leading-[1.1] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] break-words mt-[6px]"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {translateDogValue(breedDisplay, language)}
        </p>
      </div>

      {/* Tags overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {primaryTags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className={`${TAG_BEIGE} min-w-0 truncate rounded-[22px] px-[12px] py-[7px] text-[13px] font-semibold leading-none ${i === 0 ? "max-w-[44%]" : "max-w-[25%]"} shrink`}
            >
              {translateDogValue(translateAgeLabel(tag, language), language)}
            </span>
          ))}
          <Link
            href={`/dogs/${dog.id}`}
            className={`${TAG_ROSE} flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full active:scale-95 transition-transform`}
            aria-label={t("View dog details")}
          >
            <Info size={17} strokeWidth={2.6} />
          </Link>
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute right-4 top-1/2 -translate-y-[calc(50%-50px)] flex flex-col gap-4 z-10">
        <button
          onClick={handleShare}
          className="bg-[#cd8188] w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          aria-label={t("Share")}
        >
          <CurvedShareArrow />
        </button>
        <Link
          href={`/schedule/${dog.id}`}
          className="bg-[#cd8188] w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          aria-label={t("Book appointment")}
        >
          <CalendarDays size={24} stroke="white" strokeWidth={2} />
        </Link>
        <button
          onClick={handleBookmark}
          disabled={pending}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-60"
          style={{ background: saved ? "#65584f" : "#cd8188" }}
          aria-label={saved ? t("Saved") : t("Save")}
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
