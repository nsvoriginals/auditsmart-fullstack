-- AlterTable: add hasUsedTrial to User
ALTER TABLE "User" ADD COLUMN "hasUsedTrial" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: add isTrial to Subscription
ALTER TABLE "Subscription" ADD COLUMN "isTrial" BOOLEAN NOT NULL DEFAULT false;
