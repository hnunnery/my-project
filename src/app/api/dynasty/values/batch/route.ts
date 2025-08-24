import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { playerIds }: { playerIds: string[] } = await req.json();
    
    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid player IDs array" },
        { status: 400 }
      );
    }

    // Get the latest dynasty values for the specified players
    const latestDate = await prisma.valueDaily.findFirst({
      orderBy: { asOfDate: "desc" },
      select: { asOfDate: true }
    });

    if (!latestDate) {
      return NextResponse.json(
        { error: "No dynasty values available" },
        { status: 404 }
      );
    }

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
    const valueMap: Record<string, {
      dynastyValue: number | null;
      trend7d: number | null;
      trend30d: number | null;
    }> = {};
    
    values.forEach(v => {
      valueMap[v.playerId] = {
        dynastyValue: v.dynastyValue,
        trend7d: v.trend7d,
        trend30d: v.trend30d
      };
    });

    return NextResponse.json({
      asOfDate: latestDate.asOfDate,
      values: valueMap
    });
  } catch (error) {
    console.error("Error fetching batch dynasty values:", error);
    return NextResponse.json(
      { error: "Failed to fetch dynasty values" },
      { status: 500 }
    );
  }
}
