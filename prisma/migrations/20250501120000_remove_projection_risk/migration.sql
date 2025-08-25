-- AlterTable
ALTER TABLE "public"."ValueDaily"
  DROP COLUMN IF EXISTS "projectionScore",
  DROP COLUMN IF EXISTS "riskScore";
