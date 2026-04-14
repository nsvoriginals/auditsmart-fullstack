// lib/agents/dedup-engine.ts - Enhanced with grouping by type and confidence filtering

export interface DedupedFinding {
  type: string;
  severity: string;
  confidence: string;
  instances: Array<{
    function: string;
    line: string;
    description: string;
  }>;
  recommendation: string;
  source: string;
}

export function deduplicateAndValidate(findings: any[]): any[] {
  // Group by vulnerability TYPE (not exact match)
  const groupedByType = new Map<string, DedupedFinding>();
  
  for (const finding of findings) {
    const type = finding.type || "Unknown";
    const severity = finding.severity || "info";
    const confidence = finding.confidence || "MEDIUM";
    
    if (!groupedByType.has(type)) {
      // First instance of this vulnerability type
      groupedByType.set(type, {
        type: type,
        severity: severity,
        confidence: confidence,
        instances: [],
        recommendation: finding.recommendation || "",
        source: finding.source || "unknown"
      });
    }
    
    const group = groupedByType.get(type)!;
    
    // Add instance
    group.instances.push({
      function: finding.function || "unknown",
      line: finding.line || "?",
      description: finding.description || ""
    });
    
    // Keep highest severity
    const severityOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
    if (severityOrder[severity as keyof typeof severityOrder] > 
        severityOrder[group.severity as keyof typeof severityOrder]) {
      group.severity = severity;
    }
    
    // Keep highest confidence
    const confidenceOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    if (confidenceOrder[confidence as keyof typeof confidenceOrder] > 
        confidenceOrder[group.confidence as keyof typeof confidenceOrder]) {
      group.confidence = confidence;
    }
  }
  
  // Convert grouped findings back to array format
  const result: any[] = [];
  for (const [type, group] of groupedByType) {
    const instanceCount = group.instances.length;
    const instanceList = group.instances.map(i => i.function).join(", ");
    
    result.push({
      type: type,
      severity: group.severity,
      confidence: group.confidence,
      function: instanceCount > 1 ? `${type} (${instanceCount} instances)` : group.instances[0].function,
      locations: group.instances.map(i => `${i.function}@${i.line}`).join(", "),
      description: instanceCount > 1 
        ? `${type} found in ${instanceCount} locations: ${instanceList}. ${group.instances[0].description}`
        : group.instances[0].description,
      recommendation: group.recommendation,
      source: group.source,
      instance_count: instanceCount
    });
  }
  
  // Sort by severity (critical first)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  result.sort((a, b) => severityOrder[a.severity as keyof typeof severityOrder] - 
                       severityOrder[b.severity as keyof typeof severityOrder]);
  
  console.log(`🔍 Dedup engine: ${findings.length} raw → ${result.length} unique (grouped by type)`);
  
  return result;
}

// Filter LOW confidence findings from PDF (H-01)
export function filterForPDF(findings: any[]): any[] {
  const filtered = findings.filter(f => f.confidence !== "LOW");
  const removedCount = findings.length - filtered.length;
  if (removedCount > 0) {
    console.log(`📄 PDF filter: Removed ${removedCount} LOW-confidence findings from report`);
  }
  return filtered;
}