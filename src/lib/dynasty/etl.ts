import { PrismaClient } from "@prisma/client";
import { fetchSleeperPlayers, fetchSleeperADP, SleeperPlayer } from "../sleeper";
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

export async function runDynastyETL(asOf = new Date('2025-01-01')) {
  console.log('Starting Dynasty ETL pipeline for latest values (using fixed date)...');
  
  // Add timeout to prevent hanging
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('ETL timeout after 25 minutes')), 25 * 60 * 1000);
  });
  
  try {
    const [playersJson, adpRows] = await Promise.all([
      fetchSleeperPlayers(),
      fetchSleeperADP(),
    ]);
    
    console.log(`Fetched ${Object.keys(playersJson).length} total players and ${adpRows.length} ADP entries`);
    
    // Count filtered players
    const totalPlayers = Object.keys(playersJson).length;
    const activePlayers = Object.values(playersJson).filter((p: SleeperPlayer) => p?.active === true).length;
    const filteredPlayers = Object.values(playersJson).filter((p: SleeperPlayer) => 
      p?.active === true && 
      p?.position && 
      !['OL', 'G', 'OT', 'C', 'OG', 'P', 'LS'].includes(p.position) &&
      typeof p.age === "number" && 
      p.age >= 18 && p.age <= 50
    ).length;
    
    console.log(`Player filtering: ${totalPlayers} total → ${activePlayers} active → ${filteredPlayers} fantasy-relevant with valid age (excluded OL/P, no age, extreme ages)`);

  const playerMap: PlayerRow[] = Object.entries(playersJson)
    .filter(([, p]: [string, SleeperPlayer]) => 
      p?.position && 
      p?.active === true && // Only active players
      !['OL', 'G', 'OT', 'C', 'OG', 'P', 'LS'].includes(p.position) && // Exclude offensive linemen and punters
      typeof p.age === "number" && // Must have valid age data
      p.age >= 18 && p.age <= 50 // Reasonable age range for fantasy football
    )
    .map(([id, p]: [string, SleeperPlayer]) => ({
      player_id: id, // Use the object key as the player ID
      full_name: p.full_name ?? `${p.first_name || ""} ${p.last_name || ""}`.trim(),
      position: p.position!,
      team: p.team || "",
      age: p.age, // Age is guaranteed to be a number at this point
    }));

  console.log(`Upserting ${playerMap.length} filtered players in batches...`);
  
  const batchSize = 50; // Reduced batch size to prevent timeouts
  const totalBatches = Math.ceil(playerMap.length/batchSize);
  console.log(`Batch processing: ${totalBatches} batches of ${batchSize} players each`);
  
  for (let i = 0; i < playerMap.length; i += batchSize) {
    const batch = playerMap.slice(i, i + batchSize);
    const batchNum = Math.floor(i/batchSize) + 1;
    console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} players) - ${Math.round((i/playerMap.length)*100)}% complete`);
    
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

  // Use ADP directly without position-based normalization
  const marketById = new Map<string, number>();
  
  console.log(`Processing ${withPos.length} players with ADP data`);

  // Find global ADP range across all positions
  const allADPs = withPos.map(a => a.adp);
  const globalMin = Math.min(...allADPs);
  const globalMax = Math.max(...allADPs);
  console.log(`Global ADP range: ${globalMin}-${globalMax} across all positions`);

  for (const a of withPos) {
    // Use ADP directly - lower numbers are more valuable (1st pick = best)
    // Convert to 0-100 scale where 1 = 100, max = 0
    const marketValue = Math.max(0, 100 - ((a.adp - globalMin) / (globalMax - globalMin)) * 100);
    marketById.set(a.playerId, marketValue);
  }
  
  console.log(`Generated ${marketById.size} market values`);

  const projectionById = new Map<string, number>();
  for (const r of withPos) {
    // Projection score based on market value (ADP)
    // Higher market value (lower ADP) = higher projection
    const marketValue = marketById.get(r.playerId) ?? 0;
    projectionById.set(r.playerId, marketValue);
  }

  // Only process players that have ADP data (fantasy-relevant players)
  const playersWithADP = await prisma.player.findMany({ 
    where: {
      id: { in: Array.from(marketById.keys()) } // Only players with market values
    },
    select: { id: true, pos: true, ageYears: true }
  });
  
  console.log(`Processing ${playersWithADP.length} players with ADP data out of ${marketById.size} total ADP entries`);
  
  const now = asOf;
  const rows = playersWithADP.map((p: { id: string; pos: string; ageYears: number | null }) => {
    const marketValue = marketById.get(p.id) ?? null;
    const projectionScore = projectionById.get(p.id) ?? null;
    
    // Enhanced age score calculation with better edge case handling
    let ageScore: number | null = null;
    if (projectionScore !== null && p.ageYears !== null) {
      const ageMult = ageMultiplier(p.pos, p.ageYears);
      // Handle edge case where projectionScore is 0 (low ADP players)
      if (projectionScore === 0) {
        // For very low ADP players, give them a minimal but valid age score
        ageScore = Math.max(1, Math.min(100, ageMult * 10)); // Scale up age multiplier for low ADP
      } else {
        ageScore = Math.min(100, Math.max(1, projectionScore * ageMult));
      }
    }
    
    // Enhanced dynasty value calculation with better validation
    let dynastyValue: number | null = null;
    if (marketValue !== null && projectionScore !== null && ageScore !== null) {
      // Additional validation to ensure all scores are reasonable
      if (marketValue >= 0 && projectionScore >= 0 && ageScore >= 1) {
        dynastyValue = composite({ marketValue, projectionScore, ageScore });
      }
    }

    return { 
      playerId: p.id, 
      marketValue, 
      projectionScore, 
      ageScore, 
      dynastyValue 
    };
  });
  
  const validRows = rows.filter((r: { dynastyValue: number | null }) => r.dynastyValue !== null);
  console.log(`Generated ${validRows.length} valid dynasty values out of ${rows.length} total players`);
  console.log(`Sample dynasty values:`, validRows.slice(0, 5).map(r => ({ playerId: r.playerId, dynastyValue: r.dynastyValue })));

  console.log(`Upserting ${rows.length} dynasty value records in batches...`);
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const batchNum = Math.floor(i/batchSize) + 1;
    const totalBatches = Math.ceil(rows.length/batchSize);
    console.log(`Processing dynasty values batch ${batchNum}/${totalBatches} (${batch.length} records) - ${Math.round((i/rows.length)*100)}% complete`);
    
    try {
      await prisma.$transaction(
      batch.map((r: { playerId: string; marketValue: number | null; projectionScore: number | null; ageScore: number | null; dynastyValue: number | null }) => prisma.valueDaily.upsert({
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
      console.log(`Completed batch ${batchNum}/${totalBatches} successfully`);
    } catch (batchError) {
      console.error(`Error in batch ${batchNum}/${totalBatches}:`, batchError);
      const errorMessage = batchError instanceof Error ? batchError.message : String(batchError);
      throw new Error(`Failed at batch ${batchNum}/${totalBatches}: ${errorMessage}`);
    }
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
    
    await Promise.all(playersWithADP.map(async (p: { id: string; pos: string; ageYears: number | null }) => {
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
  
  // Clean up old duplicate records to keep only the latest values
  console.log('Cleaning up old duplicate records...');
  const oldRecords = await prisma.valueDaily.findMany({
    where: { asOfDate: { not: now } },
    select: { asOfDate: true, playerId: true }
  });
  
  if (oldRecords.length > 0) {
    console.log(`Found ${oldRecords.length} old records to clean up`);
    await prisma.valueDaily.deleteMany({
      where: { asOfDate: { not: now } }
    });
    console.log('Old records cleaned up successfully');
  }

  // Clean up failed dynasty value records from irrelevant players (those without ADP data)
  console.log('Cleaning up failed dynasty value records from irrelevant players...');
  const failedRecords = await prisma.valueDaily.findMany({
    where: { 
      asOfDate: now,
      dynastyValue: null
    },
    select: { playerId: true }
  });
  
  if (failedRecords.length > 0) {
    console.log(`Found ${failedRecords.length} failed dynasty value records to clean up`);
    await prisma.valueDaily.deleteMany({
      where: { 
        asOfDate: now,
        dynastyValue: null
      }
    });
    console.log('Failed records cleaned up successfully');
  }
  
  // Summary of efficiency improvements
  const efficiencyGain = Math.round(((totalPlayers - playerMap.length) / totalPlayers) * 100);
  const dynastyEfficiency = Math.round(((rows.length - validRows.length) / rows.length) * 100);
  console.log(`✅ Dynasty ETL pipeline completed successfully!`);
  console.log(`📊 Player Filtering: Processed ${playerMap.length} players instead of ${totalPlayers} (${efficiencyGain}% reduction)`);
  console.log(`🎯 Dynasty Processing: Generated ${validRows.length} dynasty values from ${rows.length} ADP-relevant players with valid age data (${dynastyEfficiency}% success rate)`);
  console.log(`⚡ Performance: ${totalBatches} batches instead of ${Math.ceil(totalPlayers/batchSize)} (${Math.round(((Math.ceil(totalPlayers/batchSize) - totalBatches) / Math.ceil(totalPlayers/batchSize)) * 100)}% fewer batches)`);
  console.log(`🔒 Data Quality: Excluded players without age data, extreme ages, and non-fantasy positions`);
  
  } catch (error) {
    console.error('Dynasty ETL pipeline failed with error:', error);
    throw error;
  }
  
  // Race against timeout
  return Promise.race([
    Promise.resolve('ETL completed successfully'),
    timeoutPromise
  ]);
}
