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

  const [sleeperData, setSleeperData] = useState<{
    user: SleeperUser | null
    leagues: SleeperLeague[]
  } | null>(null)
  const [isLoadingSleeper, setIsLoadingSleeper] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sleeperError, setSleeperError] = useState('')
  const [storedLeagues, setStoredLeagues] = useState<{
    [username: string]: {
      user: SleeperUser
      leagues: SleeperLeague[]
      lastUpdated: number
    }
  }>({})
  const [showSuccess, setShowSuccess] = useState(false)

  const normalizeUsername = (name: string) => name.trim().toLowerCase()

  // Load saved accounts and stored leagues from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('sleeperAccounts')
    if (saved) {
      try {
        const accounts = JSON.parse(saved) as SavedSleeperAccount[]
        const normalizedAccounts = accounts.map(acc => ({
          ...acc,
          username: normalizeUsername(acc.username)
        }))
        setSavedAccounts(normalizedAccounts)

        // Set default account username if exists
        const defaultAccount = normalizedAccounts.find(acc => acc.isDefault)
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
        const normalizedLeagues: typeof storedLeagues = {}
        Object.keys(leagues).forEach(key => {
          normalizedLeagues[normalizeUsername(key)] = leagues[key]
        })
        setStoredLeagues(normalizedLeagues)
      } catch (error) {
        console.error('Error loading stored leagues:', error)
      }
    }
  }, [])

  // Auto-load stored data when username changes
  useEffect(() => {
    const normalized = normalizeUsername(sleeperUsername)
    if (normalized && storedLeagues[normalized]) {
      const storedData = storedLeagues[normalized]
      setSleeperData({ user: storedData.user, leagues: storedData.leagues })
    } else if (!showSuccess) {
      setSleeperData(null)
    }
  }, [sleeperUsername, storedLeagues, showSuccess])

  // Auto-fetch data for default account if no data exists
  useEffect(() => {
    const normalized = normalizeUsername(sleeperUsername)
    if (normalized && !sleeperData && !isLoadingSleeper) {
      // Check if we have stored data that's fresh
      const storedData = storedLeagues[normalized]
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

  // Hide success message after it appears
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])

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
          ? { ...acc, username: normalizeUsername(user.username), displayName: user.display_name || user.username, avatar: user.avatar, lastUsed: Date.now() }
          : acc
      ))
    } else {
      // Add new account
      const newAccount: SavedSleeperAccount = {
        id: Date.now().toString(),
        username: normalizeUsername(user.username),
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

    if (accountToRemove) {
      setStoredLeagues(prev => {
        const updated = { ...prev }
        delete updated[normalizeUsername(accountToRemove.username)]
        return updated
      })
    }

    // Clear username if it was the removed account
    if (accountToRemove && normalizeUsername(accountToRemove.username) === normalizeUsername(sleeperUsername)) {
      setSleeperUsername('')
    }
  }



  const fetchSleeperData = useCallback(async (forceRefresh = false) => {
    const normalizedUsername = normalizeUsername(sleeperUsername)
    if (!normalizedUsername) return

    // Check if we have stored data and it's not stale (less than 24 hours old)
    const storedData = storedLeagues[normalizedUsername]
    const twentyFourHours = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    
    if (!forceRefresh && storedData && (Date.now() - storedData.lastUpdated) < twentyFourHours) {
      // Use stored data if it's fresh
      setSleeperData({ user: storedData.user, leagues: storedData.leagues })
      return
    }

    if (forceRefresh) setIsRefreshing(true)
    setIsLoadingSleeper(true)
    setSleeperError('')
    setShowSuccess(false)
    
    try {
      // First get user info
      const userResponse = await fetch(`https://api.sleeper.app/v1/user/${normalizedUsername}`)
      if (!userResponse.ok) throw new Error('User not found')
      
      const user: SleeperUser = await userResponse.json()
      
      // Debug: Log the user object to see what we're getting
      console.log('Sleeper API response:', { normalizedUsername, user, hasUserId: !!user?.user_id })
      
      // Save account automatically when fetching data (only if user is valid)
      if (user && user.user_id) {
        saveAccount(user)
      }
      
      // Then get user's leagues
      if (!user || !user.user_id) {
        console.error('Invalid user data:', user)
        throw new Error(`Invalid user data received from API. Expected user_id but got: ${JSON.stringify(user)}`)
      }
      
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
      if (!user.username) {
        throw new Error('User username is missing')
      }
      
      const userKey = normalizeUsername(user.username)
      const newData = { user, leagues, lastUpdated: Date.now() }
      setStoredLeagues(prev => ({ ...prev, [userKey]: newData }))

      setSleeperData({ user, leagues })

      if (!forceRefresh) {
        setShowSuccess(true)
        // Clear the input to prepare for adding another account
        setSleeperUsername('')
      }
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
      if (forceRefresh) setIsRefreshing(false)
    }
  }, [sleeperUsername, storedLeagues, saveAccount])

  // Auto-fetch data for default account after function is defined
  useEffect(() => {
    // Only auto-fetch if this is a saved account (not just typing in the input)
    const normalized = normalizeUsername(sleeperUsername)
    const isSavedAccount = savedAccounts.some(acc => normalizeUsername(acc.username) === normalized)

    if (normalized && !sleeperData && !isLoadingSleeper && isSavedAccount) {
      // Check if we have stored data that's fresh
      const storedData = storedLeagues[normalized]
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
                 <div className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-3 sm:px-4 lg:px-6">
                      <div className="mb-6 sm:mb-8 lg:mb-12 text-center sm:text-left">
             <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
               Dynasty Dashboard
             </h1>
             <p className="text-gray-600 dark:text-gray-400 mt-2">
               Manage your Sleeper fantasy football leagues
             </p>
           </div>

                                {/* Saved Accounts */}
           {savedAccounts.length > 0 && (
             <div className="bg-transparent rounded-lg shadow-lg p-4 mb-4">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                 {savedAccounts.map((account) => (
                   <div key={account.id} className="p-4 bg-transparent rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                     <div className="flex items-center gap-2 mb-2">
                       {account.avatar && (
                         <Image 
                           src={`https://sleepercdn.com/avatars/thumbs/${account.avatar}`}
                           alt="Avatar" 
                           className="w-8 h-8 rounded-full"
                           width={32}
                           height={32}
                         />
                       )}
                       <div className="flex-1 min-w-0 flex items-center gap-2">
                         <h3 className="font-medium text-gray-900 dark:text-white text-base truncate">
                           {account.displayName}
                         </h3>
                         <button
                           onClick={() => removeAccount(account.id)}
                           className="p-1.5 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors flex-shrink-0"
                           title="Remove account"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                           </svg>
                         </button>
                       </div>
                       <input
                         type="radio"
                         name="defaultAccount"
                         id={`default-${account.id}`}
                         checked={account.isDefault}
                         onChange={() => setDefaultAccount(account.id)}
                         className="w-5 h-5 text-indigo-600 bg-transparent border-2 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-1 dark:focus:ring-offset-gray-800 cursor-pointer flex-shrink-0"
                       />
                     </div>
                    

                  </div>
                ))}
              </div>
            </div>
          )}

            {/* My Leagues Section */}
            {savedAccounts.length > 0 && (() => {
              const selectedAccount = savedAccounts.find(acc => acc.isDefault)
              if (!selectedAccount) return null

              const accountData = storedLeagues[normalizeUsername(selectedAccount.username)]
              const leagueCount = accountData?.leagues.length ?? 0

              return (
                <div className="bg-transparent rounded-lg shadow-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      My Leagues ({leagueCount})
                    </h2>
                    {accountData && (
                      <button
                        onClick={() => fetchSleeperData(true)}
                        disabled={isLoadingSleeper}
                        className="p-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                        title="Refresh leagues data"
                      >
                        <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {(() => {
                    if (isRefreshing) {
                      const skeletonCount = Math.max(leagueCount, 3)
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Array.from({ length: skeletonCount }).map((_, i) => (
                            <div
                              key={i}
                              className="p-4 bg-transparent border-2 border-gray-200 dark:border-gray-600 rounded-lg animate-pulse"
                            >
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                          ))}
                        </div>
                      )
                    }

                    if (!accountData || leagueCount === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <p>No leagues found for {selectedAccount.displayName}</p>
                          <p className="text-sm mt-1">Add leagues using the form below</p>
                        </div>
                      )
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {accountData.leagues.map((league) => (
                          <Link
                            key={league.league_id}
                            href={`/dashboard/league/${league.league_id}`}
                            className="block p-4 bg-transparent border-2 border-gray-200 dark:border-gray-600 rounded-lg active:bg-gray-100 dark:active:bg-gray-700 active:scale-95 transition-transform duration-150 cursor-pointer"
                          >
                            <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-3 truncate">
                              {league.name}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>Season: {league.season}</span>
                              <span>Teams: {league.settings.num_teams}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )
            })()}

            {/* Sleeper Integration */}
           <div className="bg-transparent rounded-lg shadow-lg p-4 mb-4">
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
               Add New Account
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
                    name="sleeper-username"
                    value={sleeperUsername}
                    onChange={(e) => setSleeperUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && sleeperUsername.trim() && !isLoadingSleeper) {
                        fetchSleeperData(false)
                      }
                    }}
                    placeholder="Enter your Sleeper username..."
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                  {sleeperUsername && !sleeperData && isLoadingSleeper && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    </div>
                  )}
                </div>
                {isLoadingSleeper ? (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Getting leagues...</p>
                ) : (
                  sleeperUsername && !sleeperData && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Press Enter or click &quot;Add Leagues&quot; to load your data
                    </p>
                  )
                )}
              </div>

              <div className="flex items-end gap-2">
                                 <button
                   onClick={() => fetchSleeperData(false)}
                   disabled={isLoadingSleeper || !sleeperUsername.trim()}
                   className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isLoadingSleeper ? 'Getting leagues...' : 'Add Leagues'}
                 </button>

              </div>
            </div>

            {sleeperError && (
              <div className="text-red-600 dark:text-red-400 text-sm">
                Error: {sleeperError}
              </div>
            )}

            {/* Success Message */}
            {showSuccess && sleeperData && !isLoadingSleeper && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                      Account Added Successfully!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {sleeperData.user?.display_name || sleeperData.user?.username} has been added with {sleeperData.leagues.length} leagues.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

                     {/* Admin Panel - Moved below leagues */}
           <div className="bg-transparent rounded-lg shadow-lg p-4 mb-4">
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
