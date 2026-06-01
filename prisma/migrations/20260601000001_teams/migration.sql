-- Replace per-user referral system with per-team referral system.
-- Drops the per-user referral tables (only test data in them) and adds
-- Team + TeamCommission.

-- 1) Drop FK + columns + tables from the previous referral schema
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_referredById_fkey";
DROP INDEX IF EXISTS "User_referredById_idx";
ALTER TABLE "User" DROP COLUMN IF EXISTS "referredById";
ALTER TABLE "User" DROP COLUMN IF EXISTS "referralCreditPaise";

DROP TABLE IF EXISTS "Referral";
DROP TABLE IF EXISTS "ReferralCode";
DROP TYPE  IF EXISTS "ReferralStatus";

-- 2) Team
CREATE TABLE "Team" (
  "id"             TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "code"           TEXT NOT NULL,
  "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
  "contactEmail"   TEXT,
  "payoutDetails"  TEXT,
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "clickCount"     INTEGER NOT NULL DEFAULT 0,
  "signupCount"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Team_code_key"     ON "Team"("code");
CREATE INDEX        "Team_code_idx"     ON "Team"("code");
CREATE INDEX        "Team_isActive_idx" ON "Team"("isActive");

-- 3) User.referredByTeamId
ALTER TABLE "User" ADD COLUMN "referredByTeamId" TEXT;
CREATE INDEX "User_referredByTeamId_idx" ON "User"("referredByTeamId");
ALTER TABLE "User"
  ADD CONSTRAINT "User_referredByTeamId_fkey"
  FOREIGN KEY ("referredByTeamId") REFERENCES "Team"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 4) TeamCommission
CREATE TABLE "TeamCommission" (
  "id"                 TEXT NOT NULL,
  "teamId"             TEXT NOT NULL,
  "userId"             TEXT NOT NULL,
  "paymentId"          TEXT NOT NULL,
  "plan"               "UserRole" NOT NULL,
  "paymentAmountPaise" INTEGER NOT NULL,
  "commissionPaise"    INTEGER NOT NULL,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeamCommission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamCommission_paymentId_key"      ON "TeamCommission"("paymentId");
CREATE INDEX        "TeamCommission_teamId_idx"         ON "TeamCommission"("teamId");
CREATE INDEX        "TeamCommission_teamId_createdAt_idx" ON "TeamCommission"("teamId", "createdAt");
CREATE INDEX        "TeamCommission_createdAt_idx"      ON "TeamCommission"("createdAt");

ALTER TABLE "TeamCommission"
  ADD CONSTRAINT "TeamCommission_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamCommission"
  ADD CONSTRAINT "TeamCommission_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
