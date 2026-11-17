export const RELIABILITY_EVENT_NAMES = [
  "client_exception",
  "unhandled_rejection",
  "server_exception",
  "request_failure",
  "upload_outcome",
  "form_outcome",
  "session_recovery_failure",
] as const;

export type ReliabilityEventName = (typeof RELIABILITY_EVENT_NAMES)[number];
export type ReliabilityValue = boolean | number | string | null;

export const RELIABILITY_STAGES = [
  "selection", "validation", "preparation", "compression", "transfer",
  "processing", "persistence", "submission", "recovery", "unknown",
] as const;

const SECRET_KEY = /(authorization|cookie|password|token|secret|otp|email|phone|message|body|url|path|name|content|thumbnail|storage|document|medical)/i;
const ROUTE_PART = /^(?:\/[a-z0-9._-]+|\/[a-z0-9._-]+\/[\[\]a-z0-9._-]+)*$/i;

export function routeTemplate(value: unknown) {
  if (typeof value !== "string" || value.length > 160 || !value.startsWith("/")) return "unknown";
  const path = value.split(/[?#]/, 1)[0];
  if (!ROUTE_PART.test(path)) return "unknown";
  return path.replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "/[id]").slice(0, 160);
}

export function sanitizeReliabilityMetadata(value: unknown, depth = 0): Record<string, ReliabilityValue> {
  if (!value || typeof value !== "object" || Array.isArray(value) || depth > 1) return {};
  const result: Record<string, ReliabilityValue> = {};
  for (const [key, raw] of Object.entries(value).slice(0, 16)) {
    if (SECRET_KEY.test(key)) continue;
    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 48);
    if (!safeKey) continue;
    if (raw === null || typeof raw === "boolean") result[safeKey] = raw;
    else if (typeof raw === "number" && Number.isFinite(raw)) result[safeKey] = Math.max(-1e9, Math.min(1e9, raw));
    else if (typeof raw === "string" && raw.length <= 120 && !/[\r\n]/.test(raw)) result[safeKey] = raw;
  }
  return result;
}

export function sanitizeReliabilityReport(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const eventName = input.eventName;
  if (typeof eventName !== "string" || !RELIABILITY_EVENT_NAMES.includes(eventName as ReliabilityEventName)) return null;
  return {
    eventName: eventName as ReliabilityEventName,
    correlationId: typeof input.correlationId === "string" && /^[0-9a-f-]{36}$/i.test(input.correlationId) ? input.correlationId : null,
    route: routeTemplate(input.route),
    stage: typeof input.stage === "string" && RELIABILITY_STAGES.includes(input.stage as typeof RELIABILITY_STAGES[number]) ? input.stage : "unknown",
    release: typeof input.release === "string" ? input.release.slice(0, 80) : "unknown",
    environment: input.environment === "production" || input.environment === "preview" ? input.environment : "unknown",
    metadata: sanitizeReliabilityMetadata(input.metadata),
  };
}
