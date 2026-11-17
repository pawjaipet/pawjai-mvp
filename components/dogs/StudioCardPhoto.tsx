"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DogCardPhoto from "@/components/dogs/DogCardPhoto";
import { useQualifiedExposure } from "@/components/dogs/useQualifiedExposure";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { sendProductAnalyticsEvent } from "@/utils/product-analytics-client";
import {
  STUDIO_EXPERIMENT_EVENT,
  STUDIO_EXPOSURE_DEDUPE_WINDOW_MS,
  studioExposureDedupeKey,
  studioExposureMetadata,
  type StudioPhotoAssignment,
  type StudioRendered,
} from "@/utils/studio-experiment-model";

/**
 * Feed cover for a dog in the studio-background experiment. Control shows the
 * original photo exactly as before; studio shows the reviewed derivative with
 * a small disclosure, and falls back to the original if it cannot load.
 */
export default function StudioCardPhoto({
  active,
  alt,
  assignment,
  cardPosition,
  coverShowing,
  dogId,
  dogPosition,
  getFeedVisitId,
}: {
  active: boolean;
  alt: string;
  assignment: StudioPhotoAssignment;
  cardPosition: number | null;
  coverShowing: boolean;
  dogId: string;
  dogPosition: number | null;
  getFeedVisitId?: () => string | null;
}) {
  const { t } = useLanguage();
  const [rendered, setRendered] = useState<StudioRendered>(assignment.variant === "studio" ? "studio" : "original");
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedAt = useRef<number | null>(null);
  const loadMs = useRef<number | null>(null);
  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  const src = rendered === "studio" ? assignment.studioUrl : assignment.originalUrl;
  const onReady = useCallback(() => {
    loadMs.current = mountedAt.current === null ? null : performance.now() - mountedAt.current;
    setLoaded(true);
  }, []);
  const onFailure = useCallback(() => {
    // Only the derivative falls back; a failing original keeps the normal retry UI.
    if (rendered !== "studio") return false;
    setLoaded(false);
    setRendered("original_fallback");
    return true;
  }, [rendered]);

  useQualifiedExposure(containerRef, {
    active,
    coverShowing,
    loaded,
    measured: assignment.measured,
    onQualified: () => {
      sendProductAnalyticsEvent({
        dedupeKey: studioExposureDedupeKey(assignment.version, dogId),
        dedupeWindowMs: STUDIO_EXPOSURE_DEDUPE_WINDOW_MS,
        dogId,
        eventName: STUDIO_EXPERIMENT_EVENT,
        metadata: studioExposureMetadata({
          assignment,
          cardPosition,
          dogPosition,
          feedVisitId: getFeedVisitId?.() ?? null,
          loadMs: loadMs.current,
          rendered,
        }),
      });
    },
  });

  return (
    <div ref={containerRef} className="relative h-full w-full" data-studio-rendered={rendered} data-studio-variant={assignment.variant}>
      <DogCardPhoto key={src} src={src} alt={alt} first active={active} onReady={onReady} onFailure={onFailure} />
      {rendered === "studio" && loaded && (
        <span className="pointer-events-none absolute left-3 top-[22px] z-10 rounded-full bg-[#65584f]/55 px-2.5 py-[3px] text-[11px] font-semibold leading-4 text-white">
          {t("Edited background")}
        </span>
      )}
    </div>
  );
}
