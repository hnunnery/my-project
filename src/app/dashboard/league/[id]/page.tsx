'use client'

import { AuthGuard } from '@/components/auth-guard'
import DynastyAssistant from '@/components/dynasty-assistant'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
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

interface SleeperRoster {
  roster_id: number
  owner_id: string
  players: string[]
  taxi: string[]
  metadata: {
    team_name?: string
  }
  starters: string[]
  reserve: string[]
  league_id: string
}

interface SleeperPlayer {
  player_id: string
  name: string
  position: string
  team: string
  search_rank: number
  fantasy_positions: string[]
  active: boolean
  injury_status?: string
  news_updated?: number
  age?: number
  // Enhanced fields for fantasy decision making
  fantasy_points?: number
  fantasy_points_ppr?: number
  fantasy_points_half_ppr?: number
  fantasy_points_standard?: number
  stats?: {
    week?: number
    season?: number
    passing_yards?: number
    rushing_yards?: number
    receiving_yards?: number
    touchdowns?: number
    interceptions?: number
    fumbles?: number
  }
  // Rankings and projections
  rank?: number
  rank_position?: number
  rank_ecr?: number
  rank_ppr?: number
  // Team context
  bye_week?: number
  game_week?: number
  opponent?: string
}

interface DynastyValue {
  dynastyValue: number | null;
  trend7d: number | null;
  trend30d: number | null;
}

interface LeagueData {
  league: SleeperLeague
  users: SleeperUser[]
  rosters: SleeperRoster[]
  players: Record<string, SleeperPlayer>
}

