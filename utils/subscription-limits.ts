export type SubscriptionTier = "free" | "standard" | "premium";

export type SubscriptionLimits = {
  advancedMatching: boolean;
  adFree: boolean;
  dogViewLimit: number | null;
  priorityVisits: boolean;
  wishlistLimit: number | null;
};

export type SubscriptionTierConfig = SubscriptionLimits & {
  id: SubscriptionTier;
  name: string;
  priceThbMonthly: number;
};

const TIER_ORDER: SubscriptionTier[] = ["free", "standard", "premium"];

export const ANONYMOUS_DOG_VIEW_LIMIT = 10;

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionTierConfig> = {
  free: {
    advancedMatching: false,
    adFree: false,
    dogViewLimit: 25,
    id: "free",
    name: "Free Tier",
    priceThbMonthly: 0,
    priorityVisits: false,
    wishlistLimit: 5,
  },
  standard: {
    advancedMatching: false,
    adFree: false,
    dogViewLimit: 100,
    id: "standard",
    name: "Standard",
    priceThbMonthly: 199,
    priorityVisits: true,
    wishlistLimit: 20,
  },
  premium: {
    advancedMatching: true,
    adFree: true,
    dogViewLimit: null,
    id: "premium",
    name: "Premium",
    priceThbMonthly: 399,
    priorityVisits: true,
    wishlistLimit: null,
  },
};

export function normalizeSubscriptionTier(value: unknown): SubscriptionTier {
  if (typeof value !== "string") return "free";
  const normalized = value.trim().toLowerCase();
  return TIER_ORDER.includes(normalized as SubscriptionTier)
    ? normalized as SubscriptionTier
    : "free";
}

export function subscriptionTierFromAppMetadata(appMetadata: unknown): SubscriptionTier {
  if (!appMetadata || typeof appMetadata !== "object" || Array.isArray(appMetadata)) {
    return "free";
  }

  const metadata = appMetadata as Record<string, unknown>;
  return normalizeSubscriptionTier(
    metadata.pawjai_subscription_tier ?? metadata.subscription_tier ?? metadata.plan,
  );
}

export function getSubscriptionLimits(tier: SubscriptionTier): SubscriptionLimits {
  const config = SUBSCRIPTION_TIERS[tier] ?? SUBSCRIPTION_TIERS.free;
  return {
    advancedMatching: config.advancedMatching,
    adFree: config.adFree,
    dogViewLimit: config.dogViewLimit,
    priorityVisits: config.priorityVisits,
    wishlistLimit: config.wishlistLimit,
  };
}

export function formatSubscriptionLimit(limit: number | null) {
  return limit === null ? "Unlimited" : String(limit);
}
