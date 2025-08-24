# Fantasy Football Dashboard

A comprehensive fantasy football management application built with Next.js, featuring Sleeper API integration for real-time league data and player analytics.

## 🏈 Features

- **Multi-Account Support**: Manage multiple Sleeper accounts from one dashboard
- **League Management**: View and manage all your fantasy football leagues
- **My Team Dashboard**: Comprehensive view of your team with starters, bench, and taxi squad
- **Player Analytics**: Streamlined player cards with value metrics and key information
- **Team Rosters**: Detailed roster view for all teams in your league
- **Cached Data**: Server-side caching for improved performance and reliability
- **Mobile-First Design**: Optimized for mobile with responsive layouts
- **Taxi Squad Support**: Full support for taxi squad players and management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

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

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) folder:

- **[📖 Documentation Index](./docs/README.md)** - Overview of all documentation
- **[🏈 Sleeper API Reference](./docs/SLEEPER_API.md)** - Complete API documentation
- **[🔧 Development Guide](./docs/DEVELOPMENT.md)** - Setup and development workflow *(Coming Soon)*
- **[🚀 Deployment Guide](./docs/DEPLOYMENT.md)** - Vercel deployment and configuration
- **[📖 User Guide](./docs/USER_GUIDE.md)** - How to use the dashboard *(Coming Soon)*

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router and Turbopack
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with mobile-first design
- **Authentication**: Custom auth system with NextAuth.js
- **API Integration**: [Sleeper Fantasy Football API](https://docs.sleeper.com/)
- **Caching**: Server-side filesystem caching for performance
- **UI Components**: Custom component library with HeadlessUI
- **Language**: TypeScript with strict type checking

## 🔌 API Integration

This application integrates with the Sleeper Fantasy Football API to provide:

- User account management and multi-account support
- League and roster data (including taxi squads)
- Player statistics with calculated value metrics
- Cached data for improved performance
- Bye week information from NFL schedules
- Graceful error handling and fallback systems

See [Sleeper API Documentation](./docs/SLEEPER_API.md) for complete endpoint and data structure details.

## 📁 Project Structure

```
my-project/
├── docs/                   # Documentation
│   ├── README.md          # Documentation index
│   └── SLEEPER_API.md     # API documentation
├── src/
│   ├── app/               # Next.js app router
│   │   ├── dashboard/     # Dashboard pages
│   │   │   └── league/[id]/ # League-specific pages
│   │   ├── api/          # API routes (players)
│   │   └── admin/        # Admin panel for cache management
│   ├── components/        # Reusable UI components
│   └── lib/              # Utility functions
├── cache/                 # Server-side cache storage
├── prisma/                # Database schema
└── public/                # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Update documentation as needed
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Sleeper API Documentation](https://docs.sleeper.com/)
- [Prisma Documentation](https://www.prisma.io/docs)

---

*Built with ❤️ for fantasy football enthusiasts*
