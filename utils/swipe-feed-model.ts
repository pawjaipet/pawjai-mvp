export type SwipeFeedItem<Dog, Ad> =
  | { kind: "dog"; dog: Dog; dogIndex: number }
  | { kind: "ad"; ad: Ad; key: string };

/**
 * Returns a shuffled copy of dog profiles for the swipe feed.
 *
 * The original array is left untouched so callers can still reuse a stable
 * filtered result for logging, counts, or tests.
 */
export function shuffleFeedDogs<Dog extends { shelter_id?: string | null }>(
  dogs: Dog[],
  random: () => number = Math.random,
): Dog[] {
  const shuffled = [...dogs];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return spreadDogsAcrossShelters(shuffled);
}

/**
 * Reorders an already-randomized dog list to avoid long runs from one shelter.
 * The input order still controls randomness inside each shelter group.
 */
export function spreadDogsAcrossShelters<Dog extends { shelter_id?: string | null }>(
  dogs: Dog[],
): Dog[] {
  if (dogs.length < 3) return [...dogs];

  const groups = new Map<string, Dog[]>();
  for (const [index, dog] of dogs.entries()) {
    const shelterKey = dog.shelter_id || `unknown-shelter-${index}`;
    groups.set(shelterKey, [...(groups.get(shelterKey) ?? []), dog]);
  }

  if (groups.size < 2) return [...dogs];

  const groupOrder = new Map(Array.from(groups.keys()).map((key, index) => [key, index]));
  const mixed: Dog[] = [];
  let lastShelterKey: string | null = null;

  while (mixed.length < dogs.length) {
    const available = Array.from(groups.entries()).filter(([, shelterDogs]) => shelterDogs.length > 0);
    const candidates = available.filter(([shelterKey]) => shelterKey !== lastShelterKey);
    const pool = candidates.length > 0 ? candidates : available;
    const [nextShelterKey, nextShelterDogs] = pool.sort((a, b) => {
      const remaining = b[1].length - a[1].length;
      if (remaining !== 0) return remaining;
      return (groupOrder.get(a[0]) ?? 0) - (groupOrder.get(b[0]) ?? 0);
    })[0];
    const nextDog = nextShelterDogs.shift();
    if (!nextDog) break;
    mixed.push(nextDog);
    lastShelterKey = nextShelterKey;
  }

  return mixed;
}

/**
 * Builds the swipe feed by interleaving ad slots between dogs.
 *
 * Live ads are inserted every `adEvery` dogs and cycle through the
 * available ad list. When there are no live ads, the feed remains dogs-only.
 */
export function buildSwipeFeed<Dog, Ad>(
  dogs: Dog[],
  ads: Ad[],
  adEvery = 3,
): SwipeFeedItem<Dog, Ad>[] {
  if (ads.length === 0 || adEvery <= 0) {
    return dogs.map((dog, index) => ({ kind: "dog", dog, dogIndex: index }));
  }

  const items: SwipeFeedItem<Dog, Ad>[] = [];
  let adCursor = 0;

  for (let index = 0; index < dogs.length; index++) {
    items.push({ kind: "dog", dog: dogs[index], dogIndex: index });

    if ((index + 1) % adEvery === 0) {
      items.push({
        kind: "ad",
        ad: ads[adCursor % ads.length],
        key: `ad-${index}`,
      });
      adCursor++;
    }
  }

  return items;
}

export function isActiveDogFeedItem<Dog, Ad>(
  item: SwipeFeedItem<Dog, Ad>,
  itemIndex: number,
  activeFeedIndex: number,
) {
  return item.kind === "dog" && itemIndex === activeFeedIndex;
}
