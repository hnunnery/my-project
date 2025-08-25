import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function investigateSpecificPlayers() {
  console.log("🔍 Investigating Specific Failed Players...\n");
  
  try {
    // Check GJ Kinne (QB) - a fantasy-relevant player that's failing
    const gjKinne = await prisma.player.findUnique({
      where: { id: 'GJ Kinne' },
      select: { id: true, name: true, pos: true, ageYears: true, team: true }
    });
    console.log("GJ Kinne Player Record:", gjKinne);
    
    const gjKinneADP = await prisma.snapshot.findFirst({
      where: { 
        playerId: 'GJ Kinne', 
        source: 'sleeper_adp',
        asOfDate: new Date('2025-01-01')
      },
      select: { playerId: true, rawValue: true, asOfDate: true }
    });
    console.log("GJ Kinne ADP:", gjKinneADP);
    
    const gjKinneValue = await prisma.valueDaily.findUnique({
      where: { 
        asOfDate_playerId: {
          asOfDate: new Date('2025-01-01'),
          playerId: 'GJ Kinne'
        }
      },
      select: {
        marketValue: true,
        ageScore: true,
        dynastyValue: true
      }
    });
    console.log("GJ Kinne Dynasty Value:", gjKinneValue);
    
    // Check Ben Tate (RB) - another fantasy-relevant player that's failing
    console.log("\n" + "=".repeat(50) + "\n");
    
    const benTate = await prisma.player.findUnique({
      where: { id: 'Ben Tate' },
      select: { id: true, name: true, pos: true, ageYears: true, team: true }
    });
    console.log("Ben Tate Player Record:", benTate);
    
    const benTateADP = await prisma.snapshot.findFirst({
      where: { 
        playerId: 'Ben Tate', 
        source: 'sleeper_adp',
        asOfDate: new Date('2025-01-01')
      },
      select: { playerId: true, rawValue: true, asOfDate: true }
    });
    console.log("Ben Tate ADP:", benTateADP);
    
    const benTateValue = await prisma.valueDaily.findUnique({
      where: { 
        asOfDate_playerId: {
          asOfDate: new Date('2025-01-01'),
          playerId: 'Ben Tate'
        }
      },
      select: {
        marketValue: true,
        ageScore: true,
        dynastyValue: true
      }
    });
    console.log("Ben Tate Dynasty Value:", benTateValue);
    
    // Check if these players are in the ADP data at all
    console.log("\n" + "=".repeat(50) + "\n");
    console.log("Checking if these players exist in ADP data...");
    
    const allADP = await prisma.snapshot.findMany({
      where: { 
        source: 'sleeper_adp',
        asOfDate: new Date('2025-01-01')
      },
      select: { playerId: true, rawValue: true }
    });
    
    const adpPlayerIds = new Set(allADP.map(a => a.playerId));
    console.log(`Total ADP entries: ${allADP.length}`);
    console.log(`GJ Kinne in ADP: ${adpPlayerIds.has('GJ Kinne')}`);
    console.log(`Ben Tate in ADP: ${adpPlayerIds.has('Ben Tate')}`);
    
    // Check a few more random ADP entries to see the pattern
    console.log("\nSample ADP entries:");
    for (let i = 0; i < Math.min(5, allADP.length); i++) {
      console.log(`  ${allADP[i].playerId}: ${allADP[i].rawValue}`);
    }
    
  } catch (error) {
    console.error("❌ Investigation failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateSpecificPlayers();
