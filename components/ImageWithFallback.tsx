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

export default function ImageWithFallback({ src, alt, className, fill, width, height, priority }: Props) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className={`bg-amber-100 flex items-center justify-center ${className ?? ""}`}>
        <span className="text-4xl select-none">🐾</span>
      </div>
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
