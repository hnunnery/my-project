export function ageMultiplier(position: string, age: number | null): number {
  if (!age) return 1.0;

  switch (position) {
    case "QB":
      if (age <= 25) return 0.85 + (age - 20) * 0.03;
      if (age <= 32) return 1.0;
      return Math.max(0.3, 1.0 - (age - 32) * 0.08);

    case "RB":
      if (age <= 24) return 0.7 + (age - 20) * 0.075;
      if (age <= 27) return 1.0;
      return Math.max(0.2, 1.0 - (age - 27) * 0.15);

    case "WR":
      if (age <= 25) return 0.8 + (age - 20) * 0.04;
      if (age <= 29) return 1.0;
      return Math.max(0.4, 1.0 - (age - 29) * 0.1);

    case "TE":
      if (age <= 26) return 0.75 + (age - 20) * 0.042;
      if (age <= 30) return 1.0;
      return Math.max(0.35, 1.0 - (age - 30) * 0.09);

    default:
      return 1.0; // K, DEF have minimal age impact
  }
}
