export function minMax(value: number, min: number, max: number, invert = false): number {
  if (min === max) return 50;
  const normalized = (value - min) / (max - min);
  const result = invert ? 1 - normalized : normalized;
  return Math.round(result * 100);
}

export function positionBuckets<T extends { pos: string }>(items: T[]): Record<string, T[]> {
  const buckets: Record<string, T[]> = {};
  for (const item of items) {
    const pos = item.pos;
    if (!buckets[pos]) buckets[pos] = [];
    buckets[pos].push(item);
  }
  return buckets;
}
