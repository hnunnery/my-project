# Sleeper API Documentation

This document outlines the Sleeper API endpoints and data structures used in this fantasy football application.

## 📊 API Endpoints

### Base URL
```
https://api.sleeper.app/v1/
```

### Available Endpoints
- `GET /user/{username}` - Get user information
- `GET /user/{user_id}/leagues/nfl/{year}` - Get user's leagues for a specific year
- `GET /league/{league_id}` - Get league information
- `GET /league/{league_id}/users` - Get all users in a league
- `GET /league/{league_id}/rosters` - Get all rosters in a league
- `GET /players/nfl` - Get all NFL players (current year)
- `GET /players/nfl/{year}` - Get NFL players for specific year
- `GET /state/nfl` - Get current NFL state (week, season info)
- `GET /schedules/nfl/{year}` - Get NFL schedule for bye week data

### Internal API Endpoints (Our Application)
- `GET /api/players` - Cached NFL player data with daily refresh


## 🏈 Data Structures

### SleeperUser
```typescript
interface SleeperUser {
  user_id: string          // Unique Sleeper user ID
  username: string         // Username (e.g., "john_doe")
  display_name: string     // Display name (e.g., "John Doe")
  avatar: string | null    // Avatar image ID
}
```

### SleeperLeague
```typescript
interface SleeperLeague {
  league_id: string        // Unique league identifier
  name: string            // League name
  season: string          // Season year
  status: string          // League status (active, etc.)
  settings: {
    name: string          // League name (duplicate)
    season: string        // Season year (duplicate)
    num_teams: number     // Number of teams in league
    playoff_teams: number // Number of playoff teams
    playoff_start_week: number // When playoffs begin
  }
}
```

### SleeperRoster
```typescript
interface SleeperRoster {
  roster_id: number       // Unique roster ID
  owner_id: string        // User ID who owns this roster
  players: string[]       // All player IDs on roster
  taxi: string[]          // Taxi squad player IDs
  metadata: {
    team_name?: string    // Custom team name (optional)
  }
  starters: string[]      // Starting lineup player IDs
  reserve: string[]       // Bench player IDs
  league_id: string       // League this roster belongs to
}
```

### SleeperPlayer
```typescript
interface SleeperPlayer {
  player_id: string       // Unique player identifier
  name: string           // Player's full name
  position: string       // NFL position (QB, RB, WR, etc.)
  team: string          // NFL team abbreviation
  search_rank: number    // Search ranking
  fantasy_positions: string[] // Valid fantasy positions
  active: boolean        // Whether player is active
  injury_status?: string // Injury status if any
  news_updated?: number  // Last news update timestamp
  
  // Fantasy Points (various scoring formats)
  fantasy_points?: number        // Standard scoring
  fantasy_points_ppr?: number    // PPR scoring
  fantasy_points_half_ppr?: number // Half PPR scoring
  
  // Game Stats
  stats?: {
    week?: number        // Week number
    season?: number      // Season year
    passing_yards?: number
    rushing_yards?: number
    receiving_yards?: number
    touchdowns?: number
    interceptions?: number
    fumbles?: number
  }
  
  // Rankings
  rank?: number          // Overall rank
  rank_position?: number // Position-specific rank
  rank_ecr?: number      // Expert Consensus Rank
  rank_ppr?: number      // PPR-specific rank
  
  // Team Context
  bye_week?: number      // Team bye week
  game_week?: number     // Current game week
  opponent?: string      // Next opponent
  
  // Additional Fields
  age?: number           // Player age
}
```

## 🔍 Current Usage vs. Available Data

### ✅ Currently Using
- Basic player info (name, position, team)
- Fantasy points (PPR)
- Rankings (position rank for value calculation)
- Injury status
- Bye week (cached from schedule API)
- Active status
- User information
- League settings
- Roster management (including taxi squad)
- Player age
- Calculated value metric (PPR points / position rank)

### 🚧 Partially Using
- Stats (only basic structure defined)
- League settings (basic info only)
- Rankings (using position rank for calculations, not displaying all ranks)

### ❌ Not Using Yet
- Game stats (passing/rushing/receiving yards, TDs, etc.)
- News updates
- Half PPR and standard scoring
- Game week and opponent info
- Player search rankings
- Expert Consensus Rankings (ECR)
- Points per game (PPG)
- Rostered percentage data

## 🚀 Potential Future Enhancements

### Advanced Analytics
- Player performance trends
- Matchup analysis
- Trade value calculations
- Start/sit recommendations

### Real-time Updates
- Live scoring integration
- Injury news alerts
- Roster change notifications

### Historical Data
- Season-long performance tracking
- Week-by-week comparisons
- Playoff performance analysis

## 📝 Notes

- The `bye_week` field is not consistently populated in the API response, so we cache it separately
- Player stats may vary by season and availability
- Some fields are optional and may be null/undefined
- The API supports multiple scoring formats (PPR, Half PPR, Standard)
- Our application implements server-side caching for improved performance:
  - Player data cached for 24 hours
  - Bye week data cached for 30 days
  - Graceful fallback when cache APIs fail

## 🏗️ Caching Architecture

### Player Data Cache (`/api/players`)
- **Source**: `GET https://api.sleeper.app/v1/players/nfl`
- **Refresh**: Daily (24-hour cache)
- **Storage**: Server filesystem with JSON format
- **Purpose**: Reduce API calls and improve page load performance



## 🔗 Resources

- [Sleeper API Documentation](https://docs.sleeper.com/)
- [Sleeper Developer Portal](https://sleeper.com/developers)
- [API Rate Limits](https://docs.sleeper.com/#rate-limits)

---

*Last updated: January 2025*
