"use client";

import { useState } from "react";

interface Photo {
  id: string;
  public_url: string | null;
}

interface Props {
  photos: Photo[];
  dogName: string;
  videoUrl?: string | null;
  videoPosterUrl?: string | null;
}

export default function DogPhotoGallery({ photos, dogName, videoUrl, videoPosterUrl }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = photos[activeIdx] ?? null;
  const showVideo = activeIdx === 0 && videoUrl;

  return (
    <>
      {/* Hero photo / video — full bleed */}
      <div className="w-full relative" style={{ height: 360, background: "#d6c8ad" }}>
        {showVideo ? (
          <video
            src={videoUrl ?? undefined}
            poster={videoPosterUrl ?? active?.public_url ?? undefined}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
          />
        ) : active?.public_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active.public_url}
            alt={dogName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">🐾</div>
        )}
      </div>

      {/* Thumbnails strip */}
      {photos.length > 1 && (
        <div className="bg-white px-[16px] py-[14px]">
          <div
            className="flex gap-[10px] overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <style>{`.dog-thumbs::-webkit-scrollbar{display:none}`}</style>
            {photos.map((p, i) => {
              const isActive = i === activeIdx;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className="shrink-0 rounded-[12px] overflow-hidden transition-all active:scale-95"
                  style={{
                    width: 84,
                    height: 84,
                    border: isActive ? "3px solid #cd8188" : "3px solid transparent",
                    background: "#d6c8ad",
                  }}
                >
                  {p.public_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.public_url}
                      alt={`${dogName} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
