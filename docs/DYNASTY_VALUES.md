# Dynasty Values System

## Why This Feature Was Created

The Dynasty Values system was built to solve a critical problem in fantasy football dynasty leagues: **accurate player valuation for long-term roster building**. Unlike redraft leagues where you start fresh each year, dynasty leagues require owners to think years ahead when making trades and roster decisions.

### The Problem
- **Market inefficiency**: ADP (Average Draft Position) only reflects short-term sentiment
- **Age bias**: Younger players are often overvalued, older players undervalued
- **Position scarcity**: Different positions have different career arcs and value curves
- **Trade analysis difficulty**: No standardized way to compare player values across positions and ages

### The Solution
A comprehensive scoring system that combines:
1. **Market sentiment** (what people are actually doing - ADP data)
2. **Projection-based value** (expected performance)
3. **Age-adjusted scoring** (position-specific career curves)
4. **Risk assessment** (injury history, contract situations)

This creates a single, comparable dynasty value (0-100 scale) for every NFL player, updated daily.

## How The System Works

### 🔄 Daily ETL Pipeline Architecture

The system runs a sophisticated Extract-Transform-Load (ETL) pipeline every day at 06:00 UTC via Vercel Cron jobs.

#### Data Flow
```
Sleeper API → Raw Data → Normalization → Age Adjustment → Composite Scoring → Database → UI
```

#### Step-by-Step Process

1. **Data Extraction**
   - Fetches 11,000+ NFL players from Sleeper API
   - Retrieves trending ADP data (top 1000 most added players in 24h)
   - Captures player metadata: position, team, age, injury status

2. **Data Transformation**
   - **Global ADP normalization**: ADP values are normalized across all positions (0-100 scale, inverted since lower ADP = higher value)
   - **Age curve application**: Each position has different peak ages and decline rates
   - **Projection calculation**: Combines market data with expected performance
   - **Risk scoring**: Currently simplified (95/100), designed for future injury/contract analysis

3. **Composite Scoring Formula**
   ```typescript
   dynastyValue = (
     marketValue * 0.5 +      // What the market thinks (ADP-based)
     projectionScore * 0.25 +  // Expected performance
     ageScore * 0.25          // Age-adjusted value
   )
   ```

4. **Trend Analysis**
   - Calculates 7-day and 30-day moving averages
   - Computes delta (change) from historical averages
   - Identifies rising/falling player values

5. **Data Loading**
   - Batch processing (100 records per transaction) to handle large datasets
   - Upserts player records, snapshots, and daily values
   - Maintains historical data for trend analysis

### 📊 Database Schema Design

#### Why These Models Were Chosen

**Player Model**
- Core player information that changes infrequently
- Normalized to avoid data duplication
- Age stored as years for easy calculation

**Snapshot Model** 
- Raw market data with timestamps
- Allows multiple data sources (Sleeper ADP, future: KTC, FantasyPros)
- Preserves original data for auditing and reprocessing

**ValueDaily Model**
- Daily calculated dynasty values with all scoring components
- Composite key (date + player) allows historical tracking
- Trend fields for momentum analysis

```prisma
model Player {
  id       String @id // Sleeper player_id
  name     String
  pos      String
  team     String?
  ageYears Int?
  
  snapshots   Snapshot[]
  valueDaily  ValueDaily[]
}

model Snapshot {
  asOfDate  DateTime
  source    String   // "sleeper_adp", "ktc", etc.
  playerId  String
  rawValue  Float    // Raw ADP, KTC value, etc.
  meta      Json?    // Additional metadata
  
  player Player @relation(fields: [playerId], references: [id])
  @@id([asOfDate, source, playerId])
}

model ValueDaily {
  asOfDate        DateTime
  playerId        String
  marketValue     Float?   // Normalized market score (0-100)
  projectionScore Float?   // Expected performance score
  ageScore        Float?   // Age-adjusted score
  dynastyValue    Float?   // Final composite score
  trend7d         Float?   // 7-day trend delta
  trend30d        Float?   // 30-day trend delta
  
  player Player @relation(fields: [playerId], references: [id])
  @@id([asOfDate, playerId])
}
```

### 🎯 Age Curve Implementation

Different positions have dramatically different career arcs:

```typescript
export function ageMultiplier(position: string, age: number | null): number {
  if (!age) return 1.0;
  
  switch (position) {
    case 'QB':
      // QBs peak later, decline gradually
      if (age <= 25) return 0.85 + (age - 20) * 0.03;
      if (age <= 32) return 1.0;
      return Math.max(0.3, 1.0 - (age - 32) * 0.08);
      
    case 'RB':
      // RBs peak early, decline sharply
      if (age <= 24) return 0.7 + (age - 20) * 0.075;
      if (age <= 27) return 1.0;
      return Math.max(0.2, 1.0 - (age - 27) * 0.15);
      
    case 'WR':
      // WRs have longer primes
      if (age <= 25) return 0.8 + (age - 20) * 0.04;
      if (age <= 29) return 1.0;
      return Math.max(0.4, 1.0 - (age - 29) * 0.1);
      
    case 'TE':
      // TEs develop slowly, peak later
      if (age <= 26) return 0.75 + (age - 20) * 0.042;
      if (age <= 30) return 1.0;
      return Math.max(0.35, 1.0 - (age - 30) * 0.09);
      
    default:
      return 1.0; // K, DEF have minimal age impact
  }
}
```

### 🚀 API Architecture

#### `/api/dynasty/values` - Player Rankings
**Purpose**: Fetch dynasty rankings with optional date filtering
**Why**: Provides sortable, filterable player data for UI consumption

