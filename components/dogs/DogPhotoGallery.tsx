"use client";

import { useRef, useState } from "react";
import { normalizeDogMediaUrl, type DogMediaItem } from "@/utils/dog-media";

interface Photo {
  id: string;
  public_url: string | null;
}

interface Props {
  photos: Photo[];
  dogName: string;
  media?: DogMediaItem[];
  videoUrl?: string | null;
  videoPosterUrl?: string | null;
}

export default function DogPhotoGallery({ photos, dogName, media, videoUrl, videoPosterUrl }: Props) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const fallbackMedia: DogMediaItem[] = videoUrl
    ? [
        {
          id: "legacy-cover-video",
          isCover: true,
          posterUrl: normalizeDogMediaUrl(videoPosterUrl) ?? normalizeDogMediaUrl(photos[0]?.public_url),
          publicUrl: normalizeDogMediaUrl(videoUrl),
          sortOrder: -1,
          type: "video",
        },
        ...photos.map((photo, index) => ({
          id: photo.id,
          isCover: false,
          posterUrl: null,
          publicUrl: normalizeDogMediaUrl(photo.public_url),
          sortOrder: index,
          type: "photo" as const,
        })),
      ]
    : photos.map((photo, index) => ({
        id: photo.id,
        isCover: index === 0,
        posterUrl: null,
        publicUrl: normalizeDogMediaUrl(photo.public_url),
        sortOrder: index,
        type: "photo" as const,
      }));
  const mediaItems = media?.length ? media : fallbackMedia;
  const galleryItems: DogMediaItem[] = mediaItems.length
    ? mediaItems
    : [
        {
          id: "placeholder",
          isCover: true,
          posterUrl: null,
          publicUrl: null,
          sortOrder: 0,
          type: "photo",
        },
      ];

  function onCarouselScroll() {
    if (!carouselRef.current) return;
    const idx = Math.round(carouselRef.current.scrollLeft / carouselRef.current.offsetWidth);
    setActiveIdx(Math.min(Math.max(idx, 0), galleryItems.length - 1));
  }

  return (
    <div className="w-full relative overflow-hidden" style={{ height: 360, background: "#d6c8ad" }}>
      <style>{`.dog-detail-carousel::-webkit-scrollbar{display:none}`}</style>
      <div
        ref={carouselRef}
        onScroll={onCarouselScroll}
        className="dog-detail-carousel flex h-full w-full snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {galleryItems.map((item, i) => (
          <div key={item.id} className="h-full w-full shrink-0 snap-center">
            {item.type === "video" && item.publicUrl ? (
              <video
                src={item.publicUrl}
                poster={item.posterUrl ?? undefined}
                className="h-full w-full object-cover"
                muted
                loop
                playsInline
                autoPlay={i === activeIdx}
                preload="metadata"
              />
            ) : item.publicUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.publicUrl}
                alt={dogName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl">🐾</div>
            )}
          </div>
        ))}
      </div>

      {galleryItems.length > 1 && (
        <div className="pointer-events-none absolute bottom-[20px] left-[102px] right-[86px] z-10 flex gap-[5px]">
          {galleryItems.map((item, i) => (
            <div
              key={item.id}
              className="h-[5px] flex-1 overflow-hidden rounded-full bg-white/48"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.16)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: i === activeIdx ? "100%" : "0%",
                  background: "#cd8188",
                }}
              />
            </div>
          ))}
        </div>
      )}

      <img
        src="/pawjai-logo.png"
        alt=""
        aria-hidden="true"
        className="absolute bottom-[13px] left-[14px] z-10 pointer-events-none select-none"
        style={{
          height: "32px",
          width: "auto",
          filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.32))",
          opacity: 0.88,
        }}
      />

      {galleryItems[activeIdx]?.type === "video" ? (
        <span
          className="absolute bottom-[48px] left-[16px] z-10 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white"
        >
          Video
        </span>
      ) : null}
    </div>
  );
}
