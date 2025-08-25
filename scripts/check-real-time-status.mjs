import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkRealTimeStatus() {
  console.log("🔍 Checking Real-Time Dynasty Value Status...\n");
  
  try {
    // Get actual counts from the database
    const totalPlayers = await prisma.player.count();
    const adpCount = await prisma.snapshot.count({
      where: { 
        source: 'sleeper_adp',
        asOfDate: new Date('2025-01-01')
      }
    });
    const dynastyCount = await prisma.valueDaily.count({
      where: { 
        asOfDate: new Date('2025-01-01'),
        dynastyValue: { not: null }
      }
    });
    const failedCount = await prisma.valueDaily.count({
      where: { 
        asOfDate: new Date('2025-01-01'),
        dynastyValue: null
      }
    });
    
    console.log(`📊 Database Status:`);
    console.log(`   Total players in database: ${totalPlayers}`);
    console.log(`   Players with ADP data: ${adpCount}`);
    console.log(`   Players with dynasty values: ${dynastyCount}`);
    console.log(`   Players without dynasty values: ${failedCount}`);
    
    if (adpCount > 0) {
      const coverage = Math.round((dynastyCount / adpCount) * 100);
      console.log(`   Coverage: ${dynastyCount}/${adpCount} (${coverage}%)`);
    }
    
    // Check if there are any actual failed players (players that exist but failed)
    if (failedCount > 0) {
      console.log(`\n🔍 Investigating Failed Players...`);
      
      const failedPlayers = await prisma.valueDaily.findMany({
        where: { 
          asOfDate: new Date('2025-01-01'),
          dynastyValue: null
        },
        include: {
          player: {
            select: { name: true, pos: true, ageYears: true, team: true }
          }
        },
        take: 5
      });
      
      console.log(`\nSample of failed players (first 5):`);
      for (const record of failedPlayers) {
        console.log(`   ${record.player.name} (${record.player.pos}, Age: ${record.player.ageYears || 'N/A'}, Team: ${record.player.team || 'N/A'})`);
        console.log(`     Market: ${record.marketValue}, Age: ${record.ageScore}`);
      }
      
      // Check if these failed players actually have ADP data
      const failedPlayerIds = failedPlayers.map(f => f.playerId);
      const adpForFailed = await prisma.snapshot.findMany({
        where: { 
          playerId: { in: failedPlayerIds },
          source: 'sleeper_adp',
          asOfDate: new Date('2025-01-01')
        },
        select: { playerId: true, rawValue: true }
      });
      
      console.log(`\nADP data for failed players: ${adpForFailed.length}/${failedPlayerIds.length} have ADP`);
      
      if (adpForFailed.length > 0) {
        console.log(`\nSample ADP data for failed players:`);
        for (const adp of adpForFailed.slice(0, 3)) {
          console.log(`   ${adp.playerId}: ${adp.rawValue}`);
        }
      }
    }
    
    // Check recent activity
    const recentValues = await prisma.valueDaily.findMany({
      where: { 
        asOfDate: new Date('2025-01-01'),
        dynastyValue: { not: null }
      },
      orderBy: { dynastyValue: 'desc' },
      take: 3,
      include: {
        player: { select: { name: true, pos: true } }
      }
    });
    
    console.log(`\n🏆 Top 3 Dynasty Values:`);
    for (const record of recentValues) {
      console.log(`   ${record.player.name} (${record.player.pos}): ${record.dynastyValue?.toFixed(2)}`);
    }
    
  } catch (error) {
    console.error("❌ Status check failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRealTimeStatus();
