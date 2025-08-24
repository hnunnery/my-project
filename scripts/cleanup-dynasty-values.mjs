import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDynastyValues() {
  try {
    console.log('Starting cleanup of duplicate dynasty value records...');
    
    // Find all unique dates in the database
    const dates = await prisma.valueDaily.findMany({
      select: { asOfDate: true },
      distinct: ['asOfDate'],
      orderBy: { asOfDate: 'desc' }
    });
    
    console.log(`Found ${dates.length} unique dates:`, dates.map(d => d.asOfDate.toISOString()));
    
    if (dates.length <= 1) {
      console.log('No duplicate dates found. Cleanup not needed.');
      return;
    }
    
    // Keep only the most recent date
    const latestDate = dates[0].asOfDate;
    const datesToDelete = dates.slice(1);
    
    console.log(`Keeping records from: ${latestDate.toISOString()}`);
    console.log(`Deleting records from ${datesToDelete.length} older dates...`);
    
    // Delete all records except the latest
    const deleteResult = await prisma.valueDaily.deleteMany({
      where: {
        asOfDate: { not: latestDate }
      }
    });
    
    console.log(`Successfully deleted ${deleteResult.count} old records`);
    console.log(`Cleanup completed. Database now contains only latest dynasty values.`);
    
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDynastyValues();
