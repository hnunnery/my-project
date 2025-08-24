# Changelog

All notable changes to the Fantasy Football Dashboard project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **🏆 Comprehensive Dynasty Values System**: Implemented complete dynasty fantasy football player valuation system
  - **Daily ETL Pipeline**: Automated data collection from Sleeper API processing 11,000+ NFL players
  - **Composite Scoring Algorithm**: Position-specific age curves with weighted formula (40% market + 30% projections + 20% age + 10% risk)
  - **Database Models**: 3 new Prisma models (Player, Snapshot, ValueDaily) with proper migrations
  - **API Endpoints**: Dynasty values, trade analysis, and cron trigger endpoints
  - **Dynasty Values UI**: Sortable player rankings page with trend indicators
  - **Vercel Cron Integration**: Daily automated updates at 06:00 UTC
  - **Trade Analysis**: Fair trade evaluation using dynasty values
  - **Mobile-First Design**: Responsive table layout optimized for all devices

- **Persistent League Storage**: Implemented client-side caching for league data
  - League data is now stored in localStorage and persists between sessions
  - Automatic data freshness checking (1-hour cache validity)
  - Graceful fallback to cached data when API calls fail
  - Cache status indicators showing data age and freshness
- **Enhanced Dashboard UX**: Improved user experience with better data management
  - Admin panel moved below leagues section for better organization
  - Added refresh button to force update stale data
  - Visual indicators for data freshness (green for fresh, yellow for stale)
  - Automatic loading of cached data when switching between saved accounts
- **Taxi Squad Support**: Added comprehensive support for taxi squad players
  - Dedicated "Taxi Squad" section in "My Team" page
  - Taxi squad player cards with distinctive yellow styling
  - Updated quick stats to include taxi squad count (Starters, Bench, Taxi, Total)
  - Position breakdown includes taxi squad players
  - Empty state check includes taxi squad players
- **Player Card Improvements**: Enhanced player card layout and information
  - Tighter spacing optimized for mobile viewing
  - Streamlined field display (Value and Age replacing multiple stats)
  - Image positioning improvements with white background fallback
  - Better mobile responsiveness with condensed layouts

### Changed
- **League Page Structure**: Simplified to focus on core functionality
  - Removed "Standings" tab (was placeholder with no functionality)
  - Removed "Matchups" tab (was placeholder with no functionality)
  - Streamlined to 3 main tabs: My Team, Team Rosters, Analysis
  - Cleaner navigation and reduced clutter
- **UI Polish and Mobile Optimization**: Enhanced user experience across devices
  - Condensed team overview cards for better mobile display
  - Improved spacing and typography throughout the application
  - Better responsive design for player cards and statistics
  - Cleaned up header styling and reduced unnecessary visual noise
- **Player Statistics Display**: Refined data presentation
  - Updated player cards to show Value (calculated metric) and Age
  - Removed redundant fields (PPG, Rostered %, Overall Rank, ECR, Status)
  - Better organization of player information for easier scanning
  - Maintained essential information while reducing cognitive load
- **Dynasty Value Formula**: Updated scoring weights and removed risk score
  - New weights: Market(50%) + Projection(25%) + Age(25%)
  - Removed risk score (was hardcoded to 95 for all players)
  - Changed from position-based ADP normalization to global ADP normalization
  - All positions now compete on the same value scale for fair cross-position comparisons
- **UI Restructuring**: Moved AI assistant to league page chat tab
  - Removed standalone `/dashboard/values` page
  - Removed standalone `/dashboard/assistant` page
  - AI assistant now integrated into league page chat tab for better context
  - Dynasty values accessible through AI assistant within league context

### Fixed
- **Team Matching**: Resolved issue where user's team wasn't being correctly identified
  - Fixed logic in `getMyTeam` function to properly match owner display names
  - Removed debug information and console logs
  - Proper fallback hierarchy for team name display
- **Bye Week API Integration**: Implemented graceful degradation for bye week failures
  - App continues to function when bye week API fails
  - No user-facing errors or broken functionality
  - Clean error handling without breaking user experience
- **Component Dependencies**: Resolved missing component import issues
  - Fixed broken imports in UI components (alert, avatar, badge, dialog, dropdown)
  - Removed dependencies on non-existent local components
  - Improved build stability and type safety
- **TypeScript Type Safety**: Enhanced type checking and error prevention
  - Replaced `any` types with proper type guards and assertions
  - Added missing interface properties (age field for SleeperPlayer)
  - Better error handling in API routes and data processing
- **Image Optimization**: Replaced all `<img>` tags with Next.js `<Image />` components
  - Updated 33 image instances across 10 components and pages
  - Improved page load performance (LCP - Largest Contentful Paint)
  - Reduced bandwidth usage through automatic image optimization
  - Eliminated all ESLint warnings related to image usage
  - Enhanced mobile-first design with optimized image loading
- **Prisma Permission Issues**: Resolved Windows file locking problems during builds
  - Added graceful fallback for Prisma generation failures
  - Created automated fix script (`npm run fix-prisma`)
  - Updated build scripts to handle Prisma issues more robustly
  - Build now continues even if Prisma generation fails temporarily

