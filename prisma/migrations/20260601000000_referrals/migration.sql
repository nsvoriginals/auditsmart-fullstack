-- Referrals migration: additive. Adds two tables + two columns on User.

-- 1) Enum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'QUALIFIED', 'REJECTED');

-- 2) User columns
ALTER TABLE "User"
  ADD COLUMN "referredById"        TEXT,
  ADD COLUMN "referralCreditPaise" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "User_referredById_idx" ON "User"("referredById");

ALTER TABLE "User"
  ADD CONSTRAINT "User_referredById_fkey"
  FOREIGN KEY ("referredById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 3) ReferralCode
CREATE TABLE "ReferralCode" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "code"        TEXT NOT NULL,
  "clickCount"  INTEGER NOT NULL DEFAULT 0,
  "signupCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferralCode_userId_key" ON "ReferralCode"("userId");
CREATE UNIQUE INDEX "ReferralCode_code_key"   ON "ReferralCode"("code");
CREATE INDEX        "ReferralCode_code_idx"   ON "ReferralCode"("code");

ALTER TABLE "ReferralCode"
  ADD CONSTRAINT "ReferralCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 4) Referral
CREATE TABLE "Referral" (
  "id"              TEXT NOT NULL,
  "referrerId"      TEXT NOT NULL,
  "referredUserId"  TEXT NOT NULL,
  "status"          "ReferralStatus" NOT NULL DEFAULT 'PENDING',
  "firstPaymentId"  TEXT,
  "commissionPaise" INTEGER NOT NULL DEFAULT 0,
  "qualifiedAt"     TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Referral_referredUserId_key"   ON "Referral"("referredUserId");
CREATE INDEX        "Referral_referrerId_idx"       ON "Referral"("referrerId");
CREATE INDEX        "Referral_status_idx"           ON "Referral"("status");
CREATE INDEX        "Referral_referrerId_status_idx" ON "Referral"("referrerId", "status");

ALTER TABLE "Referral"
  ADD CONSTRAINT "Referral_referrerId_fkey"
  FOREIGN KEY ("referrerId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Referral"
  ADD CONSTRAINT "Referral_referredUserId_fkey"
  FOREIGN KEY ("referredUserId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
