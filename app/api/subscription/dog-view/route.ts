import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { recordProductAnalyticsEvent } from "@/utils/product-analytics";
import { resolveSubscriptionEntitlementForUser } from "@/utils/subscription-entitlements";
import { createAdminClient } from "@/utils/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!UUID.test(body?.dogId ?? "")) {
    return NextResponse.json({ error: "A valid dog is required." }, { status: 400 });
  }

  const { tier } = await resolveSubscriptionEntitlementForUser(user);
  const { data, error } = await createAdminClient().rpc("record_subscription_dog_view_for_user", {
    p_dog_id: body.dogId,
    p_tier: tier,
    p_user_id: user.id,
  });
  if (error || !data?.[0]) {
    console.error("Dog-view entitlement could not be recorded", { code: error?.code });
    return NextResponse.json({ error: "Dog-view access could not be checked." }, { status: 503 });
  }

  const result = data[0];
  if (!result.allowed) {
    await recordProductAnalyticsEvent({
      dogId: body.dogId,
      eventName: "subscription_limit_prompt",
      metadata: {
        limit: result.view_limit,
        limitType: "dog_views",
        tier,
        uniqueViews: result.unique_views,
      },
      path: "/swipe",
      userId: user.id,
    });
  }

  return NextResponse.json(result, { status: result.allowed ? 200 : 429 });
}