```typescript
// Example response
[
  {
    "playerId": "4098",
    "dynastyValue": 71.7,
    "trend7d": 2.3,
    "trend30d": -1.1,
    "player": {
      "name": "Justice Hill",
      "pos": "RB", 
      "team": "BAL"
    }
  }
]
```

#### `/api/trade` - Trade Analysis
**Purpose**: Compare total dynasty values between trade sides
**Why**: Enables fair trade evaluation across positions and ages

```typescript
// Request
{
  "sideA": ["4098", "4199"],  // Player IDs
  "sideB": ["4200", "4201"]
}

// Response
{
  "sideA": 145.2,
  "sideB": 138.7,
  "fairness": { "A": 51, "B": 49 }
}
```

#### `/api/cron/dynasty` - ETL Trigger
**Purpose**: Vercel Cron endpoint for daily data updates
**Why**: Automated, serverless data pipeline without manual intervention

### 🎨 UI Implementation Philosophy

#### Dynasty Values Access
**Purpose**: Access dynasty values and AI assistant through league page chat tab
**Why**: Integrated experience within league context for better user workflow

```typescript
// Access via league page chat tab
// League page: /dashboard/league/[id] → Chat tab → AI Assistant
```

### ⚡ Performance Optimizations

#### Why Batching Was Critical
Initial implementation tried to process 11,000+ players in single transactions, causing:
- Database timeouts
- Memory issues  
- Hanging ETL processes

**Solution**: Batch processing in groups of 100
```typescript
const batchSize = 100;
for (let i = 0; i < players.length; i += batchSize) {
  const batch = players.slice(i, i + batchSize);
  await prisma.$transaction(
    batch.map(player => prisma.player.upsert({...}))
  );
}
```

#### Concurrent Processing Handling
Multiple ETL processes can run simultaneously without conflicts:
- Each process has unique timestamps
- Upsert operations handle duplicates gracefully
- Batching prevents database locks

### 🔧 Configuration & Deployment

#### Vercel Cron Setup
```json
{
  "crons": [
    {
      "path": "/api/cron/dynasty",
      "schedule": "0 6 * * *"
    }
  ]
}
```

**Why 06:00 UTC**: 
- After overnight NFL news/transactions
- Before most US users wake up
- Ensures fresh data for daily fantasy decisions

#### Environment Requirements
```bash
DATABASE_URL=postgresql://...  # Neon PostgreSQL
NEXTAUTH_URL=https://...       # Production domain
NEXTAUTH_SECRET=...            # JWT signing key
```

## Future Enhancement Roadmap

### Immediate Improvements (Next 30 days)
1. **Enhanced Projections**: Integrate FantasyPros consensus projections
2. **Risk Modeling**: Add injury history and contract year analysis
3. **Trade Calculator UI**: Interactive trade comparison interface

### Medium-term Features (Next 90 days)
1. **Player Tiers**: K-means clustering for dynasty tiers (Tier 1, 2, 3, etc.)
2. **Historical Tracking**: Long-term value trend visualization
3. **Position Scarcity**: VORP (Value Over Replacement Player) calculations
4. **Mobile App**: React Native companion app

### Long-term Vision (6+ months)
1. **Machine Learning**: Predictive modeling for breakout candidates
2. **Social Features**: Community rankings and trade recommendations
3. **League Integration**: Import rosters for personalized trade suggestions
4. **Real-time Updates**: WebSocket connections for live value changes

## Troubleshooting Guide

### Common Issues & Solutions

**ETL Pipeline Not Running**
- Check Vercel Cron logs in dashboard
- Verify `DATABASE_URL` is accessible from Vercel
- Test manual trigger: `curl https://your-app.vercel.app/api/cron/dynasty`

**Missing Dynasty Values**
- Confirm ETL completed successfully (check logs)
- Players without ADP data will have null dynasty values
- Verify Sleeper API is returning trending data

**UI Loading Issues**
- Check browser network tab for API errors
- Verify `/api/dynasty/values` returns data
- Clear browser cache and reload

**Database Performance**
- Monitor query execution times
- Consider adding indexes for large datasets
- Batch size can be adjusted if needed

### Debug Commands
```bash
# Test ETL pipeline locally
curl http://localhost:3000/api/cron/dynasty

# Check data persistence
curl http://localhost:3000/api/dynasty/values | jq length

# Test trade analysis
curl -X POST http://localhost:3000/api/trade \
  -H "Content-Type: application/json" \
  -d '{"sideA":["4098"],"sideB":["4199"]}'

# Monitor database
npx prisma studio
```

## Technical Debt & Known Limitations

### Current Limitations
1. **Risk Score**: Simplified to 95/100, needs injury/contract data
2. **Projection Source**: Using market-derived projections, not expert consensus
3. **Position Eligibility**: Single position only, no multi-position players
4. **Rookie Integration**: New players may not have sufficient ADP data

### Planned Technical Improvements
1. **Caching Layer**: Redis for API response caching
2. **Database Optimization**: Proper indexing strategy
3. **Error Monitoring**: Sentry integration for production debugging
4. **Testing Coverage**: Unit tests for scoring algorithms

## Contributing Guidelines

### Adding New Data Sources
1. Create new `source` type in Snapshot model
2. Add fetcher function in `/src/lib/` directory
3. Update ETL pipeline to include new source
4. Add normalization logic for new data format

### Modifying Scoring Algorithm
1. Update formula in `/src/lib/dynasty/formula.ts`
2. Add unit tests for edge cases
3. Consider backward compatibility for historical data
4. Document changes in this file

### UI Enhancements
1. Follow existing component patterns
2. Maintain responsive design principles
3. Add loading states and error handling
4. Test with large datasets (11,000+ players)

This system represents a sophisticated approach to dynasty fantasy football valuation, combining multiple data sources with position-specific modeling to create actionable insights for league managers.
