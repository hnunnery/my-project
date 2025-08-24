interface ScoreInputs {
  marketValue: number;
  projectionScore: number;
  ageScore: number;
}

export function composite({ marketValue, projectionScore, ageScore }: ScoreInputs): number {
  const weights = {
    market: 0.5,
    projection: 0.25,
    age: 0.25,
  };

  const weighted = 
    marketValue * weights.market +
    projectionScore * weights.projection +
    ageScore * weights.age;

  return Math.round(weighted * 100) / 100;
}
