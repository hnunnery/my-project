import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type TradeBody = { 
  sideA: string[]; 
  sideB: string[]; 
  date?: string 
};

export async function POST(req: NextRequest) {
  try {
    const { sideA, sideB, date }: TradeBody = await req.json();
    const asOfDate = date ? new Date(date) : undefined;

    const ids = [...new Set([...sideA, ...sideB])];
    const latestDate = asOfDate ?? (await prisma.valueDaily.findFirst({
      orderBy: { asOfDate: "desc" }, 
      select: { asOfDate: true }
    }))?.asOfDate;

    if (!latestDate) {
      return NextResponse.json(
        { error: "No dynasty values available" },
        { status: 404 }
      );
    }

    const values = await prisma.valueDaily.findMany({
      where: { asOfDate: latestDate, playerId: { in: ids } },
      select: { playerId: true, dynastyValue: true }
    });

    const map = new Map(values.map(v => [v.playerId, v.dynastyValue ?? 0]));
    const sum = (arr: string[]) => arr.reduce((a: number, id: string) => a + (map.get(id) ?? 0), 0);

    const a = sum(sideA);
    const b = sum(sideB);
    const total = a + b || 1;
    const fairnessA = Math.round((a / total) * 100);
    const fairnessB = 100 - fairnessA;

    return NextResponse.json({ 
      asOfDate: latestDate, 
      sideA: a, 
      sideB: b, 
      fairness: { A: fairnessA, B: fairnessB } 
    });
  } catch (error) {
    console.error("Error analyzing trade:", error);
    return NextResponse.json(
      { error: "Failed to analyze trade" },
      { status: 500 }
    );
  }
}
