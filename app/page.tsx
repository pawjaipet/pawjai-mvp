import { createClient } from "@/utils/supabase/server";
import { ensureAdopterForUser } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";
import SwipeFeed from "@/components/SwipeFeed";
import type { SwipeDog } from "@/components/SwipeDogCard";
import { fetchActiveAds } from "@/utils/ads";

export const dynamic = "force-dynamic";

function hasUploadedPhoto(dog: SwipeDog) {
  return dog.photos.some((photo) => {
    if (!photo.public_url) return false;
    try {
      const hostname = new URL(photo.public_url).hostname;
      return hostname.includes("backblazeb2.com") || hostname.includes("supabase.co");
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
  const { data: traits } = await supabase
    .from("dog_traits")
    .select("dog_id, trait_type, trait_value")
    .in("dog_id", ids)
    .order("created_at");

  const photoMap = new Map<string, { public_url: string | null; is_cover: boolean; sort_order: number }[]>();
  for (const p of photos ?? []) {
    if (!photoMap.has(p.dog_id)) photoMap.set(p.dog_id, []);
    photoMap.get(p.dog_id)!.push(p);
  }
  const traitMap = new Map<string, { trait_type: string; trait_value: string }[]>();
  for (const trait of traits ?? []) {
    if (!traitMap.has(trait.dog_id)) traitMap.set(trait.dog_id, []);
    traitMap.get(trait.dog_id)!.push({
      trait_type: trait.trait_type,
      trait_value: trait.trait_value,
    });
  }
  const videoMap = new Map<string, { public_url: string; poster_url: string | null }>();
  for (const [dogId, dogTraits] of traitMap) {
    const publicUrl = dogTraits.find((trait) => trait.trait_type === "cover_video_url")?.trait_value;
    if (!publicUrl) continue;
    videoMap.set(dogId, {
      public_url: publicUrl,
      poster_url: dogTraits.find((trait) => trait.trait_type === "cover_video_poster_url")?.trait_value ?? null,
    });
  }

  return dogs
    .map((d) => ({
      ...d,
      photos: photoMap.get(d.id) ?? [],
      traits: traitMap.get(d.id) ?? [],
      video: videoMap.get(d.id) ?? null,
    }))
    .sort((a, b) => {
      const aUploaded = hasUploadedPhoto(a);
      const bUploaded = hasUploadedPhoto(b);
      if (aUploaded !== bUploaded) return aUploaded ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [dogs, ads] = await Promise.all([getDogs(), fetchActiveAds()]);

  let savedIds: string[] = [];
  if (user) {
    const adopter = await ensureAdopterForUser(supabase, user);
    const admin = createAdminClient();
    const { data: wishlist } = await admin
      .from("wishlists")
      .select("dog_id")
      .eq("adopter_id", adopter.id);
    savedIds = (wishlist ?? []).map((w) => w.dog_id);
  }

  return <SwipeFeed dogs={dogs} savedIds={savedIds} isLoggedIn={!!user} ads={ads} />;
}
