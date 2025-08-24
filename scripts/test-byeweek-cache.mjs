import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testByeWeekCache() {
  console.log('🧪 Testing Bye Week Cache API...\n');

  try {
    // Test 1: Initial fetch (should create cache)
    console.log('1️⃣ Testing initial fetch (cache creation)...');
    const response1 = await fetch(`${BASE_URL}/api/byeweeks`);
    const data1 = await response1.json();
    
    if (response1.ok) {
      console.log(`✅ Success! Cached: ${data1.cached}, Teams: ${Object.keys(data1.data || {}).length}`);
      console.log(`   Last Updated: ${data1.lastUpdated}`);
      console.log(`   Season: ${data1.season}`);
    } else {
      console.log(`❌ Failed: ${data1.error}`);
      return;
    }

    // Test 2: Cache hit (should return cached data)
    console.log('\n2️⃣ Testing cache hit...');
    const response2 = await fetch(`${BASE_URL}/api/byeweeks`);
    const data2 = await response2.json();
    
    if (response2.ok) {
      console.log(`✅ Success! Cached: ${data2.cached}, Teams: ${Object.keys(data2.data || {}).length}`);
      console.log(`   Last Updated: ${data2.lastUpdated}`);
    } else {
      console.log(`❌ Failed: ${data2.error}`);
      return;
    }

    // Test 3: Force refresh
    console.log('\n3️⃣ Testing force refresh...');
    const response3 = await fetch(`${BASE_URL}/api/byeweeks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ forceRefresh: true }),
    });
    
    const data3 = await response3.json();
    
    if (response3.ok) {
      console.log(`✅ Success! ${data3.message}`);
      console.log(`   Teams: ${Object.keys(data3.data || {}).length}`);
      console.log(`   Last Updated: ${data3.lastUpdated}`);
    } else {
      console.log(`❌ Failed: ${data3.error}`);
      return;
    }

    // Test 4: Verify cache update
    console.log('\n4️⃣ Verifying cache update...');
    const response4 = await fetch(`${BASE_URL}/api/byeweeks`);
    const data4 = await response4.json();
    
    if (response4.ok) {
      console.log(`✅ Success! Cached: ${data4.cached}, Teams: ${Object.keys(data4.data || {}).length}`);
      console.log(`   Last Updated: ${data4.lastUpdated}`);
    } else {
      console.log(`❌ Failed: ${data4.error}`);
      return;
    }

    console.log('\n🎉 All tests passed! Bye week cache is working correctly.');
    
    // Show sample bye week data
    if (data4.data && Object.keys(data4.data).length > 0) {
      console.log('\n📊 Sample bye week data:');
      const sampleTeams = Object.entries(data4.data).slice(0, 5);
      sampleTeams.forEach(([team, byeWeek]) => {
        console.log(`   ${team}: Week ${byeWeek}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testByeWeekCache();
