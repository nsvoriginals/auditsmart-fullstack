// Ported from Sentinel OS backend/utils/gas.js.
// Heuristic gas estimate based on contract size (no on-chain simulation).
export interface GasEstimate {
  before: number;
  after: number;
  deployCostMNT: string;
  avgTxCostMNT: string;
}

export async function estimateGas(code: string): Promise<GasEstimate> {
  const lines = code.split("\n").length;
  const base = 21000;
  const deployGas = base + lines * 200;

  return {
    before: deployGas * 200,
    after: Math.floor(deployGas * 200 * 0.75), // optimized version saves ~25%
    deployCostMNT: (deployGas * 0.00000002).toFixed(4),
    avgTxCostMNT: (base * 0.00000002).toFixed(6),
  };
}
