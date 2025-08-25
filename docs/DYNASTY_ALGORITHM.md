# Dynasty Value Algorithm Documentation

## Overview
The dynasty value algorithm calculates fantasy football player values based on market data (ADP) and age factors. This document outlines the current implementation and recent improvements.

## Algorithm Components

### 1. Market Value Calculation (85% weight)
- **Source**: Sleeper ADP (Average Draft Position) data
- **Normalization**: Logistic function with k=6 steepness
- **Range**: 0-100 (where lower ADP = higher value)
- **Formula**: `logistic(adp, globalMin, globalMax)`

### 2. Age Score Calculation (15% weight)
- **Source**: Player age data from Sleeper API
- **Curves**: Position-specific age multipliers
- **Range**: 0-90 (capped to prevent saturation)
- **Formula**: `ageMultiplier(position, age) * 100`

### 3. Composite Formula
- **Market Weight**: 85%
- **Age Weight**: 15%
- **Formula**: `(marketValue * 0.85) + (ageScore * 0.15)`
- **Range**: 0-98.5 (theoretical maximum)

## Position-Specific Age Curves

### Quarterback (QB)
- **Peak**: Age 25-32 (multiplier: 1.0)
- **Growth**: Ages 20-25 (0.85 to 1.0)
- **Decline**: Ages 32+ (slow decline, minimum 0.3)

### Running Back (RB)
- **Peak**: Age 24-27 (multiplier: 1.0)
- **Growth**: Ages 20-24 (0.7 to 1.0)
- **Decline**: Ages 27+ (rapid decline, minimum 0.2)

### Wide Receiver (WR)
- **Peak**: Age 25-29 (multiplier: 1.0)
- **Growth**: Ages 20-25 (0.8 to 1.0)
- **Decline**: Ages 29+ (moderate decline, minimum 0.4)

### Tight End (TE)
- **Peak**: Age 26-30 (multiplier: 1.0)
- **Growth**: Ages 20-26 (0.75 to 1.0)
- **Decline**: Ages 30+ (slow decline, minimum 0.35)

### Special Teams
- **Kicker (K)**: No age impact (multiplier: 1.0)
- **Defense (DEF)**: No age impact (multiplier: 1.0)

## Recent Improvements

### 1. Saturation Prevention
- **Logistic steepness**: Reduced from k=10 to k=6
- **Age score cap**: Maximum 90 instead of 100
- **Result**: Better differentiation between elite players

### 2. Weight Optimization
- **Market value**: Increased from 75% to 85%
- **Age score**: Decreased from 25% to 15%
- **Result**: Dynasty values more closely track market sentiment

### 3. Error Handling
- **Null checks**: Added validation for API responses
- **Better error messages**: More descriptive error handling
- **Fallback logic**: Uses cached data when API fails

## Expected Results

### Value Distribution
- **Elite players**: 90-98.5 range
- **Good players**: 70-89 range
- **Average players**: 50-69 range
- **Below average**: 30-49 range
- **Poor players**: 0-29 range

### Differentiation
- **Before**: Many players clustered at 100
- **After**: Better spread across the value range
- **Benefit**: Easier to rank and compare players

## Technical Implementation

### Files Modified
- `src/lib/dynasty/normalize.ts` - Logistic normalization
- `src/lib/dynasty/formula.ts` - Composite formula
- `src/lib/dynasty/etl.ts` - Age score capping
- `src/app/dashboard/page.tsx` - Error handling

### Key Functions
- `logistic(value, min, max)` - ADP normalization
- `ageMultiplier(position, age)` - Age curve calculation
- `composite({marketValue, ageScore})` - Final value calculation

## Testing

### Validation Steps
1. **Build test**: `npx next build`
2. **Type check**: `npx tsc --noEmit`
3. **Lint check**: `npm run lint`
4. **ETL test**: Trigger `/api/cron/dynasty` endpoint

### Expected Outcomes
- ✅ No build errors
- ✅ No TypeScript errors
- ✅ No linting issues
- ✅ Dynasty values in 0-98.5 range
- ✅ Better player differentiation

## Future Considerations

### Potential Improvements
- **Dynamic weights**: Adjust based on league settings
- **Position weighting**: Different weights per position
- **Injury factors**: Include injury status in calculations
- **Performance metrics**: Add recent performance data

### Monitoring
- **Value distribution**: Track spread of dynasty values
- **API reliability**: Monitor Sleeper API response quality
- **User feedback**: Collect feedback on value accuracy
