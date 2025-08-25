import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugDynastySimple() {
  console.log("🔍 Simple Dynasty Value Debug...\n");

  try {
    // Check total players
    const totalPlayers = await prisma.player.count();
    console.log(`📊 Total players in database: ${totalPlayers}`);

    // Check players with ADP data
    const adpPlayers = await prisma.snapshot.count({
      where: { 
        source: "sleeper_adp",
        asOfDate: new Date('2025-01-01')
      }
    });
    console.log(`📈 Players with ADP data: ${adpPlayers}`);

    // Check players with dynasty values
    const dynastyPlayers = await prisma.valueDaily.count({
      where: { 
        asOfDate: new Date('2025-01-01'),
        dynastyValue: { not: null }
      }
    });
    console.log(`🏆 Players with dynasty values: ${dynastyPlayers}`);

    // Check players without dynasty values
    const noDynastyPlayers = await prisma.valueDaily.count({
      where: { 
        asOfDate: new Date('2025-01-01'),
        dynastyValue: null
      }
    });
    console.log(`❌ Players without dynasty values: ${noDynastyPlayers}`);

    // Check for specific issues in the data
    console.log(`\n🔍 Investigating specific issues...`);

    // Check players with null ages
    const nullAgeCount = await prisma.player.count({
      where: { ageYears: null }
    });
    console.log(`Players with null age: ${nullAgeCount}`);

    // Check players with extreme ages
    const extremeAgeCount = await prisma.player.count({
      where: {
        ageYears: {
          not: null,
          lt: 18
        }
      }
    });
    console.log(`Players with age < 18: ${extremeAgeCount}`);

    // Check for invalid positions
    const invalidPosCount = await prisma.player.count({
      where: {
        pos: {
          notIn: ['QB', 'RB', 'WR', 'TE', 'K', 'DEF']
        }
      }
    });
    console.log(`Players with invalid positions: ${invalidPosCount}`);

    // Sample some players that failed
    console.log(`\n📋 Sample of players without dynasty values:`);
    const failedPlayers = await prisma.valueDaily.findMany({
      where: { 
        asOfDate: new Date('2025-01-01'),
        dynastyValue: null
      },
      include: {
        player: {
          select: { name: true, pos: true, ageYears: true }
        }
      },
      take: 10
    });

    for (const record of failedPlayers) {
      console.log(`❌ ${record.player.name} (${record.player.pos}, Age: ${record.player.ageYears || 'N/A'})`);
      console.log(`   Market: ${record.marketValue}, Age: ${record.ageScore}`);
    }

    // Sample some players that succeeded
    console.log(`\n📋 Sample of players with dynasty values:`);
    const successPlayers = await prisma.valueDaily.findMany({
      where: { 
        asOfDate: new Date('2025-01-01'),
        dynastyValue: { not: null }
      },
      include: {
        player: {
          select: { name: true, pos: true, ageYears: true }
        }
      },
      take: 10
    });

    for (const record of successPlayers) {
      console.log(`✅ ${record.player.name} (${record.player.pos}, Age: ${record.player.ageYears || 'N/A'})`);
      console.log(`   Market: ${record.marketValue}, Age: ${record.ageScore}`);
      console.log(`   Dynasty Value: ${record.dynastyValue}`);
    }

  } catch (error) {
    console.error("❌ Debug script failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDynastySimple();
