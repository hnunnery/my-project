'use client'

import { AuthGuard } from '@/components/auth-guard'
import { useState, useEffect } from 'react'
import Link from 'next/link'

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

  // Load saved accounts from localStorage on component mount
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
  }, [])

  // Save accounts to localStorage whenever they change
  useEffect(() => {
    if (savedAccounts.length > 0) {
      localStorage.setItem('sleeperAccounts', JSON.stringify(savedAccounts))
    } else {
      localStorage.removeItem('sleeperAccounts')
    }
  }, [savedAccounts])

  const saveAccount = (user: SleeperUser) => {
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
  }

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

  const fetchSleeperData = async () => {
    if (!sleeperUsername.trim()) return

    setIsLoadingSleeper(true)
    setSleeperError('')
    
    try {
      // First get user info
      const userResponse = await fetch(`https://api.sleeper.app/v1/user/${sleeperUsername}`)
      if (!userResponse.ok) throw new Error('User not found')
      
      const user: SleeperUser = await userResponse.json()
      
      // Save account automatically when fetching data
      saveAccount(user)
      
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
      
      setSleeperData({ user, leagues })
    } catch (error) {
      console.error('Error fetching Sleeper data:', error)
      setSleeperError(error instanceof Error ? error.message : 'Failed to fetch data')
    } finally {
      setIsLoadingSleeper(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Fantasy Football Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your Sleeper fantasy football leagues
            </p>
          </div>

          {/* Saved Accounts */}
          {savedAccounts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                💾 Saved Sleeper Accounts
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedAccounts.map((account) => (
                  <div key={account.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      {account.avatar && (
                        <img 
                          src={`https://sleepercdn.com/avatars/thumbs/${account.avatar}`}
                          alt="Avatar" 
                          className="w-10 h-10 rounded-full"
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
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
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

          {/* Admin Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              ⚙️ Admin Panel
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
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
            
            <a 
              href="/admin/byeweeks" 
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-3"
            >
              <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Bye Week Cache Management
            </a>
          </div>

          {/* Sleeper Integration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              🏈 Sleeper Fantasy Football
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label htmlFor="sleeper-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sleeper Username
                </label>
                <input
                  type="text"
                  id="sleeper-username"
                  value={sleeperUsername}
                  onChange={(e) => setSleeperUsername(e.target.value)}
                  placeholder="Enter your Sleeper username..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={fetchSleeperData}
                  disabled={isLoadingSleeper || !sleeperUsername.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingSleeper ? 'Loading...' : 'Fetch Leagues'}
                </button>
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
                {sleeperData.user && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {sleeperData.user.avatar && (
                      <img 
                        src={`https://sleepercdn.com/avatars/thumbs/${sleeperData.user.avatar}`}
                        alt="Avatar" 
                        className="w-12 h-12 rounded-full"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </div>
      </div>
    </AuthGuard>
  )
}
