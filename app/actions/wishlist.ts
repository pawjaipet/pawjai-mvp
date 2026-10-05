"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { ensureAdopterForUser } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  getSubscriptionLimits,
  type SubscriptionTier,
} from "@/utils/subscription-limits";
import { recordProductAnalyticsEvent } from "@/utils/product-analytics";
import { resolveSubscriptionEntitlementForUser } from "@/utils/subscription-entitlements";

export type WishlistToggleResult = {
  error?: "not_authenticated" | "wishlist_limit_reached" | "save_failed";
  limit?: number;
  saved: boolean;
  tier?: SubscriptionTier;
};

export async function toggleWishlistAction(dogId: string, source: "swipe_feed" | "dog_detail" = "swipe_feed"): Promise<WishlistToggleResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { saved: false, error: "not_authenticated" };

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();

  const { tier } = await resolveSubscriptionEntitlementForUser(user);
  const { wishlistLimit } = getSubscriptionLimits(tier);
  const { data, error } = await admin.rpc("toggle_subscription_wishlist_for_user", {
    p_adopter_id: adopter.id,
    p_dog_id: dogId,
    p_tier: tier,
    p_user_id: user.id,
  });
  if (error || !data?.[0]) {
    console.error("Wishlist could not be updated", { code: error?.code ?? "missing_result" });
    return { error: "save_failed", saved: false };
  }
  if (data[0].limit_reached) {
    await recordProductAnalyticsEvent({
      dogId,
      eventName: "subscription_limit_prompt",
      metadata: { limit: wishlistLimit, limitType: "wishlist", tier },
      path: source === "dog_detail" ? `/dogs/${dogId}` : "/swipe",
      userId: user.id,
    });
    return { error: "wishlist_limit_reached", limit: wishlistLimit ?? undefined, saved: false, tier };
  }
  revalidatePath(`/dogs/${dogId}`);
  revalidatePath("/profile");
  revalidatePath("/swipe");
  return { saved: data[0].saved };
}
