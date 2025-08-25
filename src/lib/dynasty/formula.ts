interface ScoreInputs {
  marketValue: number;
  ageScore: number;
}

export function composite({ marketValue, ageScore }: ScoreInputs): number {
  const weights = {
    market: 0.9,
    age: 0.1,
  };

  const weighted = marketValue * weights.market + ageScore * weights.age;

  return Math.round(weighted * 100) / 100;
}
