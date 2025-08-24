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
