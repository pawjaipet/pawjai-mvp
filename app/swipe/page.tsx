import { createClient } from "@/utils/supabase/server";
import SwipeFeed from "@/components/SwipeFeed";
import type { SwipeDog } from "@/components/SwipeDogCard";

export const dynamic = "force-dynamic";

function hasBackblazePhoto(dog: SwipeDog) {
  return dog.photos.some((photo) => {
    if (!photo.public_url) return false;
    try {
      return new URL(photo.public_url).hostname.includes("backblazeb2.com");
    } catch {
      return false;
    }
  });
}

async function getDogs(): Promise<SwipeDog[]> {
  const supabase = await createClient();

  const { data: dogs } = await supabase
    .from("dogs")
    .select("*")
    .eq("adoption_status", "available")
    .order("created_at", { ascending: false });

  if (!dogs || dogs.length === 0) return [];

  const ids = dogs.map((d) => d.id);
  const { data: photos } = await supabase
    .from("dog_photos")
    .select("dog_id, public_url, is_cover, sort_order")
    .in("dog_id", ids)
    .order("sort_order");

  const photoMap = new Map<string, { public_url: string | null; is_cover: boolean; sort_order: number }[]>();
  for (const p of photos ?? []) {
    if (!photoMap.has(p.dog_id)) photoMap.set(p.dog_id, []);
    photoMap.get(p.dog_id)!.push(p);
  }

  return dogs
    .map((d) => ({ ...d, photos: photoMap.get(d.id) ?? [] }))
    .sort((a, b) => {
      const aUploaded = hasBackblazePhoto(a);
      const bUploaded = hasBackblazePhoto(b);
      if (aUploaded !== bUploaded) return aUploaded ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

export default async function SwipePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dogs = await getDogs();

  // Fetch saved dog IDs for this user
  let savedIds: string[] = [];
  if (user) {
    const { data: adopter } = await supabase
      .from("adopters")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (adopter) {
      const { data: wishlist } = await supabase
        .from("wishlists")
        .select("dog_id")
        .eq("adopter_id", adopter.id);
      savedIds = (wishlist ?? []).map((w) => w.dog_id);
    }
  }

  return <SwipeFeed dogs={dogs} savedIds={savedIds} isLoggedIn={!!user} />;
}
