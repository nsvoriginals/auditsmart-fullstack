-- Multi-chain support: extend ChainType enum with non-EVM chains and add
-- contractStandard + language columns on Audit. All operations are additive
-- so existing rows are preserved.
--
-- IMPORTANT: ALTER TYPE ... ADD VALUE must run outside the implicit migration
-- transaction in older Postgres, and the new label cannot be used in the same
-- transaction it was added. Neon runs PG 15+, where ADD VALUE inside a tx
-- is supported, but we still keep this idempotent via IF NOT EXISTS.

ALTER TYPE "ChainType" ADD VALUE IF NOT EXISTS 'TON';
ALTER TYPE "ChainType" ADD VALUE IF NOT EXISTS 'SOLANA';
ALTER TYPE "ChainType" ADD VALUE IF NOT EXISTS 'BITCOIN';
ALTER TYPE "ChainType" ADD VALUE IF NOT EXISTS 'TRON';
ALTER TYPE "ChainType" ADD VALUE IF NOT EXISTS 'COSMOS';
ALTER TYPE "ChainType" ADD VALUE IF NOT EXISTS 'POLKADOT';

ALTER TABLE "Audit" ADD COLUMN IF NOT EXISTS "contractStandard" TEXT;
ALTER TABLE "Audit" ADD COLUMN IF NOT EXISTS "language" TEXT;
