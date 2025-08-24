# Fantasy Football Dashboard

A comprehensive fantasy football management application built with Next.js, featuring Sleeper API integration for real-time league data and player analytics.

## 🏈 Features

- **Multi-Account Support**: Manage multiple Sleeper accounts from one dashboard
- **League Management**: View and manage all your fantasy football leagues
- **Player Analytics**: Comprehensive player statistics and rankings
- **Team Rosters**: Detailed roster management with player cards
- **Real-time Data**: Live updates from Sleeper API
- **Responsive Design**: Works seamlessly on desktop and mobile

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
- **[🚀 Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment *(Coming Soon)*
- **[📖 User Guide](./docs/USER_GUIDE.md)** - How to use the dashboard *(Coming Soon)*

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: Custom auth system with NextAuth.js
- **API Integration**: [Sleeper Fantasy Football API](https://docs.sleeper.com/)
- **Database**: Prisma with PostgreSQL
- **Language**: TypeScript

## 🔌 API Integration

This application integrates with the Sleeper Fantasy Football API to provide:

- User account management
- League and roster data
- Player statistics and rankings
- Real-time updates

See [Sleeper API Documentation](./docs/SLEEPER_API.md) for complete endpoint and data structure details.

## 📁 Project Structure

```
my-project/
├── docs/                   # Documentation
├── src/
│   ├── app/               # Next.js app router
│   │   ├── dashboard/     # Dashboard pages
│   │   └── api/          # API routes
│   ├── components/        # Reusable UI components
│   └── lib/              # Utility functions
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
