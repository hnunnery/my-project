# Fantasy Football Dynasty League Management App

A comprehensive fantasy football dynasty league management application with advanced player valuations, automated data pipelines, and trade analysis tools.

## 🏆 Key Features

### 🔥 Dynasty Values System
- **Daily ETL Pipeline** - Automated player data collection and processing from Sleeper API
- **Composite Dynasty Scoring** - Market data blended with age curves on a 0-100 scale
- **Position-Based Normalization** - Fair comparisons across QB, RB, WR, TE, K, DEF
- **Trend Analysis** - 7-day and 30-day value movement tracking with momentum indicators
- **Real-Time Rankings** - Live dynasty player valuations updated daily at 06:00 UTC
- **Trade Analysis API** - Compare player values for fair trade evaluation

### 🏈 League Management
- **Multi-Account Support**: Manage multiple Sleeper accounts from one dashboard
- **League Management**: View and manage all your fantasy football leagues
- **My Team Dashboard**: Comprehensive view of your team with starters, bench, and taxi squad
- **Player Analytics**: Streamlined player cards with value metrics and key information
- **Team Rosters**: Detailed roster view for all teams in your league
- **Taxi Squad Support**: Full support for taxi squad players and management

### 🚀 Core Platform
- **NextAuth.js** authentication with signup/signin flows
- **Prisma** ORM with PostgreSQL (Neon) database
- **Tailwind CSS** with dark mode support
- **Responsive design** optimized for mobile and desktop
- **Vercel deployment** with automated cron jobs

## 🎯 Why Dynasty Values Matter

Dynasty fantasy football requires long-term thinking unlike redraft leagues. The Dynasty Values system solves critical valuation problems:

- **Market Inefficiency**: ADP only reflects short-term sentiment
- **Age Bias**: Younger players often overvalued, older players undervalued  
- **Position Scarcity**: Different positions have different career arcs
- **Trade Complexity**: No standardized way to compare values across positions/ages

