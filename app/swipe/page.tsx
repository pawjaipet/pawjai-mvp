import { createClient } from "@/utils/supabase/server";
import SwipeFeed from "@/components/SwipeFeed";
import type { SwipeDog } from "@/components/SwipeDogCard";

export const dynamic = "force-dynamic";

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

  return dogs.map((d) => ({ ...d, photos: photoMap.get(d.id) ?? [] }));
}

export default async function SwipePage() {
  const dogs = await getDogs();
  return <SwipeFeed dogs={dogs} />;
}
