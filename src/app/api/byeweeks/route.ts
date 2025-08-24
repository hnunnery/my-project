import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CACHE_FILE_PATH = path.join(process.cwd(), 'data', 'byeweeks-cache.json')
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

interface ByeWeekData {
  [team: string]: number
}

interface CachedData {
  data: ByeWeekData
  lastUpdated: number
  season: string
}

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(CACHE_FILE_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Read cached bye week data
function readCachedData(): CachedData | null {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const fileContent = fs.readFileSync(CACHE_FILE_PATH, 'utf-8')
      return JSON.parse(fileContent)
    }
  } catch (error) {
    console.error('Error reading bye week cache:', error)
  }
  return null
}

// Write bye week data to cache
function writeCachedData(data: ByeWeekData, season: string) {
  try {
    ensureDataDirectory()
    const cacheData: CachedData = {
      data,
      lastUpdated: Date.now(),
      season
    }
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cacheData, null, 2))
  } catch (error) {
    console.error('Error writing bye week cache:', error)
  }
}

// Check if cache is still valid
function isCacheValid(cachedData: CachedData): boolean {
  const now = Date.now()
  return (now - cachedData.lastUpdated) < CACHE_DURATION
}

// Fetch fresh bye week data from Sleeper API
async function fetchFreshByeWeekData(season: string): Promise<ByeWeekData> {
  try {
    // Fetch schedule data from Sleeper API
    const response = await fetch(`https://api.sleeper.app/v1/nfl/state`)
    if (!response.ok) {
      throw new Error(`Failed to fetch NFL state: ${response.status}`)
    }
    
    const nflState = await response.json()
    const currentSeason = nflState.league_season || season
    
    // Fetch schedule for the season
    const scheduleResponse = await fetch(`https://api.sleeper.app/v1/nfl/schedule/${currentSeason}`)
    if (!scheduleResponse.ok) {
      throw new Error(`Failed to fetch schedule: ${scheduleResponse.status}`)
    }
    
    const schedule = await scheduleResponse.json()
    
    // Extract bye weeks from schedule
    const byeWeeks: ByeWeekData = {}
    const teams = new Set<string>()
    
    // Get all teams from schedule
    Object.values(schedule).forEach((week: any) => {
      if (week && typeof week === 'object') {
        Object.values(week).forEach((game: any) => {
          if (game && typeof game === 'object' && game.away && game.home) {
            teams.add(game.away)
            teams.add(game.home)
          }
        })
      }
    })
    
    // For each team, find their bye week by checking which week they don't have a game
    const teamList = Array.from(teams)
    teamList.forEach(team => {
      let byeWeek = 0
      for (let week = 1; week <= 18; week++) {
        const weekKey = week.toString()
        if (schedule[weekKey]) {
          const hasGame = Object.values(schedule[weekKey]).some((game: any) => 
            game && typeof game === 'object' && 
            (game.away === team || game.home === team)
          )
          if (!hasGame) {
            byeWeek = week
            break
          }
        }
      }
      byeWeeks[team] = byeWeek
    })
    
    return byeWeeks
  } catch (error) {
    console.error('Error fetching bye week data:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const season = searchParams.get('season') || new Date().getFullYear().toString()
    
    // Try to read from cache first
    const cachedData = readCachedData()
    
    if (cachedData && isCacheValid(cachedData) && cachedData.season === season) {
      return NextResponse.json({
        data: cachedData.data,
        cached: true,
        lastUpdated: new Date(cachedData.lastUpdated).toLocaleString(),
        season: cachedData.season
      })
    }
    
    // Cache expired or doesn't exist, fetch fresh data
    const freshData = await fetchFreshByeWeekData(season)
    
    // Update cache
    writeCachedData(freshData, season)
    
    return NextResponse.json({
      data: freshData,
      cached: false,
      lastUpdated: new Date().toLocaleString(),
      season: season
    })
    
  } catch (error) {
    console.error('Error in bye weeks API:', error)
    
    // Try to return expired cache as fallback
    const cachedData = readCachedData()
    if (cachedData) {
      return NextResponse.json({
        data: cachedData.data,
        cached: true,
        lastUpdated: new Date(cachedData.lastUpdated).toLocaleString(),
        season: cachedData.season,
        warning: 'Using expired cache due to fetch error'
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch bye week data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { forceRefresh, season } = body
    
    if (forceRefresh) {
      console.log('Force refreshing bye week cache')
      const freshData = await fetchFreshByeWeekData(season || new Date().getFullYear().toString())
      writeCachedData(freshData, season || new Date().getFullYear().toString())
      
      return NextResponse.json({
        message: 'Cache refreshed successfully',
        data: freshData,
        lastUpdated: new Date().toLocaleString()
      })
    }
    
    return NextResponse.json({ message: 'No action taken' })
  } catch (error) {
    console.error('Error in bye weeks POST:', error)
    return NextResponse.json(
      { error: 'Failed to refresh cache' },
      { status: 500 }
    )
  }
}
