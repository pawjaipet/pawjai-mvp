"use client";

import { useRef, useState, useTransition, type MouseEvent } from "react";
import Link from "next/link";
import { CalendarDays, Bookmark, Info, PawPrint } from "lucide-react";
import { toggleWishlistAction } from "@/app/actions/wishlist";
import { useAuthModal } from "@/components/auth/AuthProvider";
import DogVideoFrame from "@/components/dogs/DogVideoFrame";
import TreatButton from "@/components/donations/TreatButton";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { translateAgeLabel, translateDogValue } from "@/components/i18n/translations";
import type { Dog, DogPhoto, DogTrait } from "@/types/database";
import { canonicalizeBreedLabel } from "@/utils/dog-breeds";
import { normalizeDogMediaUrl, type DogMediaItem } from "@/utils/dog-media";
import { sendProductAnalyticsEvent } from "@/utils/product-analytics-client";

export type SwipeDog = Dog & {
  photos: Pick<DogPhoto, "public_url" | "is_cover" | "sort_order">[];
  traits?: Pick<DogTrait, "trait_type" | "trait_value">[];
  media?: DogMediaItem[];
  video?: { poster_url: string | null; public_url: string } | null;
  shelter_logo_url?: string | null;
  shelter_name?: string | null;
};

function ageLabel(months: number | null) {
  if (!months) return null;
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y}y ${m}mo` : `${y}y`;
}

// Soft lift so tags stay readable over busy dog photos.
const TAG_BEIGE = "bg-[#d6c8ad] text-black shadow-[0_7px_16px_rgba(0,0,0,0.20)] ring-1 ring-white/30";
const TAG_ROSE  = "bg-[#cd8188] text-white shadow-[0_7px_16px_rgba(0,0,0,0.22)] ring-1 ring-white/25";

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
  const [wishlistLimit, setWishlistLimit] = useState<number | null>(null);
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

  async function handleShare() {
    const shareUrl = new URL(`/dogs/${dog.id}`, window.location.origin).toString();

    try {
      if (navigator.share) {
        await navigator.share({ title: dog.name, url: shareUrl });
        sendProductAnalyticsEvent({
          dogId: dog.id,
          eventName: "dog_shared",
          metadata: { method: "native", source: "swipe_feed" },
        });
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        sendProductAnalyticsEvent({
          dogId: dog.id,
          eventName: "dog_shared",
          metadata: { method: "clipboard", source: "swipe_feed" },
        });
      }
    } catch {
      // Closing the native share sheet is not a completed share.
    }
  }

  function requireAuthForBooking(event: MouseEvent<HTMLAnchorElement>) {
    if (isLoggedIn) return;
    event.preventDefault();
    openAuthModal({
      nextPath: `/schedule/${dog.id}`,
      reason: t("Sign in or create an account to book this shelter visit."),
    });
  }

  function handleBookmark() {
    if (!isLoggedIn) {
      openAuthModal({
        nextPath: "/swipe",
        reason: t("Sign in or create an account to save dogs to your wishlist."),
      });
      return;
    }
    const next = !saved;
    setSaved(next); // optimistic
    startTransition(async () => {
      const result = await toggleWishlistAction(dog.id);
      if (result.error) {
        setSaved(!next); // rollback on error
        if (result.error === "wishlist_limit_reached") {
          setWishlistLimit(result.limit ?? 5);
        }
      }
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
        className="flex overflow-x-auto snap-x snap-mandatory rounded-[22px] shadow-[0_18px_44px_rgba(101,88,79,0.24)] ring-1 ring-white/35"
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

      {/* Shelter logo overlay */}
      <div className={`pointer-events-none absolute left-4 z-20 flex h-[66px] min-w-[90px] max-w-[156px] items-center justify-center overflow-hidden rounded-[20px] border border-white/60 bg-white/40 px-[8px] shadow-[0_10px_26px_rgba(0,0,0,0.16)] backdrop-blur-md ${orderedMedia.length > 1 ? "top-[30px]" : "top-4"}`}>
        {dog.shelter_logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dog.shelter_logo_url}
            alt={`${dog.shelter_name ?? "Shelter"} logo`}
            className="max-h-[58px] max-w-[144px] object-contain mix-blend-multiply contrast-110 saturate-110"
            draggable={false}
          />
        ) : (
          <PawPrint aria-hidden="true" size={25} stroke="#cd8188" strokeWidth={2.4} />
        )}
      </div>

      {/* Dog name, centered in the pocket above the tags */}
      <div className="pointer-events-none absolute bottom-[44px] left-4 right-4 z-10 flex h-[96px] items-center">
        <p
          className="max-w-[calc(100%-70px)] break-words text-[35px] font-black leading-[0.96] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {dog.name}
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
      <div className="absolute right-4 top-1/2 z-10 flex translate-y-[calc(-50%+36px)] flex-col gap-3.5">
        <TreatButton
          variant="swipe"
          dogId={dog.id}
          dogName={dog.name}
          shelterId={dog.shelter_id}
          shelterName={dog.shelter_name ?? "their shelter"}
          dogPhotoUrl={photoMedia[0]?.publicUrl ?? null}
          isLoggedIn={isLoggedIn}
        />
        <button
          type="button"
          onClick={handleShare}
          className="bg-[#cd8188] w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          aria-label={t("Share")}
        >
          <CurvedShareArrow />
        </button>
        <Link
          href={`/schedule/${dog.id}`}
          onClick={requireAuthForBooking}
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

      {wishlistLimit !== null && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 px-[18px]"
          onClick={() => setWishlistLimit(null)}
          style={{ paddingTop: "max(24px, env(safe-area-inset-top))", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[342px] rounded-[22px] bg-white px-[22px] py-[22px] text-center shadow-[0_20px_60px_rgba(0,0,0,0.24)]"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-[20px] font-extrabold text-[#65584f]" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {t("Wishlist limit reached")}
            </p>
            <p className="mt-[10px] text-[14px] leading-[1.55] text-[#65584f]/70" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {t("Your current plan can save up to")}
              {" "}
              <strong className="font-bold text-[#65584f]">{wishlistLimit}</strong>
              {" "}
              {t("dogs. Upgrade to keep more favorites close before they disappear or get adopted.")}
            </p>
            <div className="mt-[18px] flex flex-col gap-[10px]">
              <Link
                href="/settings/subscription"
                className="rounded-[14px] bg-[#cd8188] py-[12px] text-[14px] font-bold text-white active:scale-[0.99] transition-transform"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {t("View plans")}
              </Link>
              <button
                type="button"
                onClick={() => setWishlistLimit(null)}
                className="rounded-[14px] py-[10px] text-[13px] font-bold text-[#65584f]/68"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {t("Maybe later")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
