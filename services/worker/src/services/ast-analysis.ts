// services/worker/src/services/ast-analysis.ts
// Deterministic AST-based analysis using @solidity-parser/parser.
// Catches structural patterns that LLMs often miss or hallucinate.
import * as parser from '@solidity-parser/parser';
import { childLogger } from '../lib/logger';
import { RawFinding } from './normalizer';

type ASTNode = ReturnType<typeof parser.parse>;

const log = childLogger('ast-analysis');

export async function runASTAnalysis(contractCode: string): Promise<RawFinding[]> {
  let ast: ASTNode;
  try {
    ast = parser.parse(contractCode, { loc: true, range: true, tolerant: true });
  } catch (err) {
    log.warn({ err }, 'AST parse failed — skipping AST analysis');
    return [];
  }

  const findings: RawFinding[] = [];

  // Visitor accumulates issues via side-effectful push
  try {
    parser.visit(ast, {
      FunctionDefinition(node) {
        checkMissingReentrancyGuard(node, contractCode, findings);
        checkTxOriginAuth(node, findings);
      },
      ExpressionStatement(node) {
        checkUncheckedLowLevelCall(node, findings);
        checkTransferInLoop(node, findings);
      },
      StateVariableDeclaration(node) {
        checkPublicPrivateKey(node, findings);
      },
      AssemblyBlock(node) {
        recordAssemblyUsage(node, findings);
      },
    });
  } catch (err) {
    log.warn({ err }, 'AST visitor error — partial results returned');
  }

  log.debug({ count: findings.length }, 'AST findings');
  return findings;
}

// ── Individual checks ─────────────────────────────────────────────────────────

function loc(node: ASTNode): { lineStart: number; lineEnd: number } {
  const l = (node as any).loc;
  return {
    lineStart: l?.start?.line ?? 0,
    lineEnd:   l?.end?.line   ?? 0,
  };
}

function checkMissingReentrancyGuard(
  node:     any,
  code:     string,
  findings: RawFinding[]
): void {
  if (node.stateMutability === 'pure' || node.stateMutability === 'view') return;

  let hasExternalCall = false;

  parser.visit(node, {
    ExpressionStatement(expr: any) {
      const str = expressionToString(expr.expression ?? {});
      if (str.includes('.call(') || str.includes('.call{')) hasExternalCall = true;
    },
  });

  if (hasExternalCall) {
    const hasGuard = (node.modifiers ?? []).some(
      (m: any) => /nonReentrant|reentrancy/i.test(m.name ?? '')
    );
    if (!hasGuard) {
      findings.push({
        tool:        'ast',
        agentName:   'ast-reentrancy-detector',
        detectorName: 'ast-reentrancy-detector',
        type:        'Potential reentrancy — missing nonReentrant guard',
        severity:    'medium',
        file:        'Contract.sol',
        ...loc(node),
        description: `Function "${node.name ?? '(fallback)'}" makes external calls without a reentrancy guard modifier.`,
        codeSnippet: extractLines(code, (node as any).loc?.start?.line, (node as any).loc?.end?.line),
        swcId:       'SWC-107',
      });
    }
  }
}

function checkTxOriginAuth(node: any, findings: RawFinding[]): void {
  parser.visit(node, {
    MemberAccess(ma: any) {
      if (
        ma.memberName === 'origin' &&
        expressionToString(ma.expression) === 'tx'
      ) {
        findings.push({
          tool:        'ast',
          agentName:   'ast-tx-origin-detector',
          detectorName: 'ast-tx-origin-detector',
          type:        'tx.origin authentication',
          severity:    'high',
          file:        'Contract.sol',
          ...loc(ma),
          description: 'Using tx.origin for authentication is vulnerable to phishing attacks. Use msg.sender instead.',
          codeSnippet: '',
          swcId:       'SWC-115',
        });
      }
    },
  });
}

function checkUncheckedLowLevelCall(node: any, findings: RawFinding[]): void {
  const expr = node.expression;
  if (!expr) return;

  const str = expressionToString(expr);
  // Detect `.call(` or `.call{value:` not wrapped in require/if
  if ((str.includes('.call(') || str.includes('.call{')) && !str.startsWith('require(')) {
    findings.push({
      tool:        'ast',
      agentName:   'ast-unchecked-call-detector',
      detectorName: 'ast-unchecked-call-detector',
      type:        'Unchecked low-level call return value',
      severity:    'medium',
      file:        'Contract.sol',
      ...loc(node),
      description: 'Low-level .call() return value is not checked. A failed call silently continues execution.',
      codeSnippet: str.slice(0, 200),
      swcId:       'SWC-104',
    });
  }
}

function checkTransferInLoop(node: any, findings: RawFinding[]): void {
  // Naively flag any .transfer() or .send() inside a for/while body
  // The visitor context doesn't carry loop depth, so we check the string
  const str = expressionToString(node.expression ?? node);
  if (str.includes('.transfer(') || str.includes('.send(')) {
    // We can't reliably detect "inside loop" without parent tracking, so skip
    // this check to avoid extreme false-positive rates.
  }
}

function checkPublicPrivateKey(node: any, findings: RawFinding[]): void {
  for (const variable of node.variables ?? []) {
    const name: string = variable.name ?? '';
    if (/private.?key|secret|seed.?phrase/i.test(name) && variable.visibility === 'public') {
      findings.push({
        tool:        'ast',
        agentName:   'ast-sensitive-storage-detector',
        detectorName: 'ast-sensitive-storage-detector',
        type:        'Sensitive data in public state variable',
        severity:    'critical',
        file:        'Contract.sol',
        ...loc(node),
        description: `State variable "${name}" appears to store sensitive data but is marked public.`,
        codeSnippet: '',
        swcId:       'SWC-136',
      });
    }
  }
}

function recordAssemblyUsage(node: any, findings: RawFinding[]): void {
  findings.push({
    tool:        'ast',
    agentName:   'ast-assembly-detector',
    detectorName: 'ast-assembly-detector',
    type:        'Inline assembly usage',
    severity:    'info',
    file:        'Contract.sol',
    ...loc(node),
    description: 'Contract uses inline assembly. Manual review required for memory safety.',
    codeSnippet: '',
    swcId:       'SWC-111',
  });
}

// ── Utility ───────────────────────────────────────────────────────────────────

function expressionToString(expr: any): string {
  if (!expr) return '';
  if (typeof expr === 'string') return expr;
  if (expr.type === 'Identifier') return expr.name ?? '';
  if (expr.type === 'MemberAccess') return `${expressionToString(expr.expression)}.${expr.memberName}`;
  if (expr.type === 'FunctionCall')  return `${expressionToString(expr.expression)}(...)`;
  return JSON.stringify(expr).slice(0, 80);
}

function extractLines(code: string, start: number, end: number): string {
  const lines = code.split('\n');
  return lines.slice(Math.max(0, start - 1), end).join('\n').slice(0, 500);
}
