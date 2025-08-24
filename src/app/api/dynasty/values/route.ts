import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const asOf = req.nextUrl.searchParams.get("date");
    const where = asOf ? { asOfDate: new Date(asOf) } : {};
    
    const rows = await prisma.valueDaily.findMany({
      where, 
      include: { player: true },
      orderBy: [{ dynastyValue: "desc" }]
    });
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching dynasty values:", error);
    return NextResponse.json(
      { error: "Failed to fetch dynasty values" },
      { status: 500 }
    );
  }
}
