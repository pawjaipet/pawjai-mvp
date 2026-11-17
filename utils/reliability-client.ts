"use client";

import { sanitizeReliabilityReport, type ReliabilityEventName, type ReliabilityValue } from "@/utils/reliability-schema";

const MAX_PER_MINUTE = 20;
let reportCount = 0;
let reportWindowStarted = 0;
let installed = false;

function correlationId() {
  return window.crypto.randomUUID();
}

function allowedToReport() {
  const now = Date.now();
  if (now - reportWindowStarted > 60_000) { reportWindowStarted = now; reportCount = 0; }
  if (reportCount >= MAX_PER_MINUTE) return false;
  reportCount += 1;
  return true;
}

export function reportReliabilityFailure(input: {
  eventName: ReliabilityEventName;
  route?: string;
  stage?: string;
  correlationId?: string;
  metadata?: Record<string, ReliabilityValue>;
}) {
  if (typeof window === "undefined" || !allowedToReport()) return;
  const report = sanitizeReliabilityReport({
    ...input,
    correlationId: input.correlationId ?? correlationId(),
    environment: process.env.NODE_ENV === "production" ? "production" : "preview",
    release: process.env.NEXT_PUBLIC_RELEASE_ID ?? "unknown",
    route: input.route ?? window.location.pathname,
  });
  if (!report) return;
  try {
    void fetch("/api/reliability/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(report),
      keepalive: true,
    }).catch(() => {});
  } catch { /* Monitoring must never block the product. */ }
}

export function installReliabilityListeners() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (event) => {
    reportReliabilityFailure({ eventName: "client_exception", stage: "unknown", metadata: { errorType: event.error ? "exception" : "resource" } });
  });
  window.addEventListener("unhandledrejection", () => {
    reportReliabilityFailure({ eventName: "unhandled_rejection", stage: "unknown" });
  });
}
