import { PrismaClient } from "@prisma/client";
import { ageMultiplier } from "../src/lib/dynasty/ageCurves.js";
import { composite } from "../src/lib/dynasty/formula.js";

const prisma = new PrismaClient();

async function debugDynastyValues() {
  console.log("🔍 Debugging Dynasty Value Generation...\n");

  try {
    // Get all players with their data
    const players = await prisma.player.findMany({ 
      select: { id: true, name: true, pos: true, ageYears: true }
    });

    console.log(`📊 Total players in database: ${players.length}`);

    // Get ADP data to understand market values
    const adpData = await prisma.snapshot.findMany({
      where: { 
        source: "sleeper_adp",
        asOfDate: new Date('2025-01-01')
      },
      select: { playerId: true, rawValue: true }
    });

    console.log(`📈 ADP records found: ${adpData.length}`);

    // Create a map of ADP values
    const adpMap = new Map(adpData.map(r => [r.playerId, r.rawValue]));

    // Test the calculation for a few players
    let validCount = 0;
    let invalidCount = 0;
    let errorCount = 0;

    console.log("\n🧮 Testing Dynasty Value Calculation...\n");

    for (const player of players.slice(0, 20)) { // Test first 20 players
      try {
        const adp = adpMap.get(player.id);
        
        if (!adp) {
          console.log(`❌ ${player.name} (${player.pos}): No ADP data`);
          invalidCount++;
          continue;
        }

        // Calculate market value (ADP-based)
        const marketValue = Math.max(0, 100 - ((adp - 1) / (100 - 1)) * 100);
        
        // Projection score (same as market for now)
        const projectionScore = marketValue;
        
        // Age multiplier
        const ageMult = ageMultiplier(player.pos, player.ageYears);
        const ageScore = Math.min(100, Math.max(0, projectionScore * ageMult));
        
        // Risk score
        const riskScore = 95;
        
        // Final dynasty value
        const dynastyValue = composite({ marketValue, projectionScore, ageScore, riskScore });

        console.log(`✅ ${player.name} (${player.pos}, Age: ${player.ageYears || 'N/A'}):`);
        console.log(`   ADP: ${adp} → Market: ${marketValue.toFixed(2)}`);
        console.log(`   Age Mult: ${ageMult.toFixed(3)} → Age Score: ${ageScore.toFixed(2)}`);
        console.log(`   Dynasty Value: ${dynastyValue.toFixed(2)}`);
        console.log(`   Risk Score: ${riskScore}`);
        console.log("");

        validCount++;
      } catch (error) {
        console.log(`💥 ${player.name} (${player.pos}): Error - ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Valid calculations: ${validCount}`);
    console.log(`❌ Invalid (no ADP): ${invalidCount}`);
    console.log(`💥 Errors: ${errorCount}`);

    // Check for specific issues
    console.log(`\n🔍 Checking for specific issues...`);
    
    // Check players with null age
    const nullAgePlayers = players.filter(p => p.ageYears === null);
    console.log(`Players with null age: ${nullAgePlayers.length}`);
    
    // Check players with extreme ages
    const extremeAgePlayers = players.filter(p => p.ageYears && (p.ageYears < 18 || p.ageYears > 50));
    console.log(`Players with extreme ages (<18 or >50): ${extremeAgePlayers.length}`);
    
    // Check for invalid positions
    const invalidPosPlayers = players.filter(p => !['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].includes(p.pos));
    console.log(`Players with invalid positions: ${invalidPosPlayers.length}`);

  } catch (error) {
    console.error("❌ Debug script failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDynastyValues();
