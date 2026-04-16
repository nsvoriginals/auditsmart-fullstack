-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT;

-- CreateIndex
CREATE INDEX "Audit_userId_createdAt_idx" ON "Audit"("userId", "createdAt");
