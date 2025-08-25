'use client'

import { AuthGuard } from '@/components/auth-guard'
import Link from 'next/link'

export default function PlayerPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="mb-8">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🏈</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Player Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
              Individual player pages are coming soon!
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mb-8">
              We&apos;re working on detailed player statistics, news, and analysis features.
            </p>
          </div>
          
          <div className="space-y-4">
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
