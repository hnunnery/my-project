import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CACHE_FILE_PATH = path.join(process.cwd(), 'data', 'players-cache.json')
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

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
  rank?: number
  rank_position?: number
  rank_ecr?: number
  rank_ppr?: number
  bye_week?: number
  game_week?: number
  opponent?: string
}

interface CachedData {
  lastUpdated: number
  players: Record<string, SleeperPlayer>
}

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(CACHE_FILE_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Read cached data
function readCachedData(): CachedData | null {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const data = fs.readFileSync(CACHE_FILE_PATH, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error reading cached data:', error)
  }
  return null
}

// Write data to cache
function writeCachedData(data: CachedData) {
  try {
    ensureDataDirectory()
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error writing cached data:', error)
  }
}

// Check if cache is valid
function isCacheValid(cachedData: CachedData): boolean {
  const now = Date.now()
  return (now - cachedData.lastUpdated) < CACHE_DURATION
}

// Fetch fresh data from Sleeper API
async function fetchFreshData(): Promise<Record<string, SleeperPlayer>> {
  try {
    console.log('Fetching fresh player data from Sleeper API...')
    
    // Try current year first
    const currentYear = new Date().getFullYear()
    let response = await fetch(`https://api.sleeper.app/v1/players/nfl/${currentYear}`)
    
    if (!response.ok) {
      // Fallback to base endpoint
      response = await fetch('https://api.sleeper.app/v1/players/nfl')
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch players: ${response.status}`)
    }
    
    const players = await response.json()
    console.log(`Successfully fetched ${Object.keys(players).length} players`)
    
    return players
  } catch (error) {
    console.error('Error fetching fresh data:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if we have valid cached data
    const cachedData = readCachedData()
    
    if (cachedData && isCacheValid(cachedData)) {
      console.log('Returning cached player data')
      return NextResponse.json({
        success: true,
        cached: true,
        lastUpdated: cachedData.lastUpdated,
        playerCount: Object.keys(cachedData.players).length,
        players: cachedData.players
      })
    }
    
    // Cache is invalid or doesn't exist, fetch fresh data
    console.log('Cache invalid or expired, fetching fresh data...')
    const freshPlayers = await fetchFreshData()
    
    // Save to cache
    const newCachedData: CachedData = {
      lastUpdated: Date.now(),
      players: freshPlayers
    }
    
    writeCachedData(newCachedData)
    
    return NextResponse.json({
      success: true,
      cached: false,
      lastUpdated: newCachedData.lastUpdated,
      playerCount: Object.keys(freshPlayers).length,
      players: freshPlayers
    })
    
  } catch (error) {
    console.error('Error in players API:', error)
    
    // If we have cached data, return it even if expired
    const cachedData = readCachedData()
    if (cachedData) {
      console.log('Returning expired cached data due to fetch error')
      return NextResponse.json({
        success: true,
        cached: true,
        expired: true,
        lastUpdated: cachedData.lastUpdated,
        playerCount: Object.keys(cachedData.players).length,
        players: cachedData.players,
        error: 'Using expired cache due to fetch error'
      })
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch player data and no cache available' 
      },
      { status: 500 }
    )
  }
}

// Force refresh endpoint (for admin use)
export async function POST(request: NextRequest) {
  try {
    const { forceRefresh } = await request.json()
    
    if (forceRefresh) {
      console.log('Force refreshing player data...')
      const freshPlayers = await fetchFreshData()
      
      const newCachedData: CachedData = {
        lastUpdated: Date.now(),
        players: freshPlayers
      }
      
      writeCachedData(newCachedData)
      
      return NextResponse.json({
        success: true,
        message: 'Player data force refreshed',
        lastUpdated: newCachedData.lastUpdated,
        playerCount: Object.keys(freshPlayers).length
      })
    }
    
    return NextResponse.json({ success: false, error: 'Invalid request' })
  } catch (error) {
    console.error('Error in force refresh:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to force refresh' },
      { status: 500 }
    )
  }
}
