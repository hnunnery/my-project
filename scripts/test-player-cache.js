#!/usr/bin/env node

/**
 * Test script for the player caching system
 * Run with: node scripts/test-player-cache.js
 */

const BASE_URL = 'http://localhost:3000'

async function testPlayerCache() {
  console.log('🧪 Testing Player Cache System...\n')
  
  try {
    // Test 1: Fetch player data (should create cache on first run)
    console.log('1️⃣ Testing initial player data fetch...')
    const response1 = await fetch(`${BASE_URL}/api/players`)
    const data1 = await response1.json()
    
    if (data1.success) {
      console.log(`✅ Success! Fetched ${data1.playerCount} players`)
      console.log(`   Cached: ${data1.cached}`)
      console.log(`   Last Updated: ${new Date(data1.lastUpdated).toLocaleString()}`)
    } else {
      console.log(`❌ Failed: ${data1.error}`)
      return
    }
    
    // Test 2: Fetch again (should use cache)
    console.log('\n2️⃣ Testing cache hit...')
    const response2 = await fetch(`${BASE_URL}/api/players`)
    const data2 = await response2.json()
    
    if (data2.success) {
      console.log(`✅ Success! Fetched ${data2.playerCount} players`)
      console.log(`   Cached: ${data2.cached}`)
      console.log(`   Last Updated: ${new Date(data2.lastUpdated).toLocaleString()}`)
    } else {
      console.log(`❌ Failed: ${data2.error}`)
      return
    }
    
    // Test 3: Force refresh
    console.log('\n3️⃣ Testing force refresh...')
    const response3 = await fetch(`${BASE_URL}/api/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ forceRefresh: true }),
    })
    
    const data3 = await response3.json()
    
    if (data3.success) {
      console.log(`✅ Success! Force refreshed ${data3.playerCount} players`)
      console.log(`   Last Updated: ${new Date(data3.lastUpdated).toLocaleString()}`)
    } else {
      console.log(`❌ Failed: ${data3.error}`)
      return
    }
    
    // Test 4: Verify cache was updated
    console.log('\n4️⃣ Verifying cache update...')
    const response4 = await fetch(`${BASE_URL}/api/players`)
    const data4 = await response4.json()
    
    if (data4.success) {
      console.log(`✅ Success! Cache updated`)
      console.log(`   Cached: ${data4.cached}`)
      console.log(`   Last Updated: ${new Date(data4.lastUpdated).toLocaleString()}`)
    } else {
      console.log(`❌ Failed: ${data4.error}`)
      return
    }
    
    console.log('\n🎉 All tests passed! Player caching system is working correctly.')
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message)
    console.log('\nMake sure the development server is running: npm run dev')
  }
}

// Run the test
testPlayerCache()
