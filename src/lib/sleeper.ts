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

export async function fetchSleeperADP(): Promise<Array<{ player_id: string; adp: number; position?: string }>> {
  // Try to get ADP from the correct endpoint
  // Note: Sleeper doesn't have a public ADP endpoint, so we'll create a synthetic ADP
  // based on player popularity and position value
  
  const response = await fetch(`${SLEEPER_BASE_URL}/players/nfl`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Sleeper players: ${response.status}`);
  }
  
  const players = await response.json();
  
  // Create synthetic ADP based on player data and fantasy relevance
  const playerEntries = Object.entries(players)
    .filter(([, p]) => {
      const player = p as SleeperPlayer;
      return player?.active === true && 
        player?.position && 
        !['OL', 'G', 'OT', 'C', 'OG', 'P', 'LS'].includes(player.position);
    })
    .map(([id, p]) => {
      const player = p as SleeperPlayer;
      return {
        player_id: id,
        position: player.position!,
        // Create synthetic ADP based on position value and player status
        adp: generateSyntheticADP(player.position!, player.years_exp || 0, player.injury_status)
      };
    });
  
  // Sort by synthetic ADP (lower is better)
  return playerEntries.sort((a, b) => a.adp - b.adp);
}

function generateSyntheticADP(position: string, yearsExp: number, injuryStatus?: string): number {
  // Simplified ADP generation for performance
  const positionBaseADP: Record<string, number> = {
    'QB': 50,    // QBs are valuable
    'RB': 30,    // RBs are most valuable
    'WR': 40,    // WRs are very valuable
    'TE': 60,    // TEs are moderately valuable
    'K': 150,    // Kickers are less valuable
    'DEF': 120   // Defenses are less valuable
  };
  
  const baseADP = positionBaseADP[position] || 100;
  
  // Simplified adjustments for performance
  let adjustment = 0;
  if (yearsExp === 0) adjustment = -15; // Rookies
  else if (yearsExp <= 3) adjustment = -5; // Young players
  else if (yearsExp >= 8) adjustment = 15; // Veterans
  
  // Simple injury check
  if (injuryStatus && injuryStatus !== 'Active') {
    adjustment += 20;
  }
  
  return Math.max(1, baseADP + adjustment);
}


