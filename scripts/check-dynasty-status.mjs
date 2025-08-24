import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDynastyStatus() {
  console.log("🔍 Checking Current Dynasty Value Status...\n");

  try {
    // Check current dynasty values
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

    console.log(`📊 Current Status:`);
    console.log(`   Total ValueDaily records: ${totalCount}`);
    console.log(`   Players with dynasty values: ${dynastyCount}`);
    console.log(`   Players without dynasty values: ${totalCount - dynastyCount}`);
    console.log(`   Coverage: ${Math.round((dynastyCount / totalCount) * 100)}%`);

    if (dynastyCount > 0) {
      console.log(`\n✅ Dynasty values are being generated!`);
      console.log(`   Expected final count: ~7,200 players`);
      console.log(`   Current progress: ${dynastyCount} / ~7,200`);
    } else {
      console.log(`\n❌ No dynasty values found yet`);
    }

  } catch (error) {
    console.error("❌ Check failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDynastyStatus();
