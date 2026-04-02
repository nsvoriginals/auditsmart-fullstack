// lib/pipeline.ts
export interface AuditResult {
  risk_level: string;
  risk_score: number;
  total_findings: number;
  findings: any[];
  summary: string;
  pdf_available: boolean;
  has_fix_suggestions: boolean;
  deployment_verdict: string;
  thinking_chain?: string;
}

export class AuditPipeline {
  async execute(context: {
    contractCode: string;
    contractName: string;
    chain: string;
    plan: string;
    userId?: string;
  }): Promise<AuditResult> {
    
    console.log(`Starting audit pipeline for ${context.contractName}`);
    
    // Simulate AI analysis (replace with actual AI calls)
    // In production, this would call Claude, Groq, or Gemini APIs
    
    // Mock findings based on contract content
    const findings = this.analyzeContract(context.contractCode);
    
    const criticalCount = findings.filter((f: any) => f.severity === "CRITICAL").length;
    const highCount = findings.filter((f: any) => f.severity === "HIGH").length;
    const mediumCount = findings.filter((f: any) => f.severity === "MEDIUM").length;
    
    // Calculate risk score
    let riskScore = 100;
    riskScore -= criticalCount * 15;
    riskScore -= highCount * 8;
    riskScore -= mediumCount * 3;
    riskScore = Math.max(0, Math.min(100, riskScore));
    
    let riskLevel = "LOW";
    if (riskScore <= 30) riskLevel = "CRITICAL";
    else if (riskScore <= 50) riskLevel = "HIGH";
    else if (riskScore <= 70) riskLevel = "MEDIUM";
    
    let deploymentVerdict = "SAFE";
    if (criticalCount > 0) deploymentVerdict = "DO NOT DEPLOY";
    else if (highCount > 2) deploymentVerdict = "CAUTION";
    else if (highCount > 0) deploymentVerdict = "CAUTION";
    
    return {
      risk_level: riskLevel,
      risk_score: riskScore,
      total_findings: findings.length,
      findings: findings,
      summary: this.generateSummary(findings, criticalCount, highCount),
      pdf_available: true,
      has_fix_suggestions: true,
      deployment_verdict: deploymentVerdict,
      thinking_chain: `Deep analysis of ${context.contractName} completed. Found ${criticalCount} critical, ${highCount} high, and ${mediumCount} medium severity issues.`,
    };
  }
  
  private analyzeContract(code: string): any[] {
    const findings = [];
    
    // Reentrancy detection
    if (code.includes('.call{value:') && code.includes('balances[msg.sender] -= ')) {
      findings.push({
        type: "Reentrancy Vulnerability",
        severity: "CRITICAL",
        description: "The withdraw function updates state after an external call, allowing reentrancy attacks.",
        recommendation: "Follow the Checks-Effects-Interactions pattern. Update balances before making external calls.",
        line: this.findLineNumber(code, '.call{value:'),
      });
    }
    
    // Access control issues
    if (code.includes('function withdraw') && !code.includes('onlyOwner')) {
      findings.push({
        type: "Missing Access Control",
        severity: "HIGH",
        description: "Critical functions lack access control modifiers.",
        recommendation: "Add onlyOwner or appropriate access control modifiers to sensitive functions.",
      });
    }
    
    // Unchecked return values
    if (code.includes('.transfer(') || code.includes('.send(')) {
      findings.push({
        type: "Unchecked Return Value",
        severity: "MEDIUM",
        description: "The return value of transfer/send is not checked, which could silently fail.",
        recommendation: "Use require() to check return values or use OpenZeppelin's SafeERC20 library.",
      });
    }
    
    // Timestamp dependence
    if (code.includes('block.timestamp')) {
      findings.push({
        type: "Timestamp Dependence",
        severity: "MEDIUM",
        description: "Using block.timestamp for critical logic can be manipulated by miners.",
        recommendation: "Avoid using block.timestamp for critical logic. Use block numbers for time-based conditions.",
      });
    }
    
    // Integer overflow (pre-0.8.0)
    if (code.includes('pragma solidity ^0.7.') || code.includes('pragma solidity ^0.6.')) {
      findings.push({
        type: "Integer Overflow Risk",
        severity: "HIGH",
        description: "Using an older compiler version without built-in overflow checks.",
        recommendation: "Update to Solidity 0.8.0 or higher, or use SafeMath library.",
      });
    }
    
    return findings;
  }
  
  private findLineNumber(code: string, pattern: string): number {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(pattern)) {
        return i + 1;
      }
    }
    return 0;
  }
  
  private generateSummary(findings: any[], critical: number, high: number): string {
    if (findings.length === 0) {
      return "No security issues were detected. The contract appears to follow best practices.";
    }
    
    if (critical > 0) {
      return `⚠️ CRITICAL: Found ${critical} critical vulnerability that requires immediate attention before deployment.`;
    }
    
    if (high > 0) {
      return `⚠️ HIGH: Found ${high} high-severity issues that should be addressed before production deployment.`;
    }
    
    return `Found ${findings.length} issues that should be reviewed and addressed for better security.`;
  }
}

// Export a convenience function
export async function runAuditPipeline(params: {
  contract_code: string;
  contract_name: string;
  plan: string;
}): Promise<AuditResult> {
  const pipeline = new AuditPipeline();
  return pipeline.execute({
    contractCode: params.contract_code,
    contractName: params.contract_name,
    chain: "ethereum",
    plan: params.plan,
  });
}