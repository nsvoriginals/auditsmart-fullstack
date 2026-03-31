// lib/audit-helpers.ts
// Re-export payment helpers for backward compatibility
export { 
  verifyRazorpaySignature, 
  getRazorpayClient, 
  formatAmount 
} from './payment-helpers';

// Also keep any existing audit helper functions here
// ... your existing audit helper code ...

/**
 * Validate contract code
 */
export function validateContract(contractCode: string): string {
  if (!contractCode || contractCode.trim().length === 0) {
    throw { status: 400, message: "Contract code is required" };
  }
  
  if (contractCode.length < 10) {
    throw { status: 400, message: "Contract code is too short" };
  }
  
  return contractCode.trim();
}

/**
 * Serialize audit for response
 */
export function serializeAuditFull(audit: any) {
  return {
    id: audit.id,
    contract_name: audit.contractName,
    contract_code: audit.contractCode,
    chain: audit.chain,
    status: audit.status,
    score: audit.score,
    summary: audit.summary,
    findings: audit.report ? JSON.parse(audit.report) : [],
    created_at: audit.createdAt,
    completed_at: audit.completedAt,
  };
}