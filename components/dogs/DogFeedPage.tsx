import { cookies } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { ensureAdopterForUser } from "@/utils/adopter";
import { fetchActiveAds } from "@/utils/ads";
import { buildDogMediaItems, normalizeDogMediaUrl } from "@/utils/dog-media";
import {
  filterDogsByPreferences,
  hasActiveDogPreference,
  rankDogsByPreferenceMatch,
  type PreferenceForDogFilter,
} from "@/utils/dog-preference-filter";
import type { SwipeDog } from "@/components/SwipeDogCard";
import SwipeFeed from "@/components/SwipeFeed";
import { shuffleFeedDogs } from "@/utils/swipe-feed-model";
import {
  ANONYMOUS_DOG_VIEW_LIMIT,
  getSubscriptionLimits,
  type SubscriptionTier,
} from "@/utils/subscription-limits";
import { resolveSubscriptionEntitlementForUser } from "@/utils/subscription-entitlements";
import type { Database } from "@/types/database";
import { hasSupabaseAuthCookies } from "@/utils/supabase/auth-cookies";

type DogFeedResult = {
  dogs: SwipeDog[];
  showingAllBecauseNoMatches: boolean;
};

function hasUploadedPhoto(dog: SwipeDog) {
  const urls = [
    ...dog.photos.map((photo) => photo.public_url),
    ...(dog.media ?? []).map((item) => item.publicUrl),
  ];

  return urls.some((url) => {
    if (!url) return false;
    try {
      const hostname = new URL(url).hostname;
      return hostname.includes("backblazeb2.com") || hostname.includes("media.pawjaipet.com") || hostname.includes("supabase.co");
    } catch {
      return false;
    }
  });
}

