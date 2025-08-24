import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getDynastyValues(playerIds: string[]) {
  if (playerIds.length === 0) return new Map();
  
  try {
    // Get the latest dynasty values for the specified players
    const latestDate = await prisma.valueDaily.findFirst({
      orderBy: { asOfDate: "desc" },
      select: { asOfDate: true }
    });

    if (!latestDate) return new Map();

    const values = await prisma.valueDaily.findMany({
      where: { 
        asOfDate: latestDate.asOfDate, 
        playerId: { in: playerIds } 
      },
      select: { 
        playerId: true, 
        dynastyValue: true,
        trend7d: true,
        trend30d: true
      }
    });

    // Create a map for easy lookup
    const valueMap = new Map();
    values.forEach(v => {
      valueMap.set(v.playerId, {
        dynastyValue: v.dynastyValue,
        trend7d: v.trend7d,
        trend30d: v.trend30d
      });
    });

    return valueMap;
  } catch (error) {
    console.error("Error fetching dynasty values:", error);
    return new Map();
  }
}

export function formatDynastyValue(value: number | null): string {
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(1);
}

export function getTrendIndicator(trend: number | null): string {
  if (trend === null || trend === undefined) return '';
  if (trend > 0) return '↗️';
  if (trend < 0) return '↘️';
  return '→';
}
