export function minMax(value: number, min: number, max: number, invert = false): number {
  if (min === max) return 50;
  const normalized = (value - min) / (max - min);
  const result = invert ? 1 - normalized : normalized;
  return Math.round(result * 100);
}
