import { NextResponse } from "next/server";
import { runDynastyETL } from "../../../../lib/dynasty/etl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await runDynastyETL(); // Uses fixed date by default
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("Dynasty ETL failed", e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    await runDynastyETL(); // Uses fixed date by default
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("Dynasty ETL failed", e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
