export interface SleeperPlayer {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  position?: string;
  team?: string;
  age?: number;
  years_exp?: number;
  height?: string;
  weight?: string;
  college?: string;
  injury_status?: string;
  fantasy_positions?: string[];
  number?: number;
  depth_chart_position?: number;
  depth_chart_order?: number;
  status?: string;
  sport?: string;
  active?: boolean;
}

const SLEEPER_BASE_URL = "https://api.sleeper.app/v1";

export async function fetchSleeperPlayers(): Promise<Record<string, SleeperPlayer>> {
  const response = await fetch(`${SLEEPER_BASE_URL}/players/nfl`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Sleeper players: ${response.status}`);
  }
  return response.json();
}


