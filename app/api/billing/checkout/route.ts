import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createOrGetStripeCustomer, requestedTier } from "@/utils/subscription-billing";
import {
  getStripe,
  isStripeBillingConfigured,
  pawjaiSiteOrigin,
  stripePriceIdForTier,
} from "@/utils/stripe";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  if (!isStripeBillingConfigured()) {
    return NextResponse.json({ error: "Paid subscriptions are paused during launch." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const tier = requestedTier(body?.tier);
  if (!tier) return NextResponse.json({ error: "Choose Standard or Premium." }, { status: 400 });

  const { data: currentBilling } = await createAdminClient()
    .from("billing_subscriptions")
    .select("provider_subscription_id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (currentBilling?.provider_subscription_id && currentBilling.status !== "canceled") {
    return NextResponse.json({ error: "Manage the existing subscription in billing settings." }, { status: 409 });
  }

  try {
    const customerId = await createOrGetStripeCustomer(user);
    const origin = pawjaiSiteOrigin();
    const session = await getStripe().checkout.sessions.create({
      billing_address_collection: "auto",
      cancel_url: `${origin}/settings/subscription?checkout=cancelled`,
      client_reference_id: user.id,
      customer: customerId,
      line_items: [{ price: stripePriceIdForTier(tier), quantity: 1 }],
      metadata: { pawjai_tier: tier, pawjai_user_id: user.id },
      mode: "subscription",
      subscription_data: { metadata: { pawjai_tier: tier, pawjai_user_id: user.id } },
      success_url: `${origin}/settings/subscription?checkout=success`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout could not be created", error);
    return NextResponse.json({ error: "Billing is temporarily unavailable." }, { status: 503 });
  }
}
