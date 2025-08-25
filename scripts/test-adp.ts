import { fetchADP } from "../src/lib/adp.ts";

async function testADP() {
  console.log("🧪 Testing FFC ADP Fetch...\n");

  try {
    const adpData = await fetchADP();

    console.log(`📊 Total ADP entries fetched: ${adpData.length}`);
    
    // Group by position to see distribution
    const positionCounts: Record<string, number> = {};
    const positionADPRanges: Record<string, { min: number; max: number }> = {};
    
    for (const entry of adpData) {
      const pos = entry.position;
      if (!positionCounts[pos]) {
        positionCounts[pos] = 0;
        positionADPRanges[pos] = { min: Infinity, max: -Infinity };
      }
      
      positionCounts[pos]++;
      positionADPRanges[pos].min = Math.min(positionADPRanges[pos].min, entry.adp);
      positionADPRanges[pos].max = Math.max(positionADPRanges[pos].max, entry.adp);
    }
    
    console.log("\n📈 Position Distribution:");
    for (const [pos, count] of Object.entries(positionCounts)) {
      const range = positionADPRanges[pos];
      console.log(`   ${pos}: ${count} players (ADP range: ${range.min}-${range.max})`);
    }

    // Show sample entries
    console.log("\n📋 Sample ADP Entries:");
    for (let i = 0; i < Math.min(10, adpData.length); i++) {
      const entry = adpData[i];
      console.log(`   ${entry.player_id}: ${entry.position} - ADP ${entry.adp}`);
    }

    // Check for reasonable ADP ranges
    const allADPs = adpData.map(e => e.adp);
    const minADP = Math.min(...allADPs);
    const maxADP = Math.max(...allADPs);

    console.log(`\n🎯 ADP Range: ${minADP} - ${maxADP}`);
    console.log("✅ Fetched ADP data successfully");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testADP();
