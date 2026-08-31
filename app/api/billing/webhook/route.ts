import { NextResponse } from "next/server";
import { getStripe, getStripeWebhookSecret, isStripeBillingConfigured } from "@/utils/stripe";
import { handleStripeWebhookEvent } from "@/utils/subscription-billing";

export async function POST(request: Request) {
  if (!isStripeBillingConfigured()) {
    return NextResponse.json({ disabled: true, received: true });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  try {
    const event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      getStripeWebhookSecret(),
    );
    await handleStripeWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook rejected", error);
    return NextResponse.json({ error: "Webhook rejected." }, { status: 400 });
  }
}
