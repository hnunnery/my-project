'use client'

import { AuthGuard } from '@/components/auth-guard'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface SleeperUser {
  user_id: string
  username: string
  display_name: string
  avatar: string | null
}

interface SleeperLeague {
  league_id: string
  name: string
  season: string
  status: string
  settings: {
    name: string
    season: string
    num_teams: number
    playoff_teams: number
    playoff_start_week: number
  }
}

interface SavedSleeperAccount {
  id: string
  username: string
  displayName: string
  userId: string
  avatar: string | null
  isDefault: boolean
  lastUsed: number
}

export default function Dashboard() {
  const [sleeperUsername, setSleeperUsername] = useState('')
  const [savedAccounts, setSavedAccounts] = useState<SavedSleeperAccount[]>([])
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const [editUsername, setEditUsername] = useState('')
  const [sleeperData, setSleeperData] = useState<{
    user: SleeperUser | null
    leagues: SleeperLeague[]
  } | null>(null)
  const [isLoadingSleeper, setIsLoadingSleeper] = useState(false)
  const [sleeperError, setSleeperError] = useState('')
  const [storedLeagues, setStoredLeagues] = useState<{
    [username: string]: {
      user: SleeperUser
      leagues: SleeperLeague[]
      lastUpdated: number
    }
  }>({})

  // Load saved accounts and stored leagues from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('sleeperAccounts')
    if (saved) {
      try {
        const accounts = JSON.parse(saved) as SavedSleeperAccount[]
        setSavedAccounts(accounts)
        
        // Set default account username if exists
        const defaultAccount = accounts.find(acc => acc.isDefault)
        if (defaultAccount) {
          setSleeperUsername(defaultAccount.username)
        }
      } catch (error) {
        console.error('Error loading saved accounts:', error)
      }
    }

    // Load stored leagues
    const stored = localStorage.getItem('sleeperLeagues')
    if (stored) {
      try {
        const leagues = JSON.parse(stored)
        setStoredLeagues(leagues)
      } catch (error) {
        console.error('Error loading stored leagues:', error)
      }
    }
  }, [])

  // Auto-load stored data when username changes
  useEffect(() => {
    if (sleeperUsername && storedLeagues[sleeperUsername]) {
      const storedData = storedLeagues[sleeperUsername]
      setSleeperData({ user: storedData.user, leagues: storedData.leagues })
    } else {
      setSleeperData(null)
    }
  }, [sleeperUsername, storedLeagues])

  // Auto-fetch data for default account if no data exists
  useEffect(() => {
    if (sleeperUsername && !sleeperData && !isLoadingSleeper) {
      // Check if we have stored data that's fresh
      const storedData = storedLeagues[sleeperUsername]
      const isDataFresh = storedData && (Date.now() - storedData.lastUpdated) < 24 * 60 * 60 * 1000 // 24 hours
      
      if (!storedData || !isDataFresh) {
        // Auto-fetch if no data or data is stale
        // Note: fetchSleeperData will be available when this effect runs
        // We'll handle the auto-fetch in a separate effect after the function is defined
      }
    }
  }, [sleeperUsername, sleeperData, isLoadingSleeper, storedLeagues])

  // Save accounts to localStorage whenever they change
  useEffect(() => {
    if (savedAccounts.length > 0) {
      localStorage.setItem('sleeperAccounts', JSON.stringify(savedAccounts))
    } else {
      localStorage.removeItem('sleeperAccounts')
    }
  }, [savedAccounts])

  // Save leagues to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(storedLeagues).length > 0) {
      localStorage.setItem('sleeperLeagues', JSON.stringify(storedLeagues))
    } else {
      localStorage.removeItem('sleeperLeagues')
    }
  }, [storedLeagues])

  const saveAccount = useCallback((user: SleeperUser | null) => {
    // Guard against null/undefined user
    if (!user || !user.user_id) {
      return;
    }

    const existingAccount = savedAccounts.find(acc => acc.userId === user.user_id)
    
    if (existingAccount) {
      // Update existing account
      setSavedAccounts(prev => prev.map(acc => 
        acc.userId === user.user_id 
          ? { ...acc, username: user.username, displayName: user.display_name || user.username, avatar: user.avatar, lastUsed: Date.now() }
          : acc
      ))
    } else {
      // Add new account
      const newAccount: SavedSleeperAccount = {
        id: Date.now().toString(),
        username: user.username,
        displayName: user.display_name || user.username,
        userId: user.user_id,
        avatar: user.avatar,
        isDefault: savedAccounts.length === 0, // First account becomes default
        lastUsed: Date.now()
      }
      setSavedAccounts(prev => [...prev, newAccount])
    }
  }, [savedAccounts])

  const setDefaultAccount = (accountId: string) => {
    setSavedAccounts(prev => prev.map(acc => ({
      ...acc,
      isDefault: acc.id === accountId
    })))
    
    // Update username input to show default account
    const defaultAccount = savedAccounts.find(acc => acc.id === accountId)
    if (defaultAccount) {
      setSleeperUsername(defaultAccount.username)
    }
  }

  const removeAccount = (accountId: string) => {
    const accountToRemove = savedAccounts.find(acc => acc.id === accountId)
    if (accountToRemove?.isDefault && savedAccounts.length > 1) {
      // If removing default account, make the next one default
      const nextAccount = savedAccounts.find(acc => acc.id !== accountId)
      if (nextAccount) {
        setDefaultAccount(nextAccount.id)
      }
    }
    
    setSavedAccounts(prev => prev.filter(acc => acc.id !== accountId))
    
    // Clear username if it was the removed account
    if (accountToRemove?.username === sleeperUsername) {
      setSleeperUsername('')
    }
  }

  const startEditing = (account: SavedSleeperAccount) => {
    setEditingAccount(account.id)
    setEditUsername(account.username)
  }

  const saveEdit = (accountId: string) => {
    setSavedAccounts(prev => prev.map(acc => 
      acc.id === accountId 
        ? { ...acc, username: editUsername, lastUsed: Date.now() }
        : acc
    ))
    setEditingAccount(null)
    setEditUsername('')
  }

  const cancelEdit = () => {
    setEditingAccount(null)
    setEditUsername('')
  }

  const fetchSleeperData = useCallback(async (forceRefresh = false) => {
    if (!sleeperUsername.trim()) return

    // Check if we have stored data and it's not stale (less than 24 hours old)
    const storedData = storedLeagues[sleeperUsername]
    const twentyFourHours = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    
    if (!forceRefresh && storedData && (Date.now() - storedData.lastUpdated) < twentyFourHours) {
      // Use stored data if it's fresh
      setSleeperData({ user: storedData.user, leagues: storedData.leagues })
      return
    }

    setIsLoadingSleeper(true)
    setSleeperError('')
    
    try {
      // First get user info
      const userResponse = await fetch(`https://api.sleeper.app/v1/user/${sleeperUsername}`)
      if (!userResponse.ok) throw new Error('User not found')
      
      const user: SleeperUser = await userResponse.json()
      
      // Save account automatically when fetching data (only if user is valid)
      if (user && user.user_id) {
        saveAccount(user)
      }
      
      // Then get user's leagues
      const currentYear = new Date().getFullYear()
      const previousYear = currentYear - 1
      
      let leaguesResponse = await fetch(`https://api.sleeper.app/v1/user/${user.user_id}/leagues/nfl/${currentYear}`)
      if (!leaguesResponse.ok) {
        // Try previous year if current year fails
        leaguesResponse = await fetch(`https://api.sleeper.app/v1/user/${user.user_id}/leagues/nfl/${previousYear}`)
      }
      
      if (!leaguesResponse.ok) throw new Error('Failed to fetch leagues')
      
      const leagues: SleeperLeague[] = await leaguesResponse.json()
      
      // Store the new data
      const newData = { user, leagues, lastUpdated: Date.now() }
      setStoredLeagues(prev => ({ ...prev, [sleeperUsername]: newData }))
      
      setSleeperData({ user, leagues })
    } catch (error) {
      console.error('Error fetching Sleeper data:', error)
      setSleeperError(error instanceof Error ? error.message : 'Failed to fetch data')
      
      // If API fails but we have stored data, use that as fallback
      if (storedData) {
        setSleeperData({ user: storedData.user, leagues: storedData.leagues })
        setSleeperError('Using cached data due to API error. Data may be outdated.')
      }
    } finally {
      setIsLoadingSleeper(false)
    }
  }, [sleeperUsername, storedLeagues, saveAccount])

  // Auto-fetch data for default account after function is defined
  useEffect(() => {
    // Only auto-fetch if this is a saved account (not just typing in the input)
    const isSavedAccount = savedAccounts.some(acc => acc.username === sleeperUsername)
    
    if (sleeperUsername && !sleeperData && !isLoadingSleeper && isSavedAccount) {
      // Check if we have stored data that's fresh
      const storedData = storedLeagues[sleeperUsername]
      const isDataFresh = storedData && (Date.now() - storedData.lastUpdated) < 24 * 60 * 60 * 1000 // 24 hours
      
      if (!storedData || !isDataFresh) {
        // Auto-fetch if no data or data is stale
        fetchSleeperData(false)
      }
    }
  }, [sleeperUsername, sleeperData, isLoadingSleeper, storedLeagues, fetchSleeperData, savedAccounts])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                 <div className="max-w-7xl mx-auto py-4 px-3 sm:px-4 lg:px-6">
                      <div className="mb-4 text-center sm:text-left">
             <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
               Dynasty Dashboard
             </h1>
             <p className="text-gray-600 dark:text-gray-400 mt-2">
               Manage your Sleeper fantasy football leagues
             </p>
           </div>

                     {/* Saved Accounts */}
           {savedAccounts.length > 0 && (
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedAccounts.map((account) => (
                  <div key={account.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      {account.avatar && (
                        <Image 
                          src={`https://sleepercdn.com/avatars/thumbs/${account.avatar}`}
                          alt="Avatar" 
                          className="w-10 h-10 rounded-full"
                          width={40}
                          height={40}
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {account.displayName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{account.username}
                        </p>
                      </div>
                      {account.isDefault && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Default
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {!account.isDefault && (
                        <button
                          onClick={() => setDefaultAccount(account.id)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Set Default
                        </button>
                      )}
                      
                      <button
                        onClick={() => startEditing(account)}
                        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        Edit
                      </button>
                      
                      <button
                        onClick={() => removeAccount(account.id)}
                        className="px-3 py-1 text-xs bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    
                    {/* Edit Mode */}
                    {editingAccount === account.id && (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-600 rounded border">
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded dark:bg-gray-700 dark:text-white"
                          placeholder="New username"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => saveEdit(account.id)}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

                     {/* Sleeper Integration */}
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
               🏈 Sleeper Fantasy Football
             </h2>
             
             <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="flex-1">
                <label htmlFor="sleeper-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sleeper Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="sleeper-username"
                    value={sleeperUsername}
                    onChange={(e) => setSleeperUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && sleeperUsername.trim() && !isLoadingSleeper) {
                        fetchSleeperData(false)
                      }
                    }}
                    placeholder="Enter your Sleeper username..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                  {sleeperUsername && !sleeperData && isLoadingSleeper && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    </div>
                  )}
                </div>
                                  {sleeperUsername && !sleeperData && !isLoadingSleeper && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Press Enter or click &quot;Fetch Leagues&quot; to load your data
                    </p>
                  )}
              </div>
              
              <div className="flex items-end gap-2">
                <button
                  onClick={() => fetchSleeperData(false)}
                  disabled={isLoadingSleeper || !sleeperUsername.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingSleeper ? 'Loading...' : 'Fetch Leagues'}
                </button>
                {sleeperData && (
                  <button
                    onClick={() => fetchSleeperData(true)}
                    disabled={isLoadingSleeper}
                    className={`px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      (() => {
                        const storedData = storedLeagues[sleeperUsername]
                        if (storedData) {
                          const age = Date.now() - storedData.lastUpdated
                          const isStale = age > 24 * 60 * 60 * 1000 // 24 hours
                          return isStale 
                            ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }
                        return 'bg-gray-600 text-white hover:bg-gray-700'
                      })()
                    }`}
                    title="Force refresh data from API"
                  >
                    🔄 {(() => {
                      const storedData = storedLeagues[sleeperUsername]
                      if (storedData) {
                        const age = Date.now() - storedData.lastUpdated
                        const isStale = age > 24 * 60 * 60 * 1000 // 24 hours
                        return isStale ? 'Refresh (Stale)' : 'Refresh'
                      }
                      return 'Refresh'
                    })()}
                  </button>
                )}
              </div>
            </div>

            {sleeperError && (
              <div className="text-red-600 dark:text-red-400 text-sm">
                Error: {sleeperError}
              </div>
            )}

            {/* Display Sleeper Data */}
            {sleeperData && (
              <div className="mt-6 space-y-4">
                {/* Cache Status */}
                {(() => {
                  const storedData = storedLeagues[sleeperUsername]
                  if (storedData) {
                    const age = Date.now() - storedData.lastUpdated
                    const isStale = age > 24 * 60 * 60 * 1000 // 24 hours
                    const ageMinutes = Math.floor(age / (60 * 1000))
                    const ageHours = Math.floor(age / (60 * 60 * 1000))
                    const ageDays = Math.floor(age / (24 * 60 * 60 * 1000))
                    
                    return (
                      <div className={`p-3 rounded-lg text-sm ${
                        isStale 
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200' 
                          : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{isStale ? '⚠️' : '✅'}</span>
                            <span>
                              {isStale 
                                ? `Data is ${ageDays > 0 ? `${ageDays}d ${ageHours % 24}h` : `${ageHours}h ${ageMinutes % 60}m`} old` 
                                : `Data is fresh (${ageHours > 0 ? `${ageHours}h ${ageMinutes % 60}m` : `${ageMinutes}m`} old)`
                              }
                            </span>
                          </div>
                          {isStale && (
                            <button
                              onClick={() => fetchSleeperData(true)}
                              disabled={isLoadingSleeper}
                              className="px-3 py-1 text-xs bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isLoadingSleeper ? 'Refreshing...' : 'Refresh Now'}
                            </button>
                          )}
                        </div>
                        {isStale && (
                          <p className="mt-2 text-xs opacity-75">
                            Data is over 24 hours old. Click &quot;Refresh Now&quot; to get the latest information.
                          </p>
                        )}
                      </div>
                    )
                  }
                  return null
                })()}

                {sleeperData.user && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {sleeperData.user.avatar && (
                      <Image 
                        src={`https://sleepercdn.com/avatars/thumbs/${sleeperData.user.avatar}`}
                        alt="Avatar" 
                        className="w-12 h-12 rounded-full"
                        width={48}
                        height={48}
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {sleeperData.user.display_name || sleeperData.user.username}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        @{sleeperData.user.username}
                      </p>
                    </div>
                  </div>
                )}

                                 {sleeperData.leagues.length > 0 ? (
                   <div>
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                       Your Leagues ({sleeperData.leagues.length})
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {sleeperData.leagues.map((league) => (
                        <Link
                          key={league.league_id}
                          href={`/dashboard/league/${league.league_id}`}
                          className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            {league.name}
                          </h4>
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <p>Season: {league.season}</p>
                            <p>Teams: {league.settings.num_teams}</p>
                            <p>Status: {league.status}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No leagues found for this username</p>
                  </div>
                )}
              </div>
            )}
          </div>

                     {/* Admin Panel - Moved below leagues */}
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
               ⚙️ Admin Panel
             </h2>
             <p className="text-gray-600 dark:text-gray-400 mb-3">
               Manage system settings and data cache
             </p>
            <a 
              href="/admin/players" 
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Player Cache Management
            </a>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
