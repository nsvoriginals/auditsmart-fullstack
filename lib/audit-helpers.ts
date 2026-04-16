// lib/audit-helpers.ts

// Re-export payment helpers for backward compatibility
export {
  verifyRazorpaySignature,
  getRazorpayClient,
  formatAmount,
} from './payment-helpers';

/**
 * Validate contract code input
 */
export function validateContract(contractCode: string): string {
  if (!contractCode || contractCode.trim().length === 0) {
    throw { status: 400, message: "Contract code is required" };
  }

  if (contractCode.trim().length < 10) {
    throw { status: 400, message: "Contract code is too short" };
  }

  return contractCode.trim();
}

/**
 * Serialize audit for API response.
 *
 * FIX: JSON.parse(audit.report) was unguarded — malformed or null report
 * values would throw a runtime error and crash the route. Now wrapped in
 * a try/catch that falls back to an empty array so the response always
 * succeeds, and the error is logged for debugging.
 */
export function serializeAuditFull(audit: any) {
  let findings: any[] = [];

  if (audit.report) {
    try {
      const parsed = JSON.parse(audit.report);
      findings = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error(`[serializeAuditFull] Failed to parse report for audit ${audit.id}:`, err);
      findings = [];
    }
  }

  return {
    id: audit.id,
    contract_name: audit.contractName,
    contract_code: audit.contractCode,
    chain: audit.chain,
    status: audit.status,
    score: audit.score,
    summary: audit.summary,
    findings,
    created_at: audit.createdAt,
    completed_at: audit.completedAt,
  };
}