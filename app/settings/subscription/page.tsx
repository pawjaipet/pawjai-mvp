import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import { createClient } from "@/utils/supabase/server";
import SubscriptionPageClient from "@/components/settings/SubscriptionPageClient";
import { subscriptionTierFromAppMetadata } from "@/utils/subscription-limits";

export default async function SubscriptionPage() {
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

  // Billing is not live yet. Future payment webhooks should write the plan into
  // user.app_metadata.pawjai_subscription_tier so UI and server limits agree.
  const currentTier = subscriptionTierFromAppMetadata(user.app_metadata);

  return <SubscriptionPageClient currentTier={currentTier} />;
}
