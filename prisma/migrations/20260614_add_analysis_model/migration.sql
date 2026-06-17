-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalCode" TEXT NOT NULL,
    "optimizedCode" TEXT,
    "securityScore" INTEGER,
    "severityTag" TEXT,
    "vulnerabilities" JSONB,
    "optimizations" JSONB,
    "optimizationInsights" JSONB,
    "gasSavedPercent" DECIMAL(65,30),
    "gasProjection" JSONB,
    "mantleCompatibility" JSONB,
    "summary" TEXT,
    "address" TEXT,
    "network" TEXT,
    "changedLines" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Analysis_userId_idx" ON "Analysis"("userId");

-- CreateIndex
CREATE INDEX "Analysis_createdAt_idx" ON "Analysis"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
