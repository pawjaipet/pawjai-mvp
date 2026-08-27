"use client";

import type { ProductAnalyticsEventName } from "@/utils/product-analytics-model";

const SESSION_KEY = "pawjai_analytics_session";
const RECENT_EVENT_PREFIX = "pawjai_analytics_recent:";
const FLUSH_DELAY_MS = 800;
const MAX_EVENTS_PER_BATCH = 12;
const fallbackRecentEvents = new Map<string, number>();
let fallbackSessionId: string | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let lifecycleListenersInstalled = false;

type AnalyticsMetadataValue = boolean | number | string | null;

type ClientAnalyticsEvent = {
  dedupeKey?: string;
  dedupeWindowMs?: number;
  dogId?: string | null;
  eventName: ProductAnalyticsEventName;
  metadata?: Record<string, AnalyticsMetadataValue>;
  path?: string;
};

type QueuedAnalyticsEvent = {
  dogId: string | null;
  eventName: ProductAnalyticsEventName;
  metadata: Record<string, AnalyticsMetadataValue>;
  path: string;
  sessionId: string;
};

const pendingEvents: QueuedAnalyticsEvent[] = [];

function createUuid() {
  return window.crypto.randomUUID();
}

export function getProductAnalyticsSessionId() {
  try {
    const current = window.sessionStorage.getItem(SESSION_KEY);
    if (current) return current;
    const created = createUuid();
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    fallbackSessionId ??= createUuid();
    return fallbackSessionId;
  }
}

function recentlySent(key: string, windowMs: number) {
  if (windowMs <= 0) return false;
  const storageKey = `${RECENT_EVENT_PREFIX}${key}`;
  const now = Date.now();

  try {
    const previous = Number(window.sessionStorage.getItem(storageKey) ?? "0");
    window.sessionStorage.setItem(storageKey, String(now));
    return Number.isFinite(previous) && now - previous < windowMs;
  } catch {
    const previous = fallbackRecentEvents.get(storageKey) ?? 0;
    fallbackRecentEvents.set(storageKey, now);
    return now - previous < windowMs;
  }
}

function postAnalyticsBatch(events: QueuedAnalyticsEvent[]) {
  try {
    const body = JSON.stringify({ events });

    if (typeof navigator.sendBeacon === "function") {
      const queued = navigator.sendBeacon(
        "/api/analytics/events",
        new Blob([body], { type: "application/json" }),
      );
      if (queued) return;
    }

    void fetch("/api/analytics/events", {
      body,
      headers: { "content-type": "application/json" },
      keepalive: true,
      method: "POST",
    }).catch(() => {});
  } catch {
    // Analytics must never interrupt the adopter experience.
  }
}

export function flushProductAnalyticsEvents() {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  while (pendingEvents.length > 0) {
    postAnalyticsBatch(pendingEvents.splice(0, MAX_EVENTS_PER_BATCH));
  }
}

function installLifecycleListeners() {
  if (lifecycleListenersInstalled) return;
  lifecycleListenersInstalled = true;
  window.addEventListener("pagehide", flushProductAnalyticsEvents);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushProductAnalyticsEvents();
  });
}

function scheduleAnalyticsFlush() {
  installLifecycleListeners();

  if (document.visibilityState === "hidden" || pendingEvents.length >= MAX_EVENTS_PER_BATCH) {
    flushProductAnalyticsEvents();
    return;
  }
  if (flushTimer !== null) return;

  flushTimer = setTimeout(flushProductAnalyticsEvents, FLUSH_DELAY_MS);
}

export function sendProductAnalyticsEvent({
  dedupeKey,
  dedupeWindowMs = 1_500,
  dogId,
  eventName,
  metadata,
  path = window.location.pathname,
}: ClientAnalyticsEvent) {
  const eventKey = dedupeKey ?? `${eventName}:${path}:${dogId ?? ""}`;
  if (recentlySent(eventKey, dedupeWindowMs)) return false;

  pendingEvents.push({
    dogId: dogId ?? null,
    eventName,
    metadata: metadata ?? {},
    path,
    sessionId: getProductAnalyticsSessionId(),
  });
  scheduleAnalyticsFlush();
  return true;
}
