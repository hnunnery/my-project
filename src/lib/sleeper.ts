export interface SleeperPlayer {
  player_id: string;
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

export async function fetchSleeperADP(): Promise<Array<{ player_id: string; adp: number; position?: string }>> {
  const response = await fetch(`${SLEEPER_BASE_URL}/players/nfl/trending/add?lookback_hours=24&limit=1000`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Sleeper ADP: ${response.status}`);
  }
  
  const trending = await response.json();
  
  return trending.map((item: { player_id: string; count: number }, index: number) => ({
    player_id: item.player_id,
    adp: index + 1, // Use ranking position as ADP (lower is better)
    position: undefined, // Will be filled from player data
  }));
}
