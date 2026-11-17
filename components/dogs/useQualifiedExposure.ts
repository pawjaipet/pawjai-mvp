"use client";

import { useEffect, useRef, type RefObject } from "react";
import { exposureConditionsMet, QUALIFIED_EXPOSURE_DWELL_MS } from "@/utils/studio-experiment-model";

const PROBE_POINTS: [number, number][] = [[0.5, 0.35], [0.5, 0.6], [0.3, 0.48], [0.7, 0.48]];

/**
 * True when a tutorial, dialog, banner or any element outside this dog card
 * sits on top of the photo. Probes four points; the card's own overlays
 * (name, tags, buttons) do not count as obstruction.
 */
export function photoObstructed(photo: HTMLElement) {
  const card = photo.closest("[data-dog-card]") ?? photo;
  const rect = photo.getBoundingClientRect();
  let clear = 0;
  for (const [fx, fy] of PROBE_POINTS) {
    const x = rect.left + rect.width * fx;
    const y = rect.top + rect.height * fy;
    if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) continue;
    const top = document.elementFromPoint(x, y);
    if (top && card.contains(top)) clear += 1;
  }
  return clear < 3;
}

/**
 * Fires onQualified once when the photo has been continuously visible
 * (>= 60% in the viewport, page visible, not obstructed) for one second while
 * the card is the active card showing its cover. Preloaded neighbours, hidden
 * tabs, overlays, unloaded or failed images and QA previews never qualify.
 */
export function useQualifiedExposure(
  ref: RefObject<HTMLElement | null>,
  {
    active,
    coverShowing,
    loaded,
    measured,
    onQualified,
  }: { active: boolean; coverShowing: boolean; loaded: boolean; measured: boolean; onQualified: () => void },
) {
  const callback = useRef(onQualified);
  const fired = useRef(false);
  useEffect(() => {
    callback.current = onQualified;
  });

  const armed = measured && active && coverShowing && loaded;
  useEffect(() => {
    const element = ref.current;
    if (!armed || fired.current || !element || typeof IntersectionObserver === "undefined") return;
    let ratio = 0;
    let since: number | null = null;
    const observer = new IntersectionObserver((entries) => {
      ratio = entries[entries.length - 1]?.intersectionRatio ?? 0;
    }, { threshold: [0, 0.25, 0.5, 0.6, 0.75, 1] });
    observer.observe(element);
    const timer = window.setInterval(() => {
      const ok = exposureConditionsMet({
        active: true,
        coverShowing: true,
        loaded: true,
        measured: true,
        obstructed: photoObstructed(element),
        pageVisible: document.visibilityState === "visible",
        visibleRatio: ratio,
      });
      if (!ok) {
        since = null;
        return;
      }
      const now = performance.now();
      since ??= now;
      if (now - since >= QUALIFIED_EXPOSURE_DWELL_MS) {
        fired.current = true;
        window.clearInterval(timer);
        observer.disconnect();
        callback.current();
      }
    }, 200);
    return () => {
      window.clearInterval(timer);
      observer.disconnect();
    };
  }, [armed, ref]);
}
