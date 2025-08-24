import { PrismaClient } from "@prisma/client";
import { fetchSleeperPlayers, fetchSleeperADP, SleeperPlayer } from "../sleeper";
import { minMax, positionBuckets } from "./normalize";
import { ageMultiplier } from "./ageCurves";
import { composite } from "./formula";

const prisma = new PrismaClient();

type PlayerRow = {
  player_id: string;
  full_name: string;
  position: string;
  team: string;
  age?: number;
};

export async function runDynastyETL(asOf = new Date()) {
  console.log('Starting Dynasty ETL pipeline...');
  
  try {
    const [playersJson, adpRows] = await Promise.all([
      fetchSleeperPlayers(),
      fetchSleeperADP(),
    ]);
    
    console.log(`Fetched ${Object.keys(playersJson).length} players and ${adpRows.length} ADP entries`);

  const playerMap: PlayerRow[] = Object.values(playersJson)
    .filter((p: SleeperPlayer) => p?.player_id && p?.position)
    .map((p: SleeperPlayer) => ({
      player_id: p.player_id,
      full_name: p.full_name ?? `${p.first_name || ""} ${p.last_name || ""}`.trim(),
      position: p.position!,
      team: p.team || "",
      age: typeof p.age === "number" ? p.age : undefined,
    }));

  console.log(`Upserting ${playerMap.length} players in batches...`);
  
  const batchSize = 100;
  for (let i = 0; i < playerMap.length; i += batchSize) {
    const batch = playerMap.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(playerMap.length/batchSize)} (${batch.length} players)`);
    
    await prisma.$transaction(
      batch.map(p => prisma.player.upsert({
        where: { id: p.player_id },
        update: { 
          name: p.full_name, 
          pos: p.position, 
          team: p.team, 
          ageYears: p.age ?? null 
        },
        create: { 
          id: p.player_id, 
          name: p.full_name, 
          pos: p.position, 
          team: p.team, 
          ageYears: p.age ?? null 
        },
      }))
    );
  }

  console.log(`Upserting ${adpRows.length} ADP snapshots...`);
  await prisma.$transaction(
    adpRows.map((r: { player_id: string; adp: number; position?: string }) => prisma.snapshot.upsert({
      where: { 
        asOfDate_source_playerId: { 
          asOfDate: asOf, 
          source: "sleeper_adp", 
          playerId: r.player_id 
        } 
      },
      update: { rawValue: r.adp, meta: r },
      create: { 
        asOfDate: asOf, 
        source: "sleeper_adp", 
        playerId: r.player_id, 
        rawValue: r.adp, 
        meta: r 
      },
    }))
  );

  const withPos = adpRows
    .map((r: { player_id: string; adp: number; position?: string }) => ({ 
      playerId: r.player_id, 
      pos: r.position ?? playersJson[r.player_id]?.position, 
      adp: r.adp 
    }))
    .filter((r: { playerId: string; pos?: string; adp: number }): r is { playerId: string; pos: string; adp: number } => 
      Boolean(r.pos) && Number.isFinite(r.adp));

  const buckets = positionBuckets(withPos);
  const marketById = new Map<string, number>();
  
  console.log(`Position buckets:`, Object.keys(buckets).map(pos => `${pos}: ${buckets[pos].length}`));

  for (const [pos, arr] of Object.entries(buckets)) {
    const adps = arr.map((a: { playerId: string; pos: string; adp: number }) => a.adp);
    const min = Math.min(...adps);
    const max = Math.max(...adps);
    console.log(`Position ${pos}: ${arr.length} players, ADP range ${min}-${max}`);
    for (const a of arr) {
      marketById.set(a.playerId, minMax(a.adp, min, max, /* invert= */ true));
    }
  }
  
  console.log(`Generated ${marketById.size} market values`);

  const projectionById = new Map<string, number>();
  for (const r of withPos) {
    projectionById.set(r.playerId, 50 + (marketById.get(r.playerId) ?? 0) * 0.4);
  }

  const players = await prisma.player.findMany({ 
    select: { id: true, pos: true, ageYears: true }
  });
  
  const now = asOf;
  const rows = players.map((p: { id: string; pos: string; ageYears: number | null }) => {
    const marketValue = marketById.get(p.id) ?? null;
    const projectionScore = projectionById.get(p.id) ?? null;
    const ageMult = ageMultiplier(p.pos, p.ageYears ?? null);
    const ageScore = projectionScore ? Math.min(100, Math.max(0, projectionScore * ageMult)) : null;
    const riskScore = 95; // TODO: plug injury/contract model; keep near-neutral for now
    const dynastyValue = (marketValue && projectionScore && ageScore)
      ? composite({ marketValue, projectionScore, ageScore, riskScore })
      : null;

    return { 
      playerId: p.id, 
      marketValue, 
      projectionScore, 
      ageScore, 
      riskScore, 
      dynastyValue 
    };
  });
  
  const validRows = rows.filter((r: { dynastyValue: number | null }) => r.dynastyValue !== null);
  console.log(`Generated ${validRows.length} valid dynasty values out of ${rows.length} total players`);
  console.log(`Sample dynasty values:`, validRows.slice(0, 5).map(r => ({ playerId: r.playerId, dynastyValue: r.dynastyValue })));

  console.log(`Upserting ${rows.length} dynasty value records in batches...`);
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    console.log(`Processing dynasty values batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(rows.length/batchSize)} (${batch.length} records)`);
    
    await prisma.$transaction(
      batch.map((r: { playerId: string; marketValue: number | null; projectionScore: number | null; ageScore: number | null; riskScore: number; dynastyValue: number | null }) => prisma.valueDaily.upsert({
        where: { 
          asOfDate_playerId: { 
            asOfDate: now, 
            playerId: r.playerId 
          } 
        },
        update: r,
        create: { 
          asOfDate: now, 
          ...r 
        },
      }))
    );
  }
  console.log(`Successfully upserted dynasty value records`);

  const windowDays = [7, 30];
  for (const w of windowDays) {
    const since = new Date(now);
    since.setDate(since.getDate() - w);
    
    const hist = await prisma.valueDaily.findMany({
      where: { 
        asOfDate: { gte: since, lt: now } 
      },
      select: { playerId: true, dynastyValue: true },
    });
    
    const acc = new Map<string, {sum:number, n:number}>();
    for (const h of hist) {
      if (h.dynastyValue == null) continue;
      const k = h.playerId;
      const v = acc.get(k) ?? { sum: 0, n: 0 };
      v.sum += h.dynastyValue;
      v.n += 1;
      acc.set(k, v);
    }
    
    await Promise.all(players.map(async (p: { id: string; pos: string; ageYears: number | null }) => {
      const latest = await prisma.valueDaily.findUnique({ 
        where: { 
          asOfDate_playerId: { 
            asOfDate: now, 
            playerId: p.id 
          } 
        }
      });
      
      if (!latest?.dynastyValue) return;
      
      const m = acc.get(p.id);
      if (!m || m.n === 0) return;
      
      const avg = m.sum / m.n;
      const delta = latest.dynastyValue - avg;
      
      await prisma.valueDaily.update({
        where: { 
          asOfDate_playerId: { 
            asOfDate: now, 
            playerId: p.id 
          } 
        },
        data: w === 7 ? { trend7d: delta } : { trend30d: delta },
      });
    }));
  }
  
  console.log('Dynasty ETL pipeline completed successfully!');
  } catch (error) {
    console.error('Dynasty ETL pipeline failed with error:', error);
    throw error;
  }
}
