import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import { createClient } from "@/utils/supabase/server";
import SubscriptionPageClient from "@/components/settings/SubscriptionPageClient";

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

  // TODO(backend): replace hardcoded tier with real subscription state once
  // payment integration + subscriptions table land. For now every user is free.
  const currentTier: "free" | "standard" | "premium" = "free";

  return <SubscriptionPageClient currentTier={currentTier} />;
}
