-- Referral payout preference: additive only.
-- The ReferralCode/Referral tables and ReferralStatus enum already exist
-- (migration 20260601000000_referrals). This migration only adds the
-- per-user payout choice (cash vs account credit) + payout details.

CREATE TYPE "ReferralPayoutMethod" AS ENUM ('CREDIT', 'CASH');

ALTER TABLE "User"
  ADD COLUMN "referralPayoutMethod"  "ReferralPayoutMethod" NOT NULL DEFAULT 'CREDIT',
  ADD COLUMN "referralPayoutDetails" TEXT;
