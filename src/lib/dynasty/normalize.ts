export function logistic(value: number, min: number, max: number): number {
  if (min === max) return 50;
  const z = (value - min) / (max - min);
  const k = 10; // controls curve steepness
  const score = 100 / (1 + Math.exp(k * (z - 0.5)));
  return Math.round(score * 100) / 100;
}
