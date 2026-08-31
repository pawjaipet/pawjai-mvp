import "server-only";

import type Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/admin";
import { recordProductAnalyticsEvent } from "@/utils/product-analytics";
import {
  normalizeSubscriptionTier,
  paidSubscriptionTierFromAppMetadata,
  type SubscriptionTier,
} from "@/utils/subscription-limits";
import { getStripe, subscriptionTierForStripePrice } from "@/utils/stripe";

const PAID_STATUSES = new Set(["active", "trialing"]);

function stripeId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function subscriptionPeriod(subscription: Stripe.Subscription) {
  const starts = subscription.items.data.map((item) => item.current_period_start);
  const ends = subscription.items.data.map((item) => item.current_period_end);
  return {
    start: starts.length ? new Date(Math.min(...starts) * 1000).toISOString() : null,
    end: ends.length ? new Date(Math.max(...ends) * 1000).toISOString() : null,
  };
}

function effectiveTier(subscription: Stripe.Subscription): SubscriptionTier {
  if (!PAID_STATUSES.has(subscription.status)) return "free";
  return subscriptionTierForStripePrice(subscription.items.data[0]?.price.id);
}

async function userIdForSubscription(subscription: Stripe.Subscription) {
  const metadataUserId = subscription.metadata.pawjai_user_id;
  if (metadataUserId) return metadataUserId;

  const customerId = stripeId(subscription.customer);
  if (!customerId) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("billing_subscriptions")
    .select("user_id")
    .eq("provider_customer_id", customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}

async function setAuthSubscriptionTier(userId: string, tier: SubscriptionTier) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) throw error ?? new Error("Subscription user was not found.");

  const previousTier = paidSubscriptionTierFromAppMetadata(data.user.app_metadata);
  if (previousTier === tier && data.user.app_metadata?.pawjai_subscription_tier === tier) {
    return previousTier;
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...data.user.app_metadata,
      pawjai_subscription_tier: tier,
    },
  });
  if (updateError) throw updateError;
  return previousTier;
}

export async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  event: Stripe.Event,
) {
  const userId = await userIdForSubscription(subscription);
  if (!userId) throw new Error(`No PawJai user is linked to Stripe subscription ${subscription.id}.`);

  const admin = createAdminClient();
  const { data: processed } = await admin
    .from("subscription_audit_events")
    .select("id")
    .eq("provider_event_id", event.id)
    .maybeSingle();
  if (processed) return;

  const eventCreatedAt = new Date(event.created * 1000).toISOString();
  const { data: current } = await admin
    .from("billing_subscriptions")
    .select("last_provider_event_created_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (
    current?.last_provider_event_created_at
    && new Date(current.last_provider_event_created_at).getTime() > event.created * 1000
  ) {
    await admin.from("subscription_audit_events").insert({
      event_type: `${event.type}.ignored_out_of_order`,
      metadata: { providerSubscriptionId: subscription.id },
      new_tier: null,
      occurred_at: eventCreatedAt,
      previous_tier: null,
      provider_event_id: event.id,
      subscription_status: subscription.status,
      user_id: userId,
    });
    return;
  }

  const tier = event.type === "invoice.payment_failed"
    || event.type === "checkout.session.async_payment_failed"
    ? "free"
    : effectiveTier(subscription);
  const selectedTier = subscriptionTierForStripePrice(subscription.items.data[0]?.price.id);
  const previousTier = await setAuthSubscriptionTier(userId, tier);
  const period = subscriptionPeriod(subscription);

  const invoice = event.type.startsWith("invoice.") ? event.data.object as Stripe.Invoice : null;
  const { error: upsertError } = await admin.from("billing_subscriptions").upsert({
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_end: period.end,
    current_period_start: period.start,
    last_provider_event_created_at: eventCreatedAt,
    ...(event.type === "invoice.paid" ? { last_payment_at: eventCreatedAt } : {}),
    ...(event.type === "invoice.payment_failed" ? { last_payment_failed_at: eventCreatedAt } : {}),
    ...(invoice ? { latest_invoice_id: invoice.id } : {}),
    provider: "stripe",
    provider_customer_id: stripeId(subscription.customer),
    provider_price_id: subscription.items.data[0]?.price.id ?? null,
    provider_subscription_id: subscription.id,
    status: subscription.status,
    tier: selectedTier,
    updated_at: new Date().toISOString(),
    user_id: userId,
  }, { onConflict: "user_id" });
  if (upsertError) throw upsertError;

  const { error: auditError } = await admin.from("subscription_audit_events").insert({
    event_type: event.type,
    metadata: {
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      providerSubscriptionId: subscription.id,
      selectedTier,
    },
    new_tier: tier,
    occurred_at: eventCreatedAt,
    previous_tier: previousTier,
    provider_event_id: event.id,
    subscription_status: subscription.status,
    user_id: userId,
  });
  if (auditError) throw auditError;

  if (previousTier !== tier) {
    await recordProductAnalyticsEvent({
      eventName: "subscription_changed",
      metadata: { fromTier: previousTier, provider: "stripe", status: subscription.status, toTier: tier },
      path: "/settings/subscription",
      userId,
    });
  }
}

async function subscriptionFromEvent(event: Stripe.Event) {
  const stripe = getStripe();
  if (event.type.startsWith("customer.subscription.")) {
    return event.data.object as Stripe.Subscription;
  }

  if (event.type.startsWith("checkout.session.")) {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId = stripeId(session.subscription);
    return subscriptionId ? stripe.subscriptions.retrieve(subscriptionId) : null;
  }

  if (event.type.startsWith("invoice.")) {
    const invoice = event.data.object as Stripe.Invoice;
    const invoiceAny = invoice as Stripe.Invoice & {
      parent?: { subscription_details?: { subscription?: string | Stripe.Subscription } };
      subscription?: string | Stripe.Subscription;
    };
    const subscriptionId = stripeId(
      invoiceAny.parent?.subscription_details?.subscription ?? invoiceAny.subscription,
    );
    return subscriptionId ? stripe.subscriptions.retrieve(subscriptionId) : null;
  }

  return null;
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  const supported = event.type.startsWith("customer.subscription.")
    || event.type === "checkout.session.completed"
    || event.type === "checkout.session.async_payment_succeeded"
    || event.type === "checkout.session.async_payment_failed"
    || event.type === "invoice.paid"
    || event.type === "invoice.payment_failed";
  if (!supported) return;

  const subscription = await subscriptionFromEvent(event);
  if (subscription) await syncStripeSubscription(subscription, event);
}

export async function createOrGetStripeCustomer(user: { email?: string | null; id: string }) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("billing_subscriptions")
    .select("provider_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing?.provider_customer_id) return existing.provider_customer_id;

  const customer = await getStripe().customers.create({
    email: user.email ?? undefined,
    metadata: { pawjai_user_id: user.id },
  });
  const { error } = await admin.from("billing_subscriptions").upsert({
    provider: "stripe",
    provider_customer_id: customer.id,
    status: "none",
    tier: "free",
    user_id: user.id,
  }, { onConflict: "user_id" });
  if (error) throw error;
  return customer.id;
}

export function requestedTier(value: unknown): Exclude<SubscriptionTier, "free"> | null {
  const tier = normalizeSubscriptionTier(value);
  return tier === "standard" || tier === "premium" ? tier : null;
}
