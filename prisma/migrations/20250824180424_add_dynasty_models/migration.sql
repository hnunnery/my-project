-- CreateTable
CREATE TABLE "public"."Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pos" TEXT NOT NULL,
    "team" TEXT,
    "ageYears" DOUBLE PRECISION,
    "aliases" JSONB,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Snapshot" (
    "asOfDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "rawValue" DOUBLE PRECISION NOT NULL,
    "meta" JSONB,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("asOfDate","source","playerId")
);

-- CreateTable
CREATE TABLE "public"."ValueDaily" (
    "asOfDate" TIMESTAMP(3) NOT NULL,
    "playerId" TEXT NOT NULL,
    "marketValue" DOUBLE PRECISION,
    "projectionScore" DOUBLE PRECISION,
    "ageScore" DOUBLE PRECISION,
    "riskScore" DOUBLE PRECISION,
    "dynastyValue" DOUBLE PRECISION,
    "trend7d" DOUBLE PRECISION,
    "trend30d" DOUBLE PRECISION,

    CONSTRAINT "ValueDaily_pkey" PRIMARY KEY ("asOfDate","playerId")
);

-- CreateIndex
CREATE INDEX "Player_pos_idx" ON "public"."Player"("pos");

-- CreateIndex
CREATE INDEX "Snapshot_source_asOfDate_idx" ON "public"."Snapshot"("source", "asOfDate");

-- CreateIndex
CREATE INDEX "Snapshot_playerId_idx" ON "public"."Snapshot"("playerId");

-- CreateIndex
CREATE INDEX "ValueDaily_asOfDate_idx" ON "public"."ValueDaily"("asOfDate");

-- CreateIndex
CREATE INDEX "ValueDaily_dynastyValue_playerId_idx" ON "public"."ValueDaily"("dynastyValue", "playerId");

-- AddForeignKey
ALTER TABLE "public"."Snapshot" ADD CONSTRAINT "Snapshot_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ValueDaily" ADD CONSTRAINT "ValueDaily_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
