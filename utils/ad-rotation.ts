function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function shuffleAdsForDate<Ad extends { id: string }>(ads: Ad[], dateKey: string) {
  return [...ads].sort((left, right) => {
    const leftHash = hashString(`${dateKey}:${left.id}`);
    const rightHash = hashString(`${dateKey}:${right.id}`);

    if (leftHash !== rightHash) {
      return leftHash - rightHash;
    }

    return left.id.localeCompare(right.id);
  });
}
