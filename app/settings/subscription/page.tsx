import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import { createClient } from "@/utils/supabase/server";
import SubscriptionPageClient from "@/components/settings/SubscriptionPageClient";
import { resolveSubscriptionEntitlementForUser } from "@/utils/subscription-entitlements";
import { createAdminClient } from "@/utils/supabase/admin";
import { isStripeBillingConfigured } from "@/utils/stripe";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <ProtectedRouteGate
        nextPath="/settings/subscription"
        reason="Sign in to manage your subscription."
      />
    );
  }

  const [{ launchPremiumGrantNumber, tier: currentTier }, query] = await Promise.all([
    resolveSubscriptionEntitlementForUser(user),
    searchParams,
  ]);
  const billingConfigured = isStripeBillingConfigured();
  const { data: billing } = billingConfigured
    ? await createAdminClient()
      .from("billing_subscriptions")
      .select("cancel_at_period_end, current_period_end, provider_customer_id, provider_subscription_id, status")
      .eq("user_id", user.id)
      .maybeSingle()
    : { data: null };

  return (
    <SubscriptionPageClient
      billingConfigured={billingConfigured}
      billingStatus={billing?.status ?? null}
      cancelAtPeriodEnd={billing?.cancel_at_period_end ?? false}
      checkoutState={query.checkout ?? null}
      currentPeriodEnd={billing?.current_period_end ?? null}
      currentTier={currentTier}
      hasBillingAccount={Boolean(billing?.provider_subscription_id)}
      launchPremiumGrantNumber={launchPremiumGrantNumber}
    />
  );
}