export default function LeaguePage() {
  const params = useParams()
  const leagueId = params.id as string
  
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'myteam' | 'rosters' | 'analysis' | 'chat'>('myteam')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Player analysis state
  const [startSitPlayer1, setStartSitPlayer1] = useState('')
  const [startSitPlayer2, setStartSitPlayer2] = useState('')
  
  // Dynasty values state
  const [dynastyValues, setDynastyValues] = useState<Record<string, DynastyValue>>({})
  const [dynastyValuesLoading, setDynastyValuesLoading] = useState(false)
  const [draftPlayerX, setDraftPlayerX] = useState('')
  const [draftPlayerY, setDraftPlayerY] = useState('')
  const [searchResults, setSearchResults] = useState<SleeperPlayer[]>([])

  useEffect(() => {
    if (leagueId) {
      fetchLeagueData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId])



  const fetchLeagueData = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const leagueResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`)
      if (!leagueResponse.ok) throw new Error('Failed to fetch league')
      const league: SleeperLeague = await leagueResponse.json()
      
      const usersResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`)
      if (!usersResponse.ok) throw new Error('Failed to fetch users')
      const users: SleeperUser[] = await usersResponse.json()
      
      const rostersResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`)
      if (!rostersResponse.ok) throw new Error('Failed to fetch rosters')
      const rosters: SleeperRoster[] = await rostersResponse.json()
      
      // Use our cached player data endpoint
      const playersResponse = await fetch('/api/players')
      if (!playersResponse.ok) throw new Error('Failed to fetch players')
      const playersData = await playersResponse.json()
      
      if (!playersData.success) {
        throw new Error('Failed to fetch player data')
      }
      

      
            const players = playersData.players

      // Process rosters to ensure bench players are properly calculated
      const processedRosters = rosters.map(roster => {
        // Always calculate bench players from the actual players array
        if (roster.players && roster.starters) {
          const benchPlayers = roster.players.filter((playerId: string) =>
            !roster.starters.includes(playerId)
          )
          return {
            ...roster,
            reserve: benchPlayers
          }
        }
        return roster
      })

      setLeagueData({ league, users, rosters: processedRosters, players })
    } catch (error) {
      console.error('Error fetching league data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch league data')
    } finally {
      setIsLoading(false)
    }
  }

  const getUserByOwnerId = (ownerId: string) => {
    return leagueData?.users.find(user => user.user_id === ownerId)
  }

  const getPlayerName = (playerId: string) => {
    const player = leagueData?.players[playerId]
    
    if (!player) {
      return 'Unknown Player'
    }
    
    // Use the best available name field
    return (player as SleeperPlayer & { full_name?: string }).full_name || player.name || 'Unknown Player'
  }

  const fetchDynastyValues = useCallback(async (playerIds: string[]) => {
    if (playerIds.length === 0) return;
    
    setDynastyValuesLoading(true);
    try {
      const response = await fetch('/api/dynasty/values/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIds })
      });
      
      if (response.ok) {
        const data = await response.json();
        setDynastyValues(data.values);
      }
    } catch (error) {
      console.error('Error fetching dynasty values:', error);
    } finally {
      setDynastyValuesLoading(false);
    }
  }, []);

  // Fetch dynasty values when league data is available
  useEffect(() => {
    if (leagueData?.players && Object.keys(leagueData.players).length > 0) {
      const playerIds = Object.keys(leagueData.players);
      fetchDynastyValues(playerIds);
    }
  }, [leagueData, fetchDynastyValues]);

  const getPlayerPosition = (playerId: string) => {
    const player = leagueData?.players[playerId]
    return player ? player.position : 'N/A'
  }

  const getPlayerTeam = (playerId: string) => {
    const player = leagueData?.players[playerId]
    return player ? player.team : 'N/A'
  }



  const getPlayerByeWeek = (playerId: string) => {
    const player = leagueData?.players[playerId]
    if (!player?.team) return null
    
    // First try to get from player data
    if (player.bye_week && typeof player.bye_week === 'number') {
      return player.bye_week
    }
    

    
    return null
  }

  const searchPlayers = (query: string) => {
    if (!leagueData?.players || !query.trim()) {
      setSearchResults([])
      return
    }
    
    const searchTerm = query.toLowerCase()
    const results = Object.values(leagueData.players)
      .filter(player => 
        player.name.toLowerCase().includes(searchTerm) ||
        player.team.toLowerCase().includes(searchTerm) ||
        player.position.toLowerCase().includes(searchTerm)
      )
      .slice(0, 10) // Limit to top 10 results
    
    setSearchResults(results)
  }





  // Player Search Input Component
  const PlayerSearchInput = ({ 
    value, 
    onChange, 
    placeholder, 
    onSearch 
  }: { 
    value: string
    onChange: (value: string) => void
    placeholder: string
    onSearch: (query: string) => void
  }) => (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          onSearch(e.target.value)
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
      />
      {searchResults.length > 0 && value && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 sm:max-h-60 overflow-auto">
          {searchResults.map((player) => (
            <div
              key={player.player_id}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0 active:bg-gray-200 dark:active:bg-gray-600"
              onClick={() => {
                onChange(player.name)
                setSearchResults([])
              }}
              onTouchStart={() => {
                // Add touch feedback for mobile
              }}
            >
                             <div className="font-medium text-gray-900 dark:text-white text-base">{player.name}</div>
               <div className="text-sm text-gray-500 dark:text-gray-400">
                 {player.position} • {player.team}
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Get current user's team by matching the owner username with the default saved account
  const getMyTeam = () => {
    if (!leagueData?.rosters || leagueData.rosters.length === 0) return null
    
    // Get the default saved Sleeper account
    let defaultUsername: string | null = null
    try {
      const savedAccounts = JSON.parse(localStorage.getItem('sleeperAccounts') || '[]')
             const defaultAccount = savedAccounts.find((account: { username: string; isDefault: boolean }) => account.isDefault)
      if (defaultAccount) {
        defaultUsername = defaultAccount.username
      }
    } catch (error) {
      console.error('Error reading saved Sleeper accounts:', error)
    }
    
          // If we have a default username, find the roster where the owner matches
      if (defaultUsername) {
        // Since usernames are undefined, try display name match first (case insensitive)
        const myRosterByDisplayName = leagueData.rosters.find(roster => {
          const owner = leagueData.users.find(user => user.user_id === roster.owner_id)
          return owner && owner.display_name && 
            owner.display_name.toLowerCase() === defaultUsername.toLowerCase()
        })
        
        if (myRosterByDisplayName) {
          return myRosterByDisplayName
        }
        
        // Fallback: try username match (in case it gets fixed)
        const myRoster = leagueData.rosters.find(roster => {
          const owner = leagueData.users.find(user => user.user_id === roster.owner_id)
          return owner && owner.username && owner.username === defaultUsername
        })
        
        if (myRoster) {
          return myRoster
        }
      }
    
    // Fallback: if no saved account or roster not found, show first roster
    return leagueData.rosters[0]
  }

  const myTeam = getMyTeam()
  const myTeamOwner = myTeam ? getUserByOwnerId(myTeam.owner_id) : null

  const filteredRosters = leagueData?.rosters.filter(roster => {
    if (!searchTerm) return true
    
    const owner = getUserByOwnerId(roster.owner_id)
    const teamName = roster.metadata?.team_name || owner?.display_name || owner?.username || 'Unknown Team'
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const teamNameLower = teamName.toLowerCase()
      const ownerUsernameLower = owner?.username?.toLowerCase() || ''
      
      if (!teamNameLower.includes(searchLower) && !ownerUsernameLower.includes(searchLower)) {
        return false
      }
    }
    
    return true
  }).sort((a, b) => {
    // Put user's own team first
    if (a.owner_id === myTeam?.owner_id) return -1
    if (b.owner_id === myTeam?.owner_id) return 1
    return 0
  }) || []

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading league data...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-xl mb-4">Error loading league</div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!leagueData) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-600 dark:text-gray-400 text-xl">League not found</div>
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 mt-4"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-3">
              <Link 
                href="/dashboard"
                className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm"
              >
                ← Back to Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {leagueData.league.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Season {leagueData.league.season} • {leagueData.league.settings.num_teams} teams
            </p>
            

          </div>

          <div className="border-b border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
            <nav className="-mb-px flex flex-wrap gap-2 sm:gap-8">
                             {[
                 { id: 'myteam', label: 'Team', icon: '🏆' },
                 { id: 'rosters', label: 'Rosters', icon: '📋' },
                 { id: 'analysis', label: 'Calculators', icon: '🧮' },
                 { id: 'chat', label: 'Chat', icon: '🤖' }
               ].map((tab) => (
                <button
                  key={tab.id}
                                     onClick={() => setActiveTab(tab.id as 'myteam' | 'rosters' | 'analysis' | 'chat')}
                  className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'myteam' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Team Overview Card */}
                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg shadow-sm p-2 sm:p-3 text-gray-800 dark:text-gray-200">
                  <div className="flex items-center gap-2">
                    {myTeamOwner?.avatar && (
                      <Image 
                        src={`https://sleepercdn.com/avatars/thumbs/${myTeamOwner.avatar}`}
                        alt="Avatar" 
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-indigo-200 dark:border-indigo-700"
                        width={32}
                        height={32}
                      />
                    )}
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold">
                        {myTeam?.metadata?.team_name || myTeamOwner?.display_name || myTeamOwner?.username || 'Unknown Team'}
                      </h3>
                    </div>
                  </div>
                </div>





                                 {/* Detailed Roster */}
                 <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
                  
                  <div className="space-y-4">
                    {/* Starters Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          Starters ({Array.isArray(myTeam?.starters) ? myTeam.starters.length : 0})
                        </h4>
                      </div>
                      <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                        {(Array.isArray(myTeam?.starters) ? myTeam.starters : []).map((playerId) => (
                          <li
                            key={playerId}
                            className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow-sm dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10"
                          >
                            <div className="flex w-full items-center space-x-3 p-4">
                              <div className="size-10 shrink-0 rounded-full bg-white dark:bg-white flex items-center justify-center outline -outline-offset-1 outline-black/5 dark:outline-white/10 overflow-hidden">
                                {(() => {
                                  const player = leagueData?.players[playerId]
                                  if (player?.search_rank) {
                                    return (
                                      <Image
                                        src={`https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`}
                                        alt={getPlayerName(playerId)}
                                        className="w-full h-full object-cover"
                                        width={40}
                                        height={40}
                                      />
                                    )
                                  }
                                  return null
                                })()}
                                <span className="fallback-text text-sm font-bold text-blue-700 dark:text-blue-300 hidden">
                                  {getPlayerPosition(playerId)}
                                </span>
                              </div>
                              <div className="flex-1 truncate">
                                <div className="flex items-center space-x-3">
                                                                     <h3 className="truncate text-base font-medium text-gray-900 dark:text-white">{getPlayerName(playerId)}</h3>
                                   <span className="inline-flex shrink-0 items-center rounded-full bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 inset-ring inset-ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:inset-ring-blue-500/10">
                                     {getPlayerPosition(playerId)}
                                   </span>
                                   <span className="inline-flex shrink-0 items-center rounded-full bg-gray-50 px-2 py-1 text-sm font-medium text-gray-700 inset-ring inset-ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:inset-ring-gray-500/10">
                                     {getPlayerTeam(playerId)}
                                  </span>
                                  {(() => {
                                    const byeWeek = getPlayerByeWeek(playerId)
                                    if (byeWeek !== null) {
                                      return (
                                        <span className="inline-flex shrink-0 items-center rounded-full bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-700 inset-ring inset-ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:inset-ring-orange-500/10">
                                          BYE: {byeWeek}
                                        </span>
                                      )
                                    }
                                    return null
                                  })()}
                                </div>
                              </div>
                            </div>
                            <div>
                              {/* Row 1: Value, Age */}
                              <div className="-mt-px flex divide-x divide-gray-200 dark:divide-white/10">
                                <div className="flex w-0 flex-1">
                                  <div className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-2 rounded-bl-lg border border-transparent py-2 text-xs font-medium text-gray-900 dark:text-white">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Value</span>
                                                                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                                        {(() => {
                                          if (dynastyValuesLoading) {
                                            return '...';
                                          }
                                          const dynastyValue = dynastyValues[playerId];
                                          if (dynastyValue?.dynastyValue !== null && dynastyValue?.dynastyValue !== undefined) {
                                            return dynastyValue.dynastyValue.toFixed(1);
                                          }
                                          return 'N/A';
                                        })()}
                                      </span>
                                  </div>
                                </div>
                                <div className="-ml-px flex w-0 flex-1">
                                  <div className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-2 rounded-br-lg border border-transparent py-2 text-xs font-medium text-gray-900 dark:text-white">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Age</span>
                                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                                      {(() => {
                                        const player = leagueData?.players[playerId]
                                        return player?.age || 'N/A'
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Bench Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          Bench ({Array.isArray(myTeam?.reserve) ? myTeam.reserve.length : 0})
                        </h4>
                      </div>
                      <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                        {(Array.isArray(myTeam?.reserve) ? myTeam.reserve : []).map((playerId) => (
                          <li
                            key={playerId}
                            className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow-sm dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10"
                          >
                            <div className="flex w-full items-center space-x-3 p-4">
                              <div className="size-10 shrink-0 rounded-full bg-white dark:bg-white flex items-center justify-center outline -outline-offset-1 outline-black/5 dark:outline-white/10 overflow-hidden">
                                {(() => {
                                  const player = leagueData?.players[playerId]
                                  if (player?.search_rank) {
                                    return (
                                      <Image
                                        src={`https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`}
                                        alt={getPlayerName(playerId)}
                                        className="w-full h-full object-cover"
                                        width={40}
                                        height={40}
                                      />
                                    )
                                  }
                                  return null
                                })()}
                                <span className="fallback-text text-sm font-bold text-gray-700 dark:text-gray-300 hidden">
                                  {getPlayerPosition(playerId)}
                                </span>
                              </div>
                              <div className="flex-1 truncate">
                                <div className="flex items-center space-x-3">
                                                                     <h3 className="truncate text-base font-medium text-gray-900 dark:text-white">{getPlayerName(playerId)}</h3>
                                   <span className="inline-flex shrink-0 items-center rounded-full bg-gray-50 px-2 py-1 text-sm font-medium text-gray-700 inset-ring inset-ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:inset-ring-gray-500/10">
                                     {getPlayerPosition(playerId)}
                                   </span>
                                   <span className="inline-flex shrink-0 items-center rounded-full bg-gray-50 px-2 py-1 text-sm font-medium text-gray-700 inset-ring inset-ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:inset-ring-gray-500/10">
                                     {getPlayerTeam(playerId)}
                                  </span>
                                  {(() => {
                                    const byeWeek = getPlayerByeWeek(playerId)
                                    if (byeWeek !== null) {
                                      return (
                                        <span className="inline-flex shrink-0 items-center rounded-full bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-700 inset-ring inset-ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:inset-ring-orange-500/10">
                                          BYE: {byeWeek}
                                        </span>
                                      )
                                    }
                                    return null
                                  })()}
                                </div>
                              </div>
                            </div>
                            <div>
                              {/* Row 1: Value, Age */}
                              <div className="-mt-px flex divide-x divide-gray-200 dark:divide-white/10">
                                <div className="flex w-0 flex-1">
                                  <div className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-2 rounded-bl-lg border border-transparent py-2 text-xs font-medium text-gray-900 dark:text-white">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Value</span>
                                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                                      {(() => {
                                        const dynastyValue = dynastyValues[playerId];
                                        if (dynastyValue?.dynastyValue !== null && dynastyValue?.dynastyValue !== undefined) {
                                          return dynastyValue.dynastyValue.toFixed(1);
                                        }
                                        return 'N/A';
                                      })()}
                                    </span>
                                  </div>
                                </div>
                                <div className="-ml-px flex w-0 flex-1">
                                  <div className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-2 rounded-br-lg border border-transparent py-2 text-xs font-medium text-gray-900 dark:text-white">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Age</span>
                                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                                      {(() => {
                                        const player = leagueData?.players[playerId]
                                        return player?.age || 'N/A'
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Taxi Squad Section */}
                    {Array.isArray(myTeam?.taxi) && myTeam.taxi.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                            Taxi Squad ({myTeam.taxi.length})
                          </h4>
                        </div>
                        <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                          {myTeam.taxi.map((playerId) => (
                            <li
                              key={playerId}
                              className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow-sm dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10"
                            >
                              <div className="flex w-full items-center space-x-3 p-4">
                                <div className="size-10 shrink-0 rounded-full bg-white dark:bg-white flex items-center justify-center outline -outline-offset-1 outline-black/5 dark:outline-white/10 overflow-hidden">
                                  {(() => {
                                    const player = leagueData?.players[playerId]
                                                                      if (player?.search_rank) {
                                    return (
                                      <Image
                                        src={`https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`}
                                        alt={getPlayerName(playerId)}
                                        className="w-full h-full object-cover"
                                        width={40}
                                        height={40}
                                      />
                                    )
                                  }
                                    return null
                                  })()}
                                  <span className="fallback-text text-sm font-bold text-yellow-700 dark:text-yellow-300 hidden">
                                    {getPlayerPosition(playerId)}
                                  </span>
                                </div>
                                <div className="flex-1 truncate">
                                  <div className="flex items-center space-x-3">
                                                                       <h3 className="truncate text-base font-medium text-gray-900 dark:text-white">{getPlayerName(playerId)}</h3>
                                   <span className="inline-flex shrink-0 items-center rounded-full bg-yellow-50 px-2 py-1 text-sm font-medium text-yellow-700 inset-ring inset-ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:inset-ring-yellow-500/10">
                                     {getPlayerPosition(playerId)}
                                   </span>
                                   <span className="inline-flex shrink-0 items-center rounded-full bg-gray-50 px-2 py-1 text-sm font-medium text-gray-700 inset-ring inset-ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:inset-ring-gray-500/10">
                                     {getPlayerTeam(playerId)}
                                    </span>
                                    {(() => {
                                      const byeWeek = getPlayerByeWeek(playerId)
                                      if (byeWeek !== null) {
                                        return (
                                          <span className="inline-flex shrink-0 items-center rounded-full bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-700 inset-ring inset-ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:inset-ring-orange-500/10">
                                            BYE: {byeWeek}
                                          </span>
                                        )
                                      }
                                      return null
                                    })()}
                                  </div>
                                </div>
                              </div>
                              <div>
                                {/* Row 1: Value, Age */}
                                <div className="-mt-px flex divide-x divide-gray-200 dark:divide-white/10">
                                  <div className="flex w-0 flex-1">
                                    <div className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-2 rounded-bl-lg border border-transparent py-2 text-xs font-medium text-gray-900 dark:text-white">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">Value</span>
                                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                                        {(() => {
                                          const dynastyValue = dynastyValues[playerId];
                                          if (dynastyValue?.dynastyValue !== null && dynastyValue?.dynastyValue !== undefined) {
                                            return dynastyValue.dynastyValue.toFixed(1);
                                          }
                                          return 'N/A';
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="-ml-px flex w-0 flex-1">
                                    <div className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-2 rounded-br-lg border border-transparent py-2 text-xs font-medium text-gray-900 dark:text-white">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">Age</span>
                                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                                        {(() => {
                                          const player = leagueData?.players[playerId]
                                          return player?.age || 'N/A'
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Empty State */}
                  {(!myTeam || (Array.isArray(myTeam.starters) ? myTeam.starters.length : 0) === 0 && (Array.isArray(myTeam.reserve) ? myTeam.reserve.length : 0) === 0 && (Array.isArray(myTeam.taxi) ? myTeam.taxi.length : 0) === 0) && (
                    <div className="text-center py-8 sm:py-12">
                      <div className="text-gray-400 dark:text-gray-500 text-4xl sm:text-6xl mb-4">🏈</div>
                      <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">No players on your roster yet</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Add some players to get started!</p>
                    </div>
                  )}
                </div>

                {/* Position Breakdown - Moved to Bottom */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mt-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">Position Breakdown</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    {['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].map(position => {
                      const positionPlayers = myTeam ? [
                        ...(Array.isArray(myTeam.starters) ? myTeam.starters : []),
                        ...(Array.isArray(myTeam.reserve) ? myTeam.reserve : []),
                        ...(Array.isArray(myTeam.taxi) ? myTeam.taxi : [])
                      ].filter(playerId => {
                        const player = leagueData?.players[playerId]
                        return player?.position === position
                      }) : []
                      
                      return (
                        <div key={position} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-600">
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{positionPlayers.length}</div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{position}</div>
                            {positionPlayers.length > 0 && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 hidden sm:block">
                                {positionPlayers.slice(0, 2).map(playerId => getPlayerName(playerId)).join(', ')}
                                {positionPlayers.length > 2 && ` +${positionPlayers.length - 2} more`}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
             </div>
           )}

          {activeTab === 'rosters' && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Team Rosters</h2>
               
                             <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                 <div className="space-y-3">
                   <div>
                     <label htmlFor="team-select" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Select Team
                     </label>
                     <select
                       id="team-select"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                     >
                       <option value="">All Teams</option>
                       {leagueData.rosters.map((roster) => {
                         const owner = getUserByOwnerId(roster.owner_id)
                         const teamName = roster.metadata?.team_name || owner?.display_name || owner?.username || 'Unknown Team'
                         return (
                           <option key={roster.roster_id} value={teamName}>
                             {teamName}
                           </option>
                         )
                       })}
                     </select>
                   </div>
                   
                   <div>
                     <label htmlFor="search" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Search Teams
                     </label>
                     <input
                       type="text"
                       id="search"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       placeholder="Search by team name or owner..."
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                     />
                   </div>
                 </div>
                  
                 <div className="mt-3 flex items-center justify-between text-xs sm:text-sm">
                   <span className="text-gray-500 dark:text-gray-400">
                     Showing {filteredRosters.length} of {leagueData.rosters.length} teams
                   </span>
                   {searchTerm && (
                     <button
                       onClick={() => setSearchTerm('')}
                       className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors duration-200"
                     >
                       Clear Filters
                     </button>
                   )}
                 </div>
                 

               </div>
               
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {filteredRosters.map((roster) => {
                  const owner = getUserByOwnerId(roster.owner_id)
                  const ownerName = owner?.display_name || 'Unknown'
                  const teamName = owner?.display_name || ownerName


                  return (
                    <div key={roster.roster_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        {owner?.avatar && (
                          <Image 
                            src={`https://sleepercdn.com/avatars/thumbs/${owner.avatar}`}
                            alt="Avatar" 
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                            width={40}
                            height={40}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {teamName}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                            @{owner?.username}
                          </p>
                        </div>
                        <div className="text-right text-xs sm:text-sm">
                          <div className="text-gray-500 dark:text-gray-400">
                            {(Array.isArray(roster.starters) ? roster.starters.length : 0) + (Array.isArray(roster.reserve) ? roster.reserve.length : 0)} players
                          </div>
                          <div className="text-gray-400 dark:text-gray-500">
                            {Array.isArray(roster.starters) ? roster.starters.length : 0} starters
                          </div>
                        </div>
                      </div>

                                             <div className="mb-4">
                         <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                           <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                           Starters ({Array.isArray(roster.starters) ? roster.starters.length : 0})
                         </h4>
                         <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                           {(Array.isArray(roster.starters) ? roster.starters : []).map((playerId) => (
                             <li
                               key={playerId}
                               className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow-sm dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10"
                             >
                               <div className="flex w-full items-center space-x-3 p-4">
                                 <div className="size-10 shrink-0 rounded-full bg-white dark:bg-white flex items-center justify-center overflow-hidden">
                                   {(() => {
                                     const player = leagueData?.players[playerId]
                                     if (player?.search_rank) {
                                       return (
                                         <Image
                                           src={`https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`}
                                           alt={getPlayerName(playerId)}
                                           className="w-full h-full object-cover"
                                           width={40}
                                           height={40}
                                         />
                                       )
                                     }
                                     return null
                                   })()}
                                   <span className="fallback-text text-sm font-bold text-blue-700 dark:text-blue-300 hidden">
                                     {getPlayerPosition(playerId)}
                                   </span>
                                 </div>
                                 <div className="flex-1 truncate">
                                   <div className="flex items-center space-x-3">
                                     <h3 className="truncate text-base font-medium text-gray-900 dark:text-white">{getPlayerName(playerId)}</h3>
                                     <span className="inline-flex shrink-0 items-center rounded-full bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 inset-ring inset-ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:inset-ring-blue-500/10">
                                       {getPlayerPosition(playerId)}
                                     </span>
                                     <span className="inline-flex shrink-0 items-center rounded-full bg-gray-50 px-2 py-1 text-sm font-medium text-gray-700 inset-ring inset-ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:inset-ring-gray-500/10">
                                       {getPlayerTeam(playerId)}
                                     </span>
                                     {(() => {
                                       const byeWeek = getPlayerByeWeek(playerId)
                                       if (byeWeek !== null) {
                                         return (
                                           <span className="inline-flex shrink-0 items-center rounded-full bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-700 inset-ring inset-ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:inset-ring-orange-500/10">
                                             BYE: {byeWeek}
                                           </span>
                                         )
                                       }
                                       return null
                                     })()}
                                   </div>
                                 </div>
                               </div>
                               <div>
                                 {/* Row 1: Value, Age */}
                                 <div className="-mt-px flex divide-x divide-gray-200 dark:divide-white/10">
                                   <div className="flex w-0 flex-1">
                                     <div className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-2 rounded-bl-lg border border-transparent py-2 text-xs font-medium text-gray-900 dark:text-white">
                                       <span className="text-xs text-gray-500 dark:text-gray-400">Value</span>
                                       <span className="text-xs font-medium text-gray-900 dark:text-white">
                                         {(() => {
                                           const dynastyValue = dynastyValues[playerId];
                                           if (dynastyValue?.dynastyValue !== null && dynastyValue?.dynastyValue !== undefined) {
                                             return dynastyValue.dynastyValue.toFixed(1);
                                           }
                                           return 'N/A';
                                         })()}
                                       </span>
                                     </div>
                                   </div>
                                   <div className="-ml-px flex w-0 flex-1">
                                     <div className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-2 rounded-br-lg border border-transparent py-2 text-xs font-medium text-gray-900 dark:text-white">
                                       <span className="text-xs text-gray-500 dark:text-gray-400">Age</span>
                                       <span className="text-xs font-medium text-gray-900 dark:text-white">
                                         {(() => {
                                           const player = leagueData?.players[playerId]
                                           return player?.age || 'N/A'
                                         })()}
                                       </span>
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             </li>
                           ))}
                         </ul>
                       </div>

                                             {Array.isArray(roster.reserve) && roster.reserve.length > 0 && (
                         <div>
                           <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                             <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                             Bench ({roster.reserve.length})
                           </h4>
                           <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                             {roster.reserve.map((playerId) => {
                               const player = leagueData?.players[playerId]
                               
                               return (
                                 <li
                                   key={playerId}
                                   className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow-sm dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10"
                                 >
                                   <div className="flex w-full items-center space-x-3 p-4">
                                     <div className="size-10 shrink-0 rounded-full bg-white dark:bg-white flex items-center justify-center overflow-hidden">
                                       {(() => {
                                         const player = leagueData?.players[playerId]
                                         if (player?.search_rank) {
                                           return (
                                             <Image
                                               src={`https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`}
                                               alt={getPlayerName(playerId)}
                                               className="w-full h-full object-cover"
                                               width={40}
                                               height={40}
                                             />
                                           )
                                         }
                                         return null
                                       })()}
                                       <span className="fallback-text text-sm font-bold text-gray-700 dark:text-gray-300 hidden">
                                         {getPlayerPosition(playerId)}
                                       </span>
                                     </div>
                                     <div className="flex-1 truncate">
                                       <div className="flex items-center space-x-3">
                                         <h3 className="truncate text-base font-medium text-gray-900 dark:text-white">{getPlayerName(playerId)}</h3>
                                         <span className="inline-flex shrink-0 items-center rounded-full bg-gray-50 px-2 py-1 text-sm font-medium text-gray-700 inset-ring inset-ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:inset-ring-gray-500/10">
                                           {getPlayerPosition(playerId)}
                                         </span>
                                         <span className="inline-flex shrink-0 items-center rounded-full bg-gray-50 px-2 py-1 text-sm font-medium text-gray-700 inset-ring inset-ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:inset-ring-gray-500/10">
                                           {getPlayerTeam(playerId)}
                                         </span>
                                         {(() => {
                                           const byeWeek = getPlayerByeWeek(playerId)
                                           if (byeWeek !== null) {
                                             return (
                                               <span className="inline-flex shrink-0 items-center rounded-full bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-700 inset-ring inset-ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:inset-ring-orange-500/10">
                                                 BYE: {byeWeek}
                                               </span>
                                             )
                                           }
                                           return null
                                         })()}
                                       </div>
                                     </div>
                                   </div>
                                   <div>
                                     {/* Row 1: Value, Age */}
                                     <div className="-mt-px flex divide-x divide-gray-200 dark:divide-white/10">
                                       <div className="flex w-0 flex-1">
                                         <div className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-2 rounded-bl-lg border border-transparent py-2 text-xs font-medium text-gray-900 dark:text-white">
                                           <span className="text-xs text-gray-500 dark:text-gray-400">Value</span>
                                           <span className="text-xs font-medium text-gray-900 dark:text-white">
                                             {(() => {
                                               const dynastyValue = dynastyValues[playerId];
                                               if (dynastyValue?.dynastyValue !== null && dynastyValue?.dynastyValue !== undefined) {
                                                 return dynastyValue.dynastyValue.toFixed(1);
                                               }
                                               return 'N/A';
                                             })()}
                                           </span>
                                         </div>
                                       </div>
                                       <div className="-ml-px flex w-0 flex-1">
                                         <div className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-2 rounded-br-lg border border-transparent py-2 text-xs font-medium text-gray-900 dark:text-white">
                                           <span className="text-xs text-gray-500 dark:text-gray-400">Age</span>
                                           <span className="text-xs font-medium text-gray-900 dark:text-white">
                                             {(() => {
                                               const player = leagueData?.players[playerId]
                                               return player?.age || 'N/A'
                                             })()}
                                           </span>
                                         </div>
                                       </div>
                                     </div>
                                   </div>
                                 </li>
                               )
                             })}
                           </ul>
                         </div>
                       )}
                       
                       {(Array.isArray(roster.starters) ? roster.starters.length : 0) === 0 && (Array.isArray(roster.reserve) ? roster.reserve.length : 0) === 0 && (
                         <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                           <p className="text-xs sm:text-sm">No players on roster</p>
                         </div>
                       )}
                     </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-4 sm:space-y-6">
              <DynastyAssistant leagueData={leagueData} dynastyValues={dynastyValues} />
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Fantasy Football Calculators</h2>
              
              {/* Start/Sit Decision Tool */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">🤔 Who Should I Start?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Player 1
                    </label>
                    <PlayerSearchInput
                      value={startSitPlayer1}
                      onChange={setStartSitPlayer1}
                      placeholder="Search for player..."
                      onSearch={searchPlayers}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Player 2
                    </label>
                    <PlayerSearchInput
                      value={startSitPlayer2}
                      onChange={setStartSitPlayer2}
                      placeholder="Search for player..."
                      onSearch={searchPlayers}
                    />
                  </div>
                </div>
                <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">
                  Compare Players
                </button>
              </div>



              {/* Draft Comparison Tool */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">🎯 Draft: Player X vs Player Y</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Player X
                    </label>
                    <PlayerSearchInput
                      value={draftPlayerX}
                      onChange={setDraftPlayerX}
                      placeholder="Search for player..."
                      onSearch={searchPlayers}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Player Y
                    </label>
                    <PlayerSearchInput
                      value={draftPlayerY}
                      onChange={setDraftPlayerY}
                      placeholder="Search for player..."
                      onSearch={searchPlayers}
                    />
                  </div>
                </div>
                <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm">
                  Compare Draft Value
                </button>
              </div>

              {/* Top Players by Position */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">🏆 Top Players by Position</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].map(position => (
                    <div key={position} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">{position}</h4>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Top players coming soon...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
