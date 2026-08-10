"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  dogIdFromPublicPath,
  dogIdFromSchedulePath,
  isTrackablePublicPath,
  type ProductAnalyticsEventName,
} from "@/utils/product-analytics-model";

const SESSION_KEY = "pawjai_analytics_session";
const RECENT_EVENT_PREFIX = "pawjai_analytics_recent:";

function getSessionId() {
  const current = window.sessionStorage.getItem(SESSION_KEY);
  if (current) return current;
  const created = window.crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, created);
  return created;
}

function recentlySent(key: string, windowMs = 1_500) {
  const storageKey = `${RECENT_EVENT_PREFIX}${key}`;
  const now = Date.now();
  const previous = Number(window.sessionStorage.getItem(storageKey) ?? "0");
  window.sessionStorage.setItem(storageKey, String(now));
  return Number.isFinite(previous) && now - previous < windowMs;
}

function sendEvent({
  dogId,
  eventName,
  path,
}: {
  dogId?: string | null;
  eventName: ProductAnalyticsEventName;
  path: string;
}) {
  const dedupeKey = `${eventName}:${path}:${dogId ?? ""}`;
  if (recentlySent(dedupeKey)) return;

  const body = JSON.stringify({
    dogId: dogId ?? null,
    eventName,
    path,
    sessionId: getSessionId(),
  });

  if (typeof navigator.sendBeacon === "function") {
    const queued = navigator.sendBeacon("/api/analytics/events", new Blob([body], { type: "application/json" }));
    if (queued) return;
  }

  void fetch("/api/analytics/events", {
    body,
    headers: { "content-type": "application/json" },
    keepalive: true,
    method: "POST",
  });
}

export default function ProductAnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isTrackablePublicPath(pathname)) return;

    const search = window.location.search;
    sendEvent({ eventName: "page_view", path: pathname });

    const profileDogId = dogIdFromPublicPath(pathname);
    if (profileDogId) {
      sendEvent({ dogId: profileDogId, eventName: "dog_profile_view", path: pathname });
    }

    const bookingDogId = dogIdFromSchedulePath(pathname, search);
    if (bookingDogId && !window.sessionStorage.getItem(`pawjai_booking_started:${bookingDogId}`)) {
      window.sessionStorage.setItem(`pawjai_booking_started:${bookingDogId}`, "1");
      sendEvent({ dogId: bookingDogId, eventName: "booking_started", path: pathname });
    }
  }, [pathname]);

  return null;
}
