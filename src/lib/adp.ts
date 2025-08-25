export interface ADPRow {
  player_id: string;
  position: string;
  adp: number;
}

interface FFCPlayer {
  name: string;
  position: string;
  adp: number;
}

const FFC_ADP_URL = "https://fantasyfootballcalculator.com/api/v1/adp/dynasty?teams=12";
const PLAYER_IDS_URL = "https://raw.githubusercontent.com/dynastyprocess/data/master/files/db_playerids.csv";

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function fetchADP(): Promise<ADPRow[]> {
  const [ffcRes, idsRes] = await Promise.all([
    fetch(FFC_ADP_URL),
    fetch(PLAYER_IDS_URL)
  ]);

  if (!ffcRes.ok) {
    throw new Error(`Failed to fetch FFC ADP: ${ffcRes.status}`);
  }
  if (!idsRes.ok) {
    throw new Error(`Failed to fetch player IDs: ${idsRes.status}`);
  }

  const ffcJson = await ffcRes.json();
  const ffcPlayers: FFCPlayer[] = ffcJson.players ?? [];
  const idCsv = await idsRes.text();

  const lines = idCsv.trim().split("\n");
  const headers = lines[0].split(",");
  const nameIdx = headers.indexOf("name");
  const sleeperIdx = headers.indexOf("sleeper_id");

  const nameToSleeper = new Map<string, string>();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const name = cols[nameIdx];
    const sleeperId = cols[sleeperIdx];
    if (name && sleeperId) {
      nameToSleeper.set(normalizeName(name), sleeperId);
    }
  }

  const adpRows: ADPRow[] = [];
  for (const p of ffcPlayers) {
    const sleeperId = nameToSleeper.get(normalizeName(p.name));
    if (!sleeperId) continue;
    if (typeof p.adp !== "number" || !Number.isFinite(p.adp)) continue;
    adpRows.push({ player_id: sleeperId, position: p.position, adp: p.adp });
  }

  return adpRows.sort((a, b) => a.adp - b.adp);
}
