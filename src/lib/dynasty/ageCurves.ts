export function ageMultiplier(position: string, ageYears: number | null): number {
  if (!ageYears) return 1.0;

  const curves: Record<string, { peak: number; decline: number }> = {
    QB: { peak: 28, decline: 0.02 },
    RB: { peak: 25, decline: 0.08 },
    WR: { peak: 27, decline: 0.04 },
    TE: { peak: 28, decline: 0.03 },
    K: { peak: 30, decline: 0.01 },
    DEF: { peak: 26, decline: 0.03 },
  };

  const curve = curves[position] || curves.WR;
  const ageDiff = ageYears - curve.peak;
  
  if (ageDiff <= 0) {
    return 1.0 + Math.abs(ageDiff) * 0.01;
  } else {
    return Math.max(0.3, 1.0 - ageDiff * curve.decline);
  }
}
