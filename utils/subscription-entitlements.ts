import "server-only";

import type { User } from "@supabase/supabase-js";
import {
  hasLaunchPremiumGrant,
  launchPremiumGrantNumber,
  paidSubscriptionTierFromAppMetadata,
  type SubscriptionTier,
} from "@/utils/subscription-limits";
import { createAdminClient } from "@/utils/supabase/admin";

export type SubscriptionEntitlement = {
  launchPremiumGrantNumber: number | null;
  tier: SubscriptionTier;
};

export async function resolveSubscriptionEntitlementForUser(
  user: Pick<User, "app_metadata" | "id">,
): Promise<SubscriptionEntitlement> {
  if (hasLaunchPremiumGrant(user.app_metadata)) {
    return {
      launchPremiumGrantNumber: launchPremiumGrantNumber(user.app_metadata),
      tier: "premium",
    };
  }

  const paidTier = paidSubscriptionTierFromAppMetadata(user.app_metadata);
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("ensure_launch_premium_grant_for_user", {
    p_user_id: user.id,
  });

  if (error) {
    console.error("Launch Premium grant could not be resolved", { code: error.code });
    return { launchPremiumGrantNumber: null, tier: paidTier };
  }

  const grant = data?.[0];
  if (!grant?.granted) {
    return { launchPremiumGrantNumber: null, tier: paidTier };
  }

  const grantNumber = grant.grant_number;
  const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      pawjai_launch_premium: true,
      pawjai_launch_premium_number: grantNumber,
    },
  });

  if (metadataError) {
    // The database grant is authoritative. A later request can retry this cache
    // update without withholding Premium from the user in the meantime.
    console.error("Launch Premium metadata could not be cached", { code: metadataError.code });
  } else {
    user.app_metadata.pawjai_launch_premium = true;
    user.app_metadata.pawjai_launch_premium_number = grantNumber;
  }

  return { launchPremiumGrantNumber: grantNumber, tier: "premium" };
}
