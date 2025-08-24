import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function analyzeRemainingPlayers() {
  console.log("🔍 Analyzing Remaining Players (168 that should have dynasty values)...\n");
  
  try {
    // Get players that have ADP data but no dynasty values
    const adpPlayers = await prisma.snapshot.findMany({
      where: { 
        source: 'sleeper_adp',
        asOfDate: new Date('2025-01-01')
      },
      select: { playerId: true, rawValue: true }
    });
    
    const dynastyPlayers = await prisma.valueDaily.findMany({
      where: { 
        asOfDate: new Date('2025-01-01'),
        dynastyValue: { not: null }
      },
      select: { playerId: true }
    });
    
    const adpPlayerIds = new Set(adpPlayers.map(a => a.playerId));
    const dynastyPlayerIds = new Set(dynastyPlayers.map(d => d.playerId));
    
    // Find players with ADP but no dynasty values
    const remainingPlayerIds = Array.from(adpPlayerIds).filter(id => !dynastyPlayerIds.has(id));
    
    console.log(`📊 Analysis Summary:`);
    console.log(`   Total ADP players: ${adpPlayers.length}`);
    console.log(`   Players with dynasty values: ${dynastyPlayers.length}`);
    console.log(`   Players missing dynasty values: ${remainingPlayerIds.length}`);
    
    if (remainingPlayerIds.length > 0) {
      console.log(`\n🔍 Investigating Remaining Players...`);
      
      // Get detailed info for remaining players
      const remainingPlayers = await prisma.player.findMany({
        where: { id: { in: remainingPlayerIds } },
        select: { id: true, name: true, pos: true, ageYears: true, team: true }
      });
      
      // Get their ValueDaily records to see what's missing
      const remainingValueRecords = await prisma.valueDaily.findMany({
        where: { 
          playerId: { in: remainingPlayerIds },
          asOfDate: new Date('2025-01-01')
        },
        select: { 
          playerId: true, 
          marketValue: true, 
          projectionScore: true, 
          ageScore: true, 
          riskScore: true,
          dynastyValue: true 
        }
      });
      
      console.log(`\n📋 Sample of Remaining Players (first 10):`);
      for (let i = 0; i < Math.min(10, remainingPlayers.length); i++) {
        const player = remainingPlayers[i];
        const valueRecord = remainingValueRecords.find(v => v.playerId === player.id);
        
        console.log(`\n   ${player.name} (${player.pos}, Age: ${player.ageYears || 'N/A'}, Team: ${player.team || 'N/A'})`);
        if (valueRecord) {
          console.log(`     Market: ${valueRecord.marketValue}`);
          console.log(`     Projection: ${valueRecord.projectionScore}`);
          console.log(`     Age Score: ${valueRecord.ageScore}`);
          console.log(`     Risk Score: ${valueRecord.riskScore}`);
          console.log(`     Dynasty Value: ${valueRecord.dynastyValue}`);
        } else {
          console.log(`     ❌ No ValueDaily record found!`);
        }
      }
      
      // Analyze what fields are missing
      console.log(`\n🔍 Field Analysis for Remaining Players:`);
      const fieldAnalysis = {
        noMarketValue: 0,
        noProjectionScore: 0,
        noAgeScore: 0,
        noRiskScore: 0,
        noValueDailyRecord: 0
      };
      
      for (const playerId of remainingPlayerIds) {
        const valueRecord = remainingValueRecords.find(v => v.playerId === playerId);
        
        if (!valueRecord) {
          fieldAnalysis.noValueDailyRecord++;
        } else {
          if (valueRecord.marketValue === null) fieldAnalysis.noMarketValue++;
          if (valueRecord.projectionScore === null) fieldAnalysis.noProjectionScore++;
          if (valueRecord.ageScore === null) fieldAnalysis.noAgeScore++;
          if (valueRecord.riskScore === null) fieldAnalysis.noRiskScore++;
        }
      }
      
      for (const [field, count] of Object.entries(fieldAnalysis)) {
        if (count > 0) {
          console.log(`   ${field}: ${count} players`);
        }
      }
      
      // Check if these players actually have ADP data
      const adpForRemaining = adpPlayers.filter(a => remainingPlayerIds.includes(a.playerId));
      console.log(`\n📈 ADP Data Status:`);
      console.log(`   Remaining players with ADP: ${adpForRemaining.length}/${remainingPlayerIds.length}`);
      
      if (adpForRemaining.length > 0) {
        console.log(`\nSample ADP values for remaining players:`);
        for (let i = 0; i < Math.min(5, adpForRemaining.length); i++) {
          const adp = adpForRemaining[i];
          console.log(`   ${adp.playerId}: ${adp.rawValue}`);
        }
      }
      
      // Check positions of remaining players
      const positionCounts = {};
      for (const player of remainingPlayers) {
        positionCounts[player.pos] = (positionCounts[player.pos] || 0) + 1;
      }
      
      console.log(`\n🏈 Position Distribution of Remaining Players:`);
      for (const [pos, count] of Object.entries(positionCounts)) {
        console.log(`   ${pos}: ${count} players`);
      }
      
    }
    
  } catch (error) {
    console.error("❌ Analysis failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeRemainingPlayers();
