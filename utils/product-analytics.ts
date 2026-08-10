import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";
import type { ProductAnalyticsEventName } from "@/utils/product-analytics-model";

export const ANALYTICS_VISITOR_COOKIE = "pawjai_analytics_visitor";

type ProductAnalyticsMetadataValue = boolean | number | string | null;

export type ProductAnalyticsEventInput = {
  appointmentId?: string | null;
  dogId?: string | null;
  eventName: ProductAnalyticsEventName;
  metadata?: Record<string, ProductAnalyticsMetadataValue>;
  path: string;
  sessionId?: string | null;
  userId?: string | null;
  visitorId?: string | null;
};

export async function recordProductAnalyticsEvent(input: ProductAnalyticsEventInput) {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("product_analytics_events").insert({
      appointment_id: input.appointmentId ?? null,
      dog_id: input.dogId ?? null,
      event_name: input.eventName,
      metadata: input.metadata ?? {},
      path: input.path.slice(0, 500),
      session_id: input.sessionId ?? null,
      user_id: input.userId ?? null,
      visitor_id: input.visitorId ?? null,
    });

    if (error) {
      console.error("Product analytics event could not be recorded", {
        code: error.code,
        eventName: input.eventName,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Product analytics is unavailable", error);
    return false;
  }
}
