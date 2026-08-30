"use server";

import { createClient } from "@/utils/supabase/server";
import { ensureAdopterForUser } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  getSubscriptionLimits,
  subscriptionTierFromAppMetadata,
  type SubscriptionTier,
} from "@/utils/subscription-limits";

export type WishlistToggleResult = {
  error?: "not_authenticated" | "wishlist_limit_reached";
  limit?: number;
  saved: boolean;
  tier?: SubscriptionTier;
};

export async function toggleWishlistAction(dogId: string): Promise<WishlistToggleResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { saved: false, error: "not_authenticated" };

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("wishlists")
    .select("dog_id")
    .eq("adopter_id", adopter.id)
    .eq("dog_id", dogId)
    .maybeSingle();

  if (existing) {
    await admin.from("wishlists").delete().eq("adopter_id", adopter.id).eq("dog_id", dogId);
    return { saved: false };
  }

  const tier = subscriptionTierFromAppMetadata(user.app_metadata);
  const { wishlistLimit } = getSubscriptionLimits(tier);
  if (wishlistLimit !== null) {
    const { count } = await admin
      .from("wishlists")
      .select("dog_id", { count: "exact", head: true })
      .eq("adopter_id", adopter.id);

    if ((count ?? 0) >= wishlistLimit) {
      return {
        error: "wishlist_limit_reached",
        limit: wishlistLimit,
        saved: false,
        tier,
      };
    }
  }

  await admin.from("wishlists").insert({ adopter_id: adopter.id, dog_id: dogId });
  return { saved: true };
}
