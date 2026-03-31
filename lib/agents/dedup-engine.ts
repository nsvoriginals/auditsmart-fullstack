// lib/agents/dedup-engine.ts
export function deduplicateAndValidate(findings: any[]): any[] {
  const unique = new Map();
  
  for (const finding of findings) {
    const key = `${finding.type}|${finding.function}|${finding.severity}`;
    
    if (!unique.has(key)) {
      unique.set(key, finding);
    } else {
      // Merge or keep the more detailed one
      const existing = unique.get(key);
      if ((finding.description?.length || 0) > (existing.description?.length || 0)) {
        unique.set(key, finding);
      }
    }
  }
  
  return Array.from(unique.values());
}