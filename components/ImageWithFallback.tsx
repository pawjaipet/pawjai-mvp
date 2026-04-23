"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
}

const NEXT_IMAGE_HOSTS = new Set(["bdnyvcvkyepipdcygkvn.supabase.co"]);

function shouldUseNextImage(src: string): boolean {
  if (src.startsWith("/")) return true;

  try {
    const url = new URL(src);
    return url.protocol === "https:" && NEXT_IMAGE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export default function ImageWithFallback({ src, alt, className, fill, width, height, priority }: Props) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className={`bg-amber-100 flex items-center justify-center ${className ?? ""}`}>
        <span className="text-4xl select-none">🐾</span>
      </div>
    );
  }

  if (!shouldUseNextImage(src)) {
    // Fall back to a plain img for legacy external URLs so unsupported hosts
    // don't crash the page before we can show the placeholder state.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={fill ? undefined : (width ?? 400)}
        height={fill ? undefined : (height ?? 300)}
        className={fill ? `w-full h-full ${className ?? ""}` : className}
        loading={priority ? "eager" : "lazy"}
        onError={() => setErrored(true)}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        priority={priority}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 400}
      height={height ?? 300}
      className={className}
      priority={priority}
      onError={() => setErrored(true)}
    />
  );
}
