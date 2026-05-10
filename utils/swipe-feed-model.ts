export type SwipeFeedItem<Dog, Ad> =
  | { kind: "dog"; dog: Dog; dogIndex: number }
  | { kind: "ad"; ad: Ad | null; key: string };

/**
 * Builds the swipe feed by interleaving ad slots between dogs.
 *
 * Slots are reserved every `adEvery` dogs whether or not the ads array
 * has content — the slot is always rendered. When ads exist, they are
 * cycled into the slots. When ads is empty, the slot's `ad` is null
 * and the renderer (AdCard) should show a placeholder.
 *
 * This guarantees a stable feed shape regardless of ad inventory, so
 * partner ad insertions go live by simply inserting rows into the
 * `ads` table — no code changes needed.
 */
export function buildSwipeFeed<Dog, Ad>(
  dogs: Dog[],
  ads: Ad[],
  adEvery = 3,
): SwipeFeedItem<Dog, Ad>[] {
  if (adEvery <= 0) {
    return dogs.map((dog, index) => ({ kind: "dog", dog, dogIndex: index }));
  }

  const items: SwipeFeedItem<Dog, Ad>[] = [];
  let adCursor = 0;

  for (let index = 0; index < dogs.length; index++) {
    items.push({ kind: "dog", dog: dogs[index], dogIndex: index });

    if ((index + 1) % adEvery === 0) {
      items.push({
        kind: "ad",
        ad: ads.length > 0 ? ads[adCursor % ads.length] : null,
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
