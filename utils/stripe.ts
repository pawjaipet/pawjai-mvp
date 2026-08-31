import "server-only";

import Stripe from "stripe";
import { SITE_URL } from "@/utils/seo";
import type { SubscriptionTier } from "@/utils/subscription-limits";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");
  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  return secret;
}

export function stripePriceIdForTier(tier: Exclude<SubscriptionTier, "free">) {
  const priceId = tier === "standard"
    ? process.env.STRIPE_STANDARD_PRICE_ID
    : process.env.STRIPE_PREMIUM_PRICE_ID;
  if (!priceId) throw new Error(`Stripe ${tier} Price ID is not configured.`);
  return priceId;
}

export function subscriptionTierForStripePrice(priceId: string | null | undefined): SubscriptionTier {
  if (priceId && priceId === process.env.STRIPE_PREMIUM_PRICE_ID) return "premium";
  if (priceId && priceId === process.env.STRIPE_STANDARD_PRICE_ID) return "standard";
  return "free";
}

export function isStripeBillingConfigured() {
  return Boolean(
    process.env.PAWJAI_BILLING_ENABLED === "true"
    && process.env.STRIPE_SECRET_KEY
    && process.env.STRIPE_WEBHOOK_SECRET
    && process.env.STRIPE_STANDARD_PRICE_ID
    && process.env.STRIPE_PREMIUM_PRICE_ID,
  );
}

export function pawjaiSiteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.PAWJAI_SITE_ORIGIN ?? SITE_URL)
    .replace(/\/+$/, "");
}