Our solution combines multiple data sources with position-specific modeling to create a single, comparable dynasty value for every NFL player.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router and Turbopack
- **Language**: TypeScript with strict type checking
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with dark mode
- **Authentication**: NextAuth.js with credentials provider
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **APIs**: [Sleeper Fantasy Football API](https://docs.sleeper.com/) integration
- **Deployment**: Vercel with Cron Jobs
- **Data Processing**: Custom ETL pipeline with batching optimization

## 📦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- PostgreSQL database (Neon recommended)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd my-project
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your environment variables:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

6. Initialize dynasty data (first time only):
```bash
curl http://localhost:3000/api/cron/dynasty
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏈 Dynasty Features Deep Dive

### Player Valuations
- **Composite Dynasty Scores** (0-100 scale) combining market data and age curves
- **Position-Specific Age Curves** accounting for different career arcs
- **Market Sentiment Analysis** from Sleeper ADP trending data
- **Trend Indicators** showing 7-day and 30-day value momentum

### Scoring Formula
```typescript
dynastyValue = (
  marketValue * 0.75 +      // ADP-based market sentiment
  ageScore * 0.25          // Age-adjusted value
)
```

### Age Curves by Position
- **QB**: Peak at 28-32, gradual decline (long careers)
- **RB**: Peak at 24-27, steep decline after 28 (short careers)
- **WR**: Peak at 25-29, moderate decline (medium careers)
- **TE**: Peak at 26-30, gradual decline (develop slowly)
- **K/DEF**: Minimal age impact

### Data Pipeline Architecture
1. **Extract**: Fetch 11,000+ NFL players and ADP data from Sleeper API
2. **Transform**: Position-based normalization, age adjustments, composite scoring
3. **Load**: Batch processing (100 records/transaction) to database
4. **Analyze**: Calculate 7d/30d trends against historical averages
5. **Serve**: API endpoints for UI consumption

## 🔐 Authentication

- **Sign up** with email/password at `/signup`
- **Sign in** with existing credentials at `/signin`
- **Protected routes** for dashboard and dynasty features
- **Session management** with JWT strategy (30-day expiration)

## 📱 Dynasty UI

### League Page Chat Tab (`/dashboard/league/[id]`)
- **AI Assistant Chat**: Integrated dynasty fantasy football advice
- **League Context**: Access dynasty values and analysis within league context
- **Player Analysis**: Get instant answers about trades, roster decisions, and strategy
- **Responsive Design**: Works on mobile and desktop
- **Real-time Data**: Updated daily via automated pipeline

### API Endpoints
- **`GET /api/dynasty/values`** - Player rankings with optional date filtering
- **`POST /api/trade`** - Trade analysis comparing player values between sides
- **`GET /api/cron/dynasty`** - ETL pipeline trigger (Vercel Cron)

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) folder:

- **[📖 Documentation Index](./docs/README.md)** - Overview of all documentation
- **[🏆 Dynasty Values System](./docs/DYNASTY_VALUES.md)** - Complete technical guide and business rationale
- **[🏈 Sleeper API Reference](./docs/SLEEPER_API.md)** - Complete API documentation
- **[🚀 Deployment Guide](./docs/DEPLOYMENT.md)** - Vercel deployment and configuration
- **[🔧 NextAuth Setup](./docs/NEXTAUTH_SETUP.md)** - Authentication configuration

## 🚀 Deployment

Configured for Vercel deployment with automated cron jobs:

1. Push code to GitHub
2. Connect repository to Vercel  
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push to main branch
5. Cron jobs run daily at 06:00 UTC to update dynasty values

### Vercel Cron Configuration
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

## 📊 Database Schema

### Core Models
- **Player**: Core player info (name, position, team, age)
- **Snapshot**: Raw market data with timestamps (ADP, future: KTC, FantasyPros)
- **ValueDaily**: Calculated dynasty values with trend analysis

### Why This Design
- **Normalization**: Avoid data duplication
- **Flexibility**: Support multiple data sources
- **Historical Tracking**: Maintain value trends over time
- **Performance**: Optimized for large datasets (11,000+ players)

## 📁 Project Structure

```
my-project/
├── docs/                   # Documentation
│   ├── README.md          # Documentation index
│   ├── DYNASTY_VALUES.md  # Dynasty system technical guide
│   └── SLEEPER_API.md     # API documentation
├── src/
│   ├── app/               # Next.js app router
│   │   ├── dashboard/     # Dashboard pages
│   │   │   ├── league/[id]/ # League-specific pages
│   │   │   └── values/    # Dynasty values page
│   │   ├── api/          # API routes
│   │   │   ├── dynasty/   # Dynasty values endpoints
│   │   │   ├── trade/     # Trade analysis endpoint
│   │   │   └── cron/      # Automated ETL triggers
│   │   └── admin/        # Admin panel for cache management
│   ├── components/        # Reusable UI components
│   └── lib/              # Utility functions
│       └── dynasty/      # Dynasty scoring algorithms
├── cache/                 # Server-side cache storage
├── prisma/                # Database schema and migrations
└── public/                # Static assets
```

## 🔧 Performance Optimizations

- **Batched Processing**: Handle 11,000+ players in 100-record chunks
- **Concurrent Safety**: Multiple ETL processes run without conflicts
- **Efficient Queries**: Optimized Prisma queries with proper relations
- **Caching Strategy**: 24-hour cache for external API calls
- **Error Handling**: Comprehensive logging and graceful failure recovery

## 🚀 Future Roadmap

### Immediate (Next 30 days)
- Enhanced projections from FantasyPros API
- Risk modeling with injury history
- Interactive trade calculator UI

### Medium-term (Next 90 days)  
- Dynasty tiers with K-means clustering
- Historical value trend visualization
- Position scarcity (VORP) calculations

### Long-term (6+ months)
- Machine learning for breakout predictions
- Social features and community rankings
- League integration for personalized recommendations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following existing patterns
4. Run verification: `npm run lint && npm run build`
5. Submit a pull request with detailed description

## 📄 License

This project is licensed under the MIT License.

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Sleeper API Documentation](https://docs.sleeper.com/)
- [Prisma Documentation](https://www.prisma.io/docs)

---

**Built for dynasty fantasy football managers who want data-driven insights for long-term roster building and fair trade evaluation.**
