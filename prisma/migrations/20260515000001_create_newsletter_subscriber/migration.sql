-- Create table for fresh databases
CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribeToken" TEXT NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- Add unsubscribeToken if the table already existed without it
ALTER TABLE "NewsletterSubscriber" ADD COLUMN IF NOT EXISTS "unsubscribeToken" TEXT;

-- Backfill any rows that are missing a value before enforcing NOT NULL
UPDATE "NewsletterSubscriber"
SET "unsubscribeToken" = gen_random_uuid()::text
WHERE "unsubscribeToken" IS NULL;

-- Enforce NOT NULL (safe to run even if column is already NOT NULL)
ALTER TABLE "NewsletterSubscriber" ALTER COLUMN "unsubscribeToken" SET NOT NULL;

-- Idempotent indexes
CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_unsubscribeToken_key" ON "NewsletterSubscriber"("unsubscribeToken");
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_email_idx" ON "NewsletterSubscriber"("email");
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_unsubscribeToken_idx" ON "NewsletterSubscriber"("unsubscribeToken");
