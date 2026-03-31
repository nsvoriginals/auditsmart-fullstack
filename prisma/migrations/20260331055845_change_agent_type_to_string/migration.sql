/*
  Warnings:

  - The values [LOGIC] on the enum `AgentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AgentType_new" AS ENUM ('REENTRANCY_AGENT', 'OVERFLOW_AGENT', 'ACCESS_CONTROL_AGENT', 'LOGIC_AGENT', 'GAS_DOS_AGENT', 'DEFI_AGENT', 'BACKDOOR_AGENT', 'SIGNATURE_AGENT', 'SLITHER_AGENT', 'GEMINI_AGENT', 'CLAUDE_AGENT', 'SECURITY', 'GAS_OPTIMIZATION', 'COMPLIANCE');
ALTER TABLE "AgentReport" ALTER COLUMN "agentType" TYPE "AgentType_new" USING ("agentType"::text::"AgentType_new");
ALTER TABLE "Finding" ALTER COLUMN "agentType" TYPE "AgentType_new" USING ("agentType"::text::"AgentType_new");
ALTER TYPE "AgentType" RENAME TO "AgentType_old";
ALTER TYPE "AgentType_new" RENAME TO "AgentType";
DROP TYPE "AgentType_old";
COMMIT;
