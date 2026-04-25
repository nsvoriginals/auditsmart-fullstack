-- Add unsubscribeToken to NewsletterSubscriber
-- Backfills existing rows with a unique UUID before adding the NOT NULL constraint

ALTER TABLE "NewsletterSubscriber" ADD COLUMN "unsubscribeToken" TEXT;

UPDATE "NewsletterSubscriber"
SET "unsubscribeToken" = gen_random_uuid()::text
WHERE "unsubscribeToken" IS NULL;

ALTER TABLE "NewsletterSubscriber" ALTER COLUMN "unsubscribeToken" SET NOT NULL;

CREATE UNIQUE INDEX "NewsletterSubscriber_unsubscribeToken_key"
  ON "NewsletterSubscriber"("unsubscribeToken");

CREATE INDEX "NewsletterSubscriber_unsubscribeToken_idx"
  ON "NewsletterSubscriber"("unsubscribeToken");
