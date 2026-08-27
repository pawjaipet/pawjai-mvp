import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  isProductAnalyticsEventName,
  isTrackablePublicPath,
} from "@/utils/product-analytics-model";
import {
  ANALYTICS_VISITOR_COOKIE,
  recordProductAnalyticsEvents,
} from "@/utils/product-analytics";
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseAuthCookies } from "@/utils/supabase/auth-cookies";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_EVENTS_PER_REQUEST = 12;

function optionalUuid(value: unknown) {
  return typeof value === "string" && UUID_PATTERN.test(value) ? value : null;
}

function sanitizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 12)
      .filter(([, item]) => item === null || ["boolean", "number", "string"].includes(typeof item))
      .map(([key, item]) => [key.slice(0, 80), typeof item === "string" ? item.slice(0, 300) : item]),
  );
}

function analyticsEventPayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as Record<string, unknown>;
  const eventName = payload.eventName;
  const path = typeof payload.path === "string" ? payload.path : "";
  if (!isProductAnalyticsEventName(eventName) || !isTrackablePublicPath(path)) return null;

  return {
    dogId: optionalUuid(payload.dogId),
    eventName,
    metadata: sanitizeMetadata(payload.metadata),
    path,
    sessionId: optionalUuid(payload.sessionId),
  };
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    const requestHost = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
      .split(",")[0]
      .trim();
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {
      return NextResponse.json({ error: "Cross-origin analytics requests are not allowed." }, { status: 403 });
    }

    if (!requestHost || originHost !== requestHost) {
      return NextResponse.json({ error: "Cross-origin analytics requests are not allowed." }, { status: 403 });
    }
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 });
  }

  const payloadObject = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : null;
  const rawEvents = payloadObject && Array.isArray(payloadObject.events)
    ? payloadObject.events.slice(0, MAX_EVENTS_PER_REQUEST)
    : [payload];
  const events = rawEvents.map(analyticsEventPayload);
  if (events.length === 0 || events.some((event) => event === null)) {
    return NextResponse.json({ error: "Unsupported analytics event." }, { status: 400 });
  }

  const existingVisitorId = optionalUuid(request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value);
  const visitorId = existingVisitorId ?? randomUUID();
  let userId: string | null = null;
  if (hasSupabaseAuthCookies(request.cookies.getAll())) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  await recordProductAnalyticsEvents(events.map((event) => ({
    ...event!,
    userId,
    visitorId,
  })));

  const response = new NextResponse(null, { status: 204 });
  if (!existingVisitorId) {
    response.cookies.set({
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 180,
      name: ANALYTICS_VISITOR_COOKIE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      value: visitorId,
    });
  }

  return response;
}
