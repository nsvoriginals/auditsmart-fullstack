-- Repair migration: the 20260601000000_referrals migration is recorded as
-- applied in _prisma_migrations on some environments (incl. the primary Neon
-- DB) but its objects were never actually created — so `migrate deploy` will
-- not re-run it. This migration re-creates exactly those objects, idempotently
-- (IF NOT EXISTS / guarded DO blocks), so it's a no-op on a fresh DB where the
-- original migration already ran. Purely additive — no data loss.

-- 1) Enum (CREATE TYPE has no IF NOT EXISTS; guard with a DO block).
DO $$
BEGIN
  CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'QUALIFIED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) User columns.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "referredById"        TEXT,
  ADD COLUMN IF NOT EXISTS "referralCreditPaise" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "User_referredById_idx" ON "User"("referredById");

DO $$
BEGIN
  ALTER TABLE "User"
    ADD CONSTRAINT "User_referredById_fkey"
    FOREIGN KEY ("referredById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3) ReferralCode.
CREATE TABLE IF NOT EXISTS "ReferralCode" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "code"        TEXT NOT NULL,
  "clickCount"  INTEGER NOT NULL DEFAULT 0,
  "signupCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ReferralCode_userId_key" ON "ReferralCode"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "ReferralCode_code_key"   ON "ReferralCode"("code");
CREATE INDEX        IF NOT EXISTS "ReferralCode_code_idx"   ON "ReferralCode"("code");

DO $$
BEGIN
  ALTER TABLE "ReferralCode"
    ADD CONSTRAINT "ReferralCode_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4) Referral.
CREATE TABLE IF NOT EXISTS "Referral" (
  "id"              TEXT NOT NULL,
  "referrerId"      TEXT NOT NULL,
  "referredUserId"  TEXT NOT NULL,
  "status"          "ReferralStatus" NOT NULL DEFAULT 'PENDING',
  "firstPaymentId"  TEXT,
  "commissionPaise" INTEGER NOT NULL DEFAULT 0,
  "qualifiedAt"     TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Referral_referredUserId_key"    ON "Referral"("referredUserId");
CREATE INDEX        IF NOT EXISTS "Referral_referrerId_idx"        ON "Referral"("referrerId");
CREATE INDEX        IF NOT EXISTS "Referral_status_idx"            ON "Referral"("status");
CREATE INDEX        IF NOT EXISTS "Referral_referrerId_status_idx" ON "Referral"("referrerId", "status");

DO $$
BEGIN
  ALTER TABLE "Referral"
    ADD CONSTRAINT "Referral_referrerId_fkey"
    FOREIGN KEY ("referrerId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Referral"
    ADD CONSTRAINT "Referral_referredUserId_fkey"
    FOREIGN KEY ("referredUserId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
