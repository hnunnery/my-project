import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function analyzePositionDistribution() {
  console.log("🔍 Analyzing Dynasty Value Distribution Across Positions...\n");

  try {
    // Get the latest dynasty values
    const latestDate = await prisma.valueDaily.findFirst({
      orderBy: { asOfDate: "desc" },
      select: { asOfDate: true }
    });

    if (!latestDate) {
      console.log("❌ No dynasty values available");
      return;
    }

    console.log(`📅 Analyzing data as of: ${latestDate.asOfDate.toISOString()}\n`);

    // Get all dynasty values with player positions
    const values = await prisma.valueDaily.findMany({
      where: { 
        asOfDate: latestDate.asOfDate,
        dynastyValue: { not: null }
      },
      include: {
        player: {
          select: { pos: true, name: true }
        }
      }
    });

    console.log(`📊 Total players with dynasty values: ${values.length}\n`);

    // Group by position
    const positionGroups = {};
    for (const value of values) {
      const pos = value.player.pos;
      if (!positionGroups[pos]) {
        positionGroups[pos] = [];
      }
      positionGroups[pos].push({
        name: value.player.name,
        dynastyValue: value.dynastyValue,
        marketValue: value.marketValue,
        ageScore: value.ageScore
      });
    }

    // Analyze each position
    for (const [pos, players] of Object.entries(positionGroups)) {
      const dynastyValues = players.map(p => p.dynastyValue);
      const marketValues = players.map(p => p.marketValue).filter(v => v !== null);
      const ageScores = players.map(p => p.ageScore).filter(v => v !== null);

      console.log(`🏈 ${pos} Position (${players.length} players):`);
      console.log(`   Dynasty Values:`);
      console.log(`     Min: ${Math.min(...dynastyValues).toFixed(2)}`);
      console.log(`     Max: ${Math.max(...dynastyValues).toFixed(2)}`);
      console.log(`     Mean: ${(dynastyValues.reduce((a, b) => a + b, 0) / dynastyValues.length).toFixed(2)}`);
      console.log(`     Median: ${dynastyValues.sort((a, b) => a - b)[Math.floor(dynastyValues.length / 2)].toFixed(2)}`);
      
      if (marketValues.length > 0) {
        console.log(`   Market Values:`);
        console.log(`     Min: ${Math.min(...marketValues).toFixed(2)}`);
        console.log(`     Max: ${Math.max(...marketValues).toFixed(2)}`);
        console.log(`     Mean: ${(marketValues.reduce((a, b) => a + b, 0) / marketValues.length).toFixed(2)}`);
      }

      if (ageScores.length > 0) {
        console.log(`   Age Scores:`);
        console.log(`     Min: ${Math.min(...ageScores).toFixed(2)}`);
        console.log(`     Max: ${Math.max(...ageScores).toFixed(2)}`);
        console.log(`     Mean: ${(ageScores.reduce((a, b) => a + b, 0) / ageScores.length).toFixed(2)}`);
      }

      // Show top 5 players by dynasty value
      const topPlayers = players
        .sort((a, b) => b.dynastyValue - a.dynastyValue)
        .slice(0, 5);
      
      console.log(`   Top 5 Players:`);
      topPlayers.forEach((player, i) => {
        console.log(`     ${i + 1}. ${player.name}: ${player.dynastyValue.toFixed(2)}`);
      });

      console.log("");
    }

    // Cross-position comparison
    console.log("🔄 Cross-Position Analysis:");
    const positionAverages = {};
    for (const [pos, players] of Object.entries(positionGroups)) {
      const avg = players.reduce((sum, p) => sum + p.dynastyValue, 0) / players.length;
      positionAverages[pos] = avg;
    }

    // Sort positions by average dynasty value
    const sortedPositions = Object.entries(positionAverages)
      .sort(([,a], [,b]) => b - a);

    console.log("   Position Rankings by Average Dynasty Value:");
    sortedPositions.forEach(([pos, avg], i) => {
      console.log(`     ${i + 1}. ${pos}: ${avg.toFixed(2)}`);
    });

    // Calculate position multipliers for normalization
    console.log("\n📏 Position Normalization Multipliers:");
    const highestAvg = Math.max(...Object.values(positionAverages));
    for (const [pos, avg] of sortedPositions) {
      const multiplier = highestAvg / avg;
      console.log(`     ${pos}: ${multiplier.toFixed(3)}x (${avg.toFixed(2)} → ${highestAvg.toFixed(2)})`);
    }

    // Show some example cross-position comparisons
    console.log("\n🎯 Example Cross-Position Comparisons:");
    const examples = [];
    for (const [pos1, players1] of Object.entries(positionGroups)) {
      for (const [pos2, players2] of Object.entries(positionGroups)) {
        if (pos1 !== pos2) {
          const top1 = players1.sort((a, b) => b.dynastyValue - a.dynastyValue)[0];
          const top2 = players2.sort((a, b) => b.dynastyValue - a.dynastyValue)[0];
          
          examples.push({
            pos1, player1: top1.name, value1: top1.dynastyValue,
            pos2, player2: top2.name, value2: top2.dynastyValue,
            ratio: top1.dynastyValue / top2.dynastyValue
          });
        }
      }
    }

    // Show top 5 most extreme comparisons
    examples
      .sort((a, b) => Math.abs(b.ratio - 1) - Math.abs(a.ratio - 1))
      .slice(0, 5)
      .forEach((ex, i) => {
        console.log(`   ${i + 1}. ${ex.pos1} ${ex.player1} (${ex.value1.toFixed(2)}) vs ${ex.pos2} ${ex.player2} (${ex.value2.toFixed(2)})`);
        console.log(`      Ratio: ${ex.ratio.toFixed(3)}x`);
      });

  } catch (error) {
    console.error("❌ Error analyzing position distribution:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzePositionDistribution().catch(console.error);
