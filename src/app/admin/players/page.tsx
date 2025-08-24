'use client'

import { useState, useEffect } from 'react'

interface CacheStatus {
  success: boolean
  cached: boolean
  expired?: boolean
  lastUpdated: number
  playerCount: number
  error?: string
}

export default function AdminPlayersPage() {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchCacheStatus()
  }, [])

  const fetchCacheStatus = async () => {
    try {
      const response = await fetch('/api/players')
      const data = await response.json()
      setCacheStatus(data)
    } catch (error) {
      console.error('Error fetching cache status:', error)
      setMessage('Failed to fetch cache status')
    }
  }

  const forceRefresh = async () => {
    setIsRefreshing(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceRefresh: true }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage(`Successfully refreshed player data! Fetched ${data.playerCount} players.`)
        fetchCacheStatus() // Refresh the status
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error forcing refresh:', error)
      setMessage('Failed to force refresh')
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getCacheAge = (timestamp: number) => {
    const now = Date.now()
    const age = now - timestamp
    const hours = Math.floor(age / (1000 * 60 * 60))
    const minutes = Math.floor((age % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`
    }
    return `${minutes}m ago`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Player Data Cache Management
            </h1>
            
            {message && (
              <div className={`mb-6 p-4 rounded-md ${
                message.includes('Successfully') 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              }`}>
                {message}
              </div>
            )}

            {cacheStatus && (
              <div className="space-y-6">
                {/* Cache Status */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Cache Status
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cacheStatus.cached 
                            ? cacheStatus.expired 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                        }`}>
                          {cacheStatus.cached 
                            ? cacheStatus.expired 
                              ? 'Expired Cache'
                              : 'Valid Cache'
                            : 'Fresh Data'
                          }
                        </span>
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Player Count</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {cacheStatus.playerCount.toLocaleString()} players
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formatDate(cacheStatus.lastUpdated)}
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Cache Age</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {getCacheAge(cacheStatus.lastUpdated)}
                      </dd>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Actions
                  </h3>
                  
                  <div className="space-y-4">
                    <button
                      onClick={forceRefresh}
                      disabled={isRefreshing}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        isRefreshing
                          ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
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
                </div>

                {/* Information */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200 mb-2">
                    How It Works
                  </h3>
                  <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                    <p>• Player data is automatically fetched from Sleeper API and cached for 24 hours</p>
                    <p>• The cache reduces API calls and improves performance</p>
                    <p>• Use &quot;Force Refresh Cache&quot; to manually update the data</p>
                    <p>• Cache is stored locally on the server in JSON format</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
