'use client'

import { useState, useEffect } from 'react'

interface ByeWeekCacheStatus {
  cached: boolean
  lastUpdated: string
  season: string
  playerCount?: number
  warning?: string
}

export default function ByeWeekCachePage() {
  const [cacheStatus, setCacheStatus] = useState<ByeWeekCacheStatus | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCacheStatus()
  }, [])

  const fetchCacheStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/byeweeks')
      if (response.ok) {
        const data = await response.json()
        setCacheStatus({
          cached: data.cached,
          lastUpdated: data.lastUpdated,
          season: data.season,
          playerCount: Object.keys(data.data || {}).length,
          warning: data.warning
        })
      } else {
        setMessage('Failed to fetch cache status')
      }
    } catch (error) {
      setMessage('Error fetching cache status')
    } finally {
      setIsLoading(false)
    }
  }

  const forceRefreshCache = async () => {
    try {
      setIsRefreshing(true)
      setMessage('')
      
      const response = await fetch('/api/byeweeks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceRefresh: true }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessage('Cache refreshed successfully!')
        // Refresh the status
        await fetchCacheStatus()
      } else {
        setMessage('Failed to refresh cache')
      }
    } catch (error) {
      setMessage('Error refreshing cache')
    } finally {
      setIsRefreshing(false)
    }
  }

  const getCacheAge = (lastUpdated: string) => {
    const lastUpdate = new Date(lastUpdated)
    const now = new Date()
    const diffMs = now.getTime() - lastUpdate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else {
      return 'Less than an hour ago'
    }
  }

  const getCacheStatusColor = (cached: boolean) => {
    return cached ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
  }

  const getCacheStatusText = (cached: boolean) => {
    return cached ? 'Valid' : 'Fresh'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400 text-xl">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <a 
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              ← Back to Dashboard
            </a>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bye Week Cache Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage the cached bye week data for NFL teams
          </p>
        </div>

        {/* Cache Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Cache Status
          </h2>
          
          {cacheStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                  <span className={`ml-2 text-sm font-semibold ${getCacheStatusColor(cacheStatus.cached)}`}>
                    {getCacheStatusText(cacheStatus.cached)}
                  </span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Season:</span>
                  <span className="ml-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {cacheStatus.season}
                  </span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Teams:</span>
                  <span className="ml-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {cacheStatus.playerCount || 0}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated:</span>
                  <span className="ml-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {cacheStatus.lastUpdated}
                  </span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Age:</span>
                  <span className="ml-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {getCacheAge(cacheStatus.lastUpdated)}
                  </span>
                </div>
                
                {cacheStatus.warning && (
                  <div>
                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Warning:</span>
                    <span className="ml-2 text-sm text-yellow-600 dark:text-yellow-400">
                      {cacheStatus.warning}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Actions
          </h2>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={forceRefreshCache}
              disabled={isRefreshing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Force Refresh Cache
                </>
              )}
            </button>
            
            <button
              onClick={fetchCacheStatus}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Status
            </button>
          </div>
          
          {message && (
            <div className={`mt-4 p-3 rounded-md ${
              message.includes('successfully') 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The bye week cache system automatically fetches and stores NFL team bye week information to ensure consistent data availability.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Cache Behavior:</h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-2 mb-4">
              <li>• <strong>Cache Duration:</strong> 30 days (bye weeks are static for the season)</li>
              <li>• <strong>Data Source:</strong> Sleeper NFL schedule API</li>
              <li>• <strong>Automatic Refresh:</strong> When cache expires or on first request</li>
              <li>• <strong>Fallback:</strong> Uses expired cache if fresh fetch fails</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Benefits:</h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-2">
              <li>• <strong>Reliability:</strong> Bye week data always available</li>
              <li>• <strong>Performance:</strong> No need to fetch from Sleeper API repeatedly</li>
              <li>• <strong>Consistency:</strong> All players show correct bye week information</li>
              <li>• <strong>Efficiency:</strong> Reduces API calls and improves user experience</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