async function getMatchingDogs(
  preference: PreferenceForDogFilter | null,
  advancedMatching = false,
): Promise<SwipeDog[]> {
  const supabase = await createClient();

  let dogQuery = supabase
    .from("dogs")
    .select("*")
    .eq("adoption_status", "available")
    .order("created_at", { ascending: false });

  if (!advancedMatching && preference?.preferred_size) dogQuery = dogQuery.eq("size", preference.preferred_size as Database["public"]["Enums"]["dog_size"]);
  if (!advancedMatching && preference?.preferred_energy_level) dogQuery = dogQuery.eq("energy_level", preference.preferred_energy_level as Database["public"]["Enums"]["dog_energy_level"]);
  if (!advancedMatching && preference?.good_with_dogs !== null && preference?.good_with_dogs !== undefined) dogQuery = dogQuery.eq("good_with_dogs", preference.good_with_dogs);
  if (!advancedMatching && preference?.good_with_cats !== null && preference?.good_with_cats !== undefined) dogQuery = dogQuery.eq("good_with_cats", preference.good_with_cats);
  if (!advancedMatching && preference?.good_with_kids !== null && preference?.good_with_kids !== undefined) dogQuery = dogQuery.eq("good_with_kids", preference.good_with_kids);
  if (!advancedMatching && preference?.preferred_age_min_months !== null && preference?.preferred_age_min_months !== undefined) {
    dogQuery = dogQuery.gte("age_months", preference.preferred_age_min_months);
  }
  if (!advancedMatching && preference?.preferred_age_max_months !== null && preference?.preferred_age_max_months !== undefined) {
    dogQuery = dogQuery.lte("age_months", preference.preferred_age_max_months);
  }
  if (
    !advancedMatching && preference?.preferred_special_needs?.length === 1 &&
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
    .select("id, name, logo_url")
    .in("id", shelterIds);
  const shelterMap = new Map<string, { logo_url: string | null; name: string }>();
  for (const s of shelters ?? []) {
    shelterMap.set(s.id, { logo_url: s.logo_url, name: s.name });
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

  const matchingDogs = advancedMatching ? rankDogsByPreferenceMatch(
    dogs,
    (traits ?? []).map((trait) => ({
      dog_id: trait.dog_id,
      trait_type: trait.trait_type,
      trait_value: trait.trait_value,
    })),
    preference,
  ) : filterDogsByPreferences(
    dogs,
    (traits ?? []).map((trait) => ({
      dog_id: trait.dog_id,
      trait_type: trait.trait_type,
      trait_value: trait.trait_value,
    })),
    preference,
  );
  const advancedOrder = new Map(matchingDogs.map((dog, index) => [dog.id, index]));

  const enrichedDogs = matchingDogs
    .map((d) => {
      const photosForDog = (photoMap.get(d.id) ?? []).map((photo) => ({
        ...photo,
        public_url: normalizeDogMediaUrl(photo.public_url, photo.storage_path),
      }));
      const traitsForDog = traitMap.get(d.id) ?? [];
      const videoForDog = videoMap.get(d.id);

      return {
        ...d,
        shelter_logo_url: shelterMap.get(d.shelter_id)?.logo_url ?? null,
        shelter_name: shelterMap.get(d.shelter_id)?.name ?? null,
        photos: photosForDog,
        traits: [],
        media: buildDogMediaItems({
          photos: photosForDog,
          traits: traitsForDog,
        }),
        video: videoForDog
          ? {
            public_url: normalizeDogMediaUrl(videoForDog.public_url) ?? videoForDog.public_url,
            poster_url: normalizeDogMediaUrl(videoForDog.poster_url),
          }
          : null,
      };
    })
    .sort((a, b) => {
      if (advancedMatching) {
        const rankOrder = (advancedOrder.get(a.id) ?? 0) - (advancedOrder.get(b.id) ?? 0);
        if (rankOrder !== 0) return rankOrder;
      }
      const aUploaded = hasUploadedPhoto(a);
      const bUploaded = hasUploadedPhoto(b);
      if (aUploaded !== bUploaded) return aUploaded ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const dogsWithPhotos = enrichedDogs.filter(hasUploadedPhoto);
  const dogsWithoutPhotos = enrichedDogs.filter((dog) => !hasUploadedPhoto(dog));

  if (advancedMatching) return enrichedDogs;

  return [
    ...shuffleFeedDogs(dogsWithPhotos),
    ...shuffleFeedDogs(dogsWithoutPhotos),
  ];
}

async function getDogFeed(
  preference: PreferenceForDogFilter | null,
  advancedMatching = false,
): Promise<DogFeedResult> {
  const dogs = await getMatchingDogs(preference, advancedMatching);
  if (!hasActiveDogPreference(preference) || dogs.length > 0) {
    return { dogs, showingAllBecauseNoMatches: false };
  }

  const allDogs = await getMatchingDogs(null);
  return {
    dogs: allDogs,
    showingAllBecauseNoMatches: allDogs.length > 0,
  };
}

function dogViewWindowStartIso() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

export default async function DogFeedPage() {
  let preference: PreferenceForDogFilter | null = null;
  let savedIds: string[] = [];
  let isLoggedIn = false;
  let subscriptionTier: SubscriptionTier = "free";
  let viewedDogIds = new Set<string>();
  let dailyDogViewsRemaining: number | null = null;
  let dogViewLimit: number | null = ANONYMOUS_DOG_VIEW_LIMIT;
  const cookieStore = await cookies();

  if (hasSupabaseAuthCookies(cookieStore.getAll())) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    isLoggedIn = Boolean(user);
    if (user) {
      const adopter = await ensureAdopterForUser(supabase, user);
      ({ tier: subscriptionTier } = await resolveSubscriptionEntitlementForUser(user));
      const admin = createAdminClient();
      dogViewLimit = getSubscriptionLimits(subscriptionTier).dogViewLimit;
      const dogViewsPromise = dogViewLimit === null
        ? Promise.resolve({ data: [] as { dog_id: string }[] })
        : admin
          .from("subscription_dog_views")
          .select("dog_id")
          .eq("user_id", user.id)
          .gt("viewed_at", dogViewWindowStartIso());
      const [{ data: wishlist }, { data: savedPreference }, { data: dogViews }] = await Promise.all([
        admin
          .from("wishlists")
          .select("dog_id")
          .eq("adopter_id", adopter.id),
        admin
          .from("adopter_preferences")
          .select("*")
          .eq("adopter_id", adopter.id)
          .maybeSingle(),
        dogViewsPromise,
      ]);
      savedIds = (wishlist ?? []).map((w) => w.dog_id);
      preference = hasActiveDogPreference(savedPreference as PreferenceForDogFilter | null)
        ? savedPreference as PreferenceForDogFilter
        : null;
      viewedDogIds = new Set((dogViews ?? []).map((view) => view.dog_id));
      dailyDogViewsRemaining = dogViewLimit === null
        ? null
        : Math.max(dogViewLimit - viewedDogIds.size, 0);
    }
  }

  if (!isLoggedIn) {
    dailyDogViewsRemaining = ANONYMOUS_DOG_VIEW_LIMIT;
  }

  const limits = getSubscriptionLimits(subscriptionTier);
  const [{ dogs, showingAllBecauseNoMatches }, ads] = await Promise.all([
    getDogFeed(preference, limits.advancedMatching),
    limits.adFree ? Promise.resolve([]) : fetchActiveAds(),
  ]);
  const visibleDogs = isLoggedIn && dailyDogViewsRemaining !== null
    ? dogs.filter((dog) => viewedDogIds.has(dog.id))
      .concat(dogs.filter((dog) => !viewedDogIds.has(dog.id)).slice(0, dailyDogViewsRemaining))
    : !isLoggedIn && dailyDogViewsRemaining !== null
      ? dogs.slice(0, dailyDogViewsRemaining)
    : dogs;

  return (
    <SwipeFeed
      dogs={visibleDogs}
      savedIds={savedIds}
      isLoggedIn={isLoggedIn}
      ads={ads}
      dailyDogViewLimit={dogViewLimit}
      dailyDogViewsRemaining={dailyDogViewsRemaining}
      showNoFilterResultsNotice={showingAllBecauseNoMatches}
      subscriptionTier={subscriptionTier}
    />
  );
}
