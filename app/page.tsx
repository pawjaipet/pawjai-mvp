import { createClient } from "@/utils/supabase/server";
import { ensureAdopterForUser } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";
import SwipeFeed from "@/components/SwipeFeed";
import type { SwipeDog } from "@/components/SwipeDogCard";
import type { Database } from "@/types/database";
import { fetchActiveAds } from "@/utils/ads";
import { buildDogMediaItems } from "@/utils/dog-media";
import { filterDogsByPreferences, hasActiveDogPreference, type PreferenceForDogFilter } from "@/utils/dog-preference-filter";

export const dynamic = "force-dynamic";

function hasUploadedPhoto(dog: SwipeDog) {
  const urls = [
    ...dog.photos.map((photo) => photo.public_url),
    ...(dog.media ?? []).map((item) => item.publicUrl),
  ];

  return urls.some((url) => {
    if (!url) return false;
    try {
      const hostname = new URL(url).hostname;
      return hostname.includes("backblazeb2.com") || hostname.includes("supabase.co");
    } catch {
      return false;
    }
  });
}

async function getDogs(preference: PreferenceForDogFilter | null): Promise<SwipeDog[]> {
  const supabase = await createClient();

  let dogQuery = supabase
    .from("dogs")
    .select("*")
    .eq("adoption_status", "available")
    .order("created_at", { ascending: false });

  if (preference?.preferred_size) dogQuery = dogQuery.eq("size", preference.preferred_size as Database["public"]["Enums"]["dog_size"]);
  if (preference?.preferred_energy_level) dogQuery = dogQuery.eq("energy_level", preference.preferred_energy_level as Database["public"]["Enums"]["dog_energy_level"]);
  if (preference?.good_with_dogs !== null && preference?.good_with_dogs !== undefined) dogQuery = dogQuery.eq("good_with_dogs", preference.good_with_dogs);
  if (preference?.good_with_cats !== null && preference?.good_with_cats !== undefined) dogQuery = dogQuery.eq("good_with_cats", preference.good_with_cats);
  if (preference?.good_with_kids !== null && preference?.good_with_kids !== undefined) dogQuery = dogQuery.eq("good_with_kids", preference.good_with_kids);
  if (preference?.preferred_age_min_months !== null && preference?.preferred_age_min_months !== undefined) {
    dogQuery = dogQuery.gte("age_months", preference.preferred_age_min_months);
  }
  if (preference?.preferred_age_max_months !== null && preference?.preferred_age_max_months !== undefined) {
    dogQuery = dogQuery.lte("age_months", preference.preferred_age_max_months);
  }
  if (
    preference?.preferred_special_needs?.length === 1 &&
    preference.preferred_special_needs[0] === "No special needs preferred"
  ) {
    dogQuery = dogQuery.is("special_needs", null);
  }

  const { data: dogs } = await dogQuery;

  if (!dogs || dogs.length === 0) return [];

  const ids = dogs.map((d) => d.id);
  const { data: photos } = await supabase
    .from("dog_photos")
    .select("id, dog_id, public_url, is_cover, sort_order, storage_path")
    .in("dog_id", ids)
    .order("sort_order");
  const { data: traits } = await supabase
    .from("dog_traits")
    .select("dog_id, trait_type, trait_value")
    .in("dog_id", ids)
    .order("created_at");

  const photoMap = new Map<string, { id: string; public_url: string | null; is_cover: boolean; sort_order: number; storage_path: string }[]>();
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
  const shelterIds = Array.from(new Set(dogs.map((d) => d.shelter_id).filter(Boolean)));
  const { data: shelters } = await supabase
    .from("shelters")
    .select("id, name")
    .in("id", shelterIds);
  const shelterNameMap = new Map<string, string>();
  for (const s of shelters ?? []) shelterNameMap.set(s.id, s.name);

  const videoMap = new Map<string, { public_url: string; poster_url: string | null }>();
  for (const [dogId, dogTraits] of traitMap) {
    const publicUrl = dogTraits.find((trait) => trait.trait_type === "cover_video_url")?.trait_value;
    if (!publicUrl) continue;
    videoMap.set(dogId, {
      public_url: publicUrl,
      poster_url: dogTraits.find((trait) => trait.trait_type === "cover_video_poster_url")?.trait_value ?? null,
    });
  }

  const matchingDogs = filterDogsByPreferences(
    dogs,
    (traits ?? []).map((trait) => ({
      dog_id: trait.dog_id,
      trait_type: trait.trait_type,
      trait_value: trait.trait_value,
    })),
    preference,
  );

  return matchingDogs
    .map((d) => ({
      ...d,
      shelter_name: shelterNameMap.get(d.shelter_id) ?? null,
      photos: photoMap.get(d.id) ?? [],
      traits: traitMap.get(d.id) ?? [],
      media: buildDogMediaItems({
        photos: photoMap.get(d.id) ?? [],
        traits: traitMap.get(d.id) ?? [],
      }),
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

  let preference: PreferenceForDogFilter | null = null;
  let savedIds: string[] = [];
  if (user) {
    const adopter = await ensureAdopterForUser(supabase, user);
    const admin = createAdminClient();
    const [{ data: wishlist }, { data: savedPreference }] = await Promise.all([
      admin
        .from("wishlists")
        .select("dog_id")
        .eq("adopter_id", adopter.id),
      admin
        .from("adopter_preferences")
        .select("*")
        .eq("adopter_id", adopter.id)
        .maybeSingle(),
    ]);
    savedIds = (wishlist ?? []).map((w) => w.dog_id);
    preference = hasActiveDogPreference(savedPreference as PreferenceForDogFilter | null)
      ? savedPreference as PreferenceForDogFilter
      : null;
  }

  const [dogs, ads] = await Promise.all([getDogs(preference), fetchActiveAds()]);

  return <SwipeFeed dogs={dogs} savedIds={savedIds} isLoggedIn={!!user} ads={ads} />;
}
