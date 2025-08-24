import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tailwindcss.com',
        port: '',
        pathname: '/plus-assets/**',
      },
      {
        protocol: 'https',
        hostname: 'sleepercdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  turbopack: {
    resolveAlias: {
      // Ensure API routes are properly resolved
      '@': './src',
    },
  },
};

export default nextConfig;
