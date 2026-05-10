export type SwipeFeedItem<Dog, Ad> =
  | { kind: "dog"; dog: Dog; dogIndex: number }
  | { kind: "ad"; ad: Ad; key: string };

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
