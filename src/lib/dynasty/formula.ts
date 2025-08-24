interface ScoreInputs {
  marketValue: number;
  projectionScore: number;
  ageScore: number;
  riskScore: number;
}

export function composite({ marketValue, projectionScore, ageScore, riskScore }: ScoreInputs): number {
  const weights = {
    market: 0.4,
    projection: 0.3,
    age: 0.2,
    risk: 0.1,
  };

  const weighted = 
    marketValue * weights.market +
    projectionScore * weights.projection +
    ageScore * weights.age +
    riskScore * weights.risk;

  return Math.round(weighted * 100) / 100;
}
