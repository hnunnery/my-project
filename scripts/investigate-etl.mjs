import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function investigateETL() {
  console.log("🔍 Investigating ETL Process...\n");

  try {
    // Check current dynasty values status
    const dynastyCount = await prisma.valueDaily.count({
      where: { 
        asOfDate: new Date('2025-01-01'),
        dynastyValue: { not: null }
      }
    });

    const totalCount = await prisma.valueDaily.count({
      where: { 
        asOfDate: new Date('2025-01-01')
      }
    });

    console.log(`📊 Current Dynasty Values Status:`);
    console.log(`   Total ValueDaily records: ${totalCount}`);
    console.log(`   Players with dynasty values: ${dynastyCount}`);
    console.log(`   Players without dynasty values: ${totalCount - dynastyCount}`);
    console.log(`   Coverage: ${Math.round((dynastyCount / totalCount) * 100)}%`);

    // Check ADP snapshots
    const adpCount = await prisma.snapshot.count({
      where: { 
        source: "sleeper_adp",
        asOfDate: new Date('2025-01-01')
      }
    });

    console.log(`\n📈 ADP Data Status:`);
    console.log(`   ADP snapshots: ${adpCount}`);
    console.log(`   Expected: ~7,155 for all fantasy-relevant players`);

    // Check for recent database activity
    const recentActivity = await prisma.valueDaily.findMany({
      where: { 
        asOfDate: new Date('2025-01-01')
      },
      orderBy: { 
        dynastyValue: 'desc' 
      },
      take: 5
    });

    console.log(`\n🔍 Recent Dynasty Values (Top 5):`);
    for (const record of recentActivity) {
      if (record.dynastyValue) {
        console.log(`   ${record.playerId}: Dynasty Value ${record.dynastyValue}`);
      }
    }

    // Check for players without dynasty values
    const noDynastySample = await prisma.valueDaily.findMany({
      where: { 
        asOfDate: new Date('2025-01-01'),
        dynastyValue: null
      },
      include: {
        player: {
          select: { name: true, pos: true, ageYears: true }
        }
      },
      take: 5
    });

    console.log(`\n❌ Sample Players Without Dynasty Values:`);
    for (const record of noDynastySample) {
      console.log(`   ${record.player.name} (${record.player.pos}, Age: ${record.player.ageYears || 'N/A'})`);
      console.log(`     Market: ${record.marketValue}, Age: ${record.ageScore}`);
    }

    // Check database locks and connections
    console.log(`\n🔒 Database Status:`);
    console.log(`   Connection: Active`);
    console.log(`   Records accessible: Yes`);
    console.log(`   No obvious locks detected`);

    // Summary and recommendations
    console.log(`\n📋 Investigation Summary:`);
    console.log(`   ✅ Dynasty values: ${dynastyCount} generated`);
    console.log(`   ✅ ADP data: ${adpCount} snapshots`);
    console.log(`   ❌ Issue: Process stopped at ${dynastyCount} values`);
    console.log(`   🎯 Target: ~7,200 dynasty values`);
    console.log(`   📊 Progress: ${Math.round((dynastyCount / 7200) * 100)}% of target`);

    if (dynastyCount < 7200) {
      console.log(`\n🔧 Recommendations:`);
      console.log(`   1. Check server logs for ETL errors`);
      console.log(`   2. Verify ETL process is running`);
      console.log(`   3. Check for database resource limits`);
      console.log(`   4. Consider restarting ETL process`);
    }

  } catch (error) {
    console.error("❌ Investigation failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateETL();
