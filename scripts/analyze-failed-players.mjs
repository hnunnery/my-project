import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function analyzeFailedPlayers() {
  console.log("🔍 Analyzing Players Without Dynasty Values...\n");

  try {
    // Get players without dynasty values
    const failedPlayers = await prisma.valueDaily.findMany({
      where: { 
        asOfDate: new Date('2025-01-01'),
        dynastyValue: null
      },
      include: {
        player: {
          select: { name: true, pos: true, ageYears: true, team: true }
        }
      }
    });

    console.log(`📊 Total Failed Players: ${failedPlayers.length}\n`);

    // Analyze positions
    const positionCounts = {};
    const positionWithNullData = {};
    
    for (const record of failedPlayers) {
      const pos = record.player.pos;
      if (!positionCounts[pos]) {
        positionCounts[pos] = 0;
        positionWithNullData[pos] = { market: 0, projection: 0, age: 0 };
      }
      
      positionCounts[pos]++;
      
      if (record.marketValue === null) positionWithNullData[pos].market++;
      if (record.projectionScore === null) positionWithNullData[pos].projection++;
      if (record.ageScore === null) positionWithNullData[pos].age++;
    }

    console.log(`📈 Position Distribution of Failed Players:`);
    for (const [pos, count] of Object.entries(positionCounts)) {
      const nullData = positionWithNullData[pos];
      console.log(`   ${pos}: ${count} players`);
      console.log(`     Market null: ${nullData.market}, Projection null: ${nullData.projection}, Age null: ${nullData.age}`);
    }

    // Analyze age patterns
    const ageGroups = {
      'null': 0,
      '0-20': 0,
      '21-25': 0,
      '26-30': 0,
      '31-35': 0,
      '36-40': 0,
      '41+': 0
    };

    for (const record of failedPlayers) {
      const age = record.player.ageYears;
      if (age === null) ageGroups['null']++;
      else if (age <= 20) ageGroups['0-20']++;
      else if (age <= 25) ageGroups['21-25']++;
      else if (age <= 30) ageGroups['26-30']++;
      else if (age <= 35) ageGroups['31-35']++;
      else if (age <= 40) ageGroups['36-40']++;
      else ageGroups['41+']++;
    }

    console.log(`\n👴 Age Distribution of Failed Players:`);
    for (const [group, count] of Object.entries(ageGroups)) {
      if (count > 0) {
        console.log(`   ${group}: ${count} players`);
      }
    }

    // Analyze data completeness patterns
    const dataPatterns = {
      'all_null': 0,
      'market_only': 0,
      'projection_only': 0,
      'age_only': 0,
      'partial_data': 0
    };

    for (const record of failedPlayers) {
      const hasMarket = record.marketValue !== null;
      const hasProjection = record.projectionScore !== null;
      const hasAge = record.ageScore !== null;
      
      if (!hasMarket && !hasProjection && !hasAge) dataPatterns['all_null']++;
      else if (hasMarket && !hasProjection && !hasAge) dataPatterns['market_only']++;
      else if (!hasMarket && hasProjection && !hasAge) dataPatterns['projection_only']++;
      else if (!hasMarket && !hasProjection && hasAge) dataPatterns['age_only']++;
      else dataPatterns['partial_data']++;
    }

    console.log(`\n📋 Data Completeness Patterns:`);
    for (const [pattern, count] of Object.entries(dataPatterns)) {
      if (count > 0) {
        console.log(`   ${pattern}: ${count} players`);
      }
    }

    // Sample specific failed players for detailed analysis
    console.log(`\n🔍 Detailed Sample of Failed Players:`);
    const sampleSize = Math.min(10, failedPlayers.length);
    for (let i = 0; i < sampleSize; i++) {
      const record = failedPlayers[i];
      console.log(`\n   ${record.player.name} (${record.player.pos}, Age: ${record.player.ageYears || 'N/A'}, Team: ${record.player.team || 'N/A'})`);
      console.log(`     Market: ${record.marketValue}`);
      console.log(`     Projection: ${record.projectionScore}`);
      console.log(`     Age Score: ${record.ageScore}`);
      console.log(`     Risk Score: ${record.riskScore}`);
    }

    // Check if there are any patterns in team or specific IDs
    const teamCounts = {};
    for (const record of failedPlayers) {
      const team = record.player.team || 'No Team';
      teamCounts[team] = (teamCounts[team] || 0) + 1;
    }

    console.log(`\n🏈 Team Distribution of Failed Players (Top 10):`);
    const sortedTeams = Object.entries(teamCounts).sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < Math.min(10, sortedTeams.length); i++) {
      const [team, count] = sortedTeams[i];
      console.log(`   ${team}: ${count} players`);
    }

    // Summary and root cause analysis
    console.log(`\n📋 Root Cause Analysis:`);
    console.log(`   Total failed: ${failedPlayers.length}`);
    console.log(`   Most common position: ${Object.entries(positionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}`);
    console.log(`   Most common team: ${sortedTeams[0]?.[0] || 'N/A'}`);
    console.log(`   Age null count: ${ageGroups['null']}`);
    console.log(`   All data null: ${dataPatterns['all_null']}`);

  } catch (error) {
    console.error("❌ Analysis failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeFailedPlayers();
