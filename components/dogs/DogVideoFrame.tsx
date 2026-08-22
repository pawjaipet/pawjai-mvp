"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";

type DogVideoFrameProps = {
  active: boolean;
  alt: string;
  className?: string;
  posterUrl?: string | null;
  videoUrl: string;
};

export default function DogVideoFrame({
  active,
  alt,
  className = "h-full w-full object-cover",
  posterUrl,
  videoUrl,
}: DogVideoFrameProps) {
  const [isWaiting, setIsWaiting] = useState(active);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    if (!active) {
      setIsWaiting(false);
      setShowHint(true);
      return;
    }

    setIsWaiting(true);
    setShowHint(true);
    const timeout = window.setTimeout(() => setShowHint(false), 2600);
    return () => window.clearTimeout(timeout);
  }, [active, videoUrl]);

  const overlayVisible = showHint || isWaiting || !active;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {active ? (
        <video
          src={videoUrl}
          poster={posterUrl ?? undefined}
          className={className}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          style={{ filter: "brightness(0.75)" }}
          onCanPlay={() => setIsWaiting(false)}
          onLoadedData={() => setIsWaiting(false)}
          onPlaying={() => setIsWaiting(false)}
          onWaiting={() => setIsWaiting(true)}
        />
      ) : posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl}
          alt={alt}
          className={className}
          draggable={false}
          style={{ filter: "brightness(0.75)" }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#d6c8ad] text-6xl">🐾</div>
      )}

      {overlayVisible ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-[#cd8188]/92 shadow-[0_10px_28px_rgba(101,88,79,0.28)] backdrop-blur-sm">
            <div className="absolute h-[52px] w-[52px] rounded-full border-[3px] border-white/35 border-t-white animate-spin" />
            <Play size={22} fill="white" stroke="white" strokeWidth={2.4} className="translate-x-[1px]" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
