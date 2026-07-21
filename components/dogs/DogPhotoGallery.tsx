"use client";

import { useState } from "react";
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
  const active = mediaItems[activeIdx] ?? null;

  return (
    <>
      {/* Hero photo / video — full bleed */}
      <div className="w-full relative" style={{ height: 360, background: "#d6c8ad" }}>
        {active?.type === "video" && active.publicUrl ? (
          <video
            src={active.publicUrl}
            poster={active.posterUrl ?? undefined}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
          />
        ) : active?.publicUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active.publicUrl}
            alt={dogName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">🐾</div>
        )}
      </div>

      {/* Thumbnails strip */}
      {mediaItems.length > 1 && (
        <div className="bg-white px-[16px] py-[14px]">
          <div
            className="flex gap-[10px] overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <style>{`.dog-thumbs::-webkit-scrollbar{display:none}`}</style>
            {mediaItems.map((item, i) => {
              const isActive = i === activeIdx;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className="relative shrink-0 rounded-[12px] overflow-hidden transition-all active:scale-95"
                  style={{
                    width: 84,
                    height: 84,
                    border: isActive ? "3px solid #cd8188" : "3px solid transparent",
                    background: "#d6c8ad",
                  }}
                >
                  {item.publicUrl || item.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.type === "video" ? item.posterUrl ?? item.publicUrl ?? "" : item.publicUrl ?? ""}
                      alt={`${dogName} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
                  )}
                  {item.type === "video" ? (
                    <span className="absolute bottom-1 right-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Video
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
