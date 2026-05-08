"use server";

import { createClient } from "@/utils/supabase/server";
import { ensureAdopterForUser } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";

export async function toggleWishlistAction(dogId: string): Promise<{ saved: boolean; error?: string }> {
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
  } else {
    await admin.from("wishlists").insert({ adopter_id: adopter.id, dog_id: dogId });
    return { saved: true };
  }
}