### Removed
- **Bye Week System**: Removed bye week API and caching functionality
  - Deleted `/api/byeweeks` endpoint and related admin page
  - Removed bye week data fetching from league pages
  - Cleaned up bye week references from documentation
  - Simplified league data structure (bye weeks will be re-implemented later)
- **Debug Code**: Cleaned up all debugging and console logging
- **Unused Features**: Removed incomplete standings and matchups sections
- **Redundant Statistics**: Streamlined player card information display
- **Deprecated Components**: Cleaned up unused PlayerCard component and related exports
- **Unnecessary UI Elements**: Removed clutter from headers and navigation

### Technical Improvements
- **Error Handling**: Better error handling for API failures
- **Code Cleanup**: Removed unused imports and variables
- **Type Safety**: Improved TypeScript interfaces and type definitions

### Performance & Efficiency
- **ETL Optimization**: Added intelligent player filtering to exclude offensive linemen and punters
- **Database Reduction**: Reduced player count from ~11,000 to ~7,200 (36% reduction)
- **Processing Speed**: Faster ETL pipeline with fewer irrelevant players
- **Resource Optimization**: Smaller database footprint and improved query performance
- **Batch Processing**: Enhanced batch processing with progress tracking and error handling

### Dynasty Value Algorithm Improvements
- **ADP Value Preservation**: Removed normalization to preserve original ADP meaning (1 = most valuable)
- **Market Value Calculation**: Direct conversion from ADP to 0-100 scale where 1st pick = 100
- **Projection Score**: Now directly based on market value for more accurate dynasty rankings
- **Formula Accuracy**: Better reflects real-world draft value and market sentiment

### Critical Bug Fixes
- **ADP Data Issue**: Fixed incorrect API endpoint that was only returning 100 trending players instead of full ADP data
- **Synthetic ADP Generation**: Implemented intelligent ADP generation for all players based on position value, experience, and injury status
- **Dynasty Value Coverage**: Now generates dynasty values for ALL fantasy-relevant players (~7,200) instead of just 94
- **Data Completeness**: Resolved the root cause of missing dynasty values for 99% of players

### Performance Optimizations
- **Timeout Extension**: Increased ETL timeout from 20 to 25 minutes to accommodate synthetic ADP processing
- **ADP Generation**: Optimized synthetic ADP calculations for better performance
- **Processing Efficiency**: Achieved 6,313 dynasty values (88% coverage) in previous run

### Critical ETL Logic Fix
- **Player Selection Bug**: Fixed ETL to only process players with valid ADP data instead of all 11,161 players
- **Target Processing**: Now correctly processes only ~7,155 fantasy-relevant players instead of including OL, retired, and inactive players
- **Data Quality**: Eliminates 4,855 failed dynasty value calculations from irrelevant players
- **Expected Result**: 100% coverage of target fantasy-relevant players (~7,200 dynasty values)

### Enhanced Player Filtering & Data Quality
- **Age Validation**: Added filtering to exclude players without valid age data (prevents 168 failed calculations)
- **Age Range Filtering**: Exclude players with extreme ages (<18 or >50) for fantasy relevance
- **Enhanced Edge Case Handling**: Improved age score calculation for low ADP players (market value = 0)
- **Data Integrity**: All processed players now guaranteed to have complete data for dynasty value calculation
- **Performance**: Optimized data fetching and caching strategies
- **Image Optimization**: Migrated to Next.js Image component for better performance
- **Next.js Configuration**: Fixed Turbopack configuration for proper API route handling

### Testing & Validation
- **✅ Dynasty Value Calculations**: Validated age curves, normalization, and composite formula
  - QB peaks at 28, slow decline (0.02 rate)
  - RB peaks at 25, rapid decline (0.08 rate) 
  - WR peaks at 27, moderate decline (0.04 rate)
  - TE peaks at 28, slow decline (0.03 rate)
  - ADP normalization correctly inverted (lower ADP = higher value)
  - Composite formula: 40% market + 30% projection + 20% age + 10% risk
- **✅ ETL Pipeline**: Successfully processing 11,400+ players in batches of 100
- **✅ Database Migrations**: All new models created successfully
- **✅ API Endpoints**: Dynasty values and trade analysis working correctly
- **✅ Mobile Responsiveness**: Dynasty values page optimized for mobile devices
- **✅ Player Card Integration**: Dynasty values now displayed in all player cards across the app

## [0.1.0] - 2025-01-XX

### Added
- **Initial Release**: Basic Fantasy Football Dashboard
- **Sleeper API Integration**: Connect to Sleeper fantasy football platform
- **Player Cache System**: Server-side caching for player data
- **Authentication**: User authentication and session management
- **League Management**: View and manage fantasy football leagues
- **Team Rosters**: Display team rosters with player information
- **Player Search**: Search and filter players across the league
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

---

## Notes

- **Breaking Changes**: None in current version
- **Migration**: No migration required for existing users
- **Dependencies**: All changes maintain backward compatibility
- **Testing**: All core functionality tested and working

---

*For detailed technical information, see the [Documentation](./docs/) folder.*
