// services/worker/src/services/ai-pass.ts
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { NormalizedFinding, SimilarExploit } from '@auditsmart/shared';
import { CORRELATION_SYSTEM_PROMPT, buildCorrelationUserPrompt } from '../prompts/correlation.prompt';
import { SimilarityService } from './similarity.service';
import { prisma } from '../lib/db';
import { childLogger } from '../lib/logger';
import { metrics } from '../lib/metrics';

const log = childLogger('ai-pass');

// ── Zod response schema ───────────────────────────────────────────────────────
// Claude MUST produce output matching this schema exactly.
// Any deviation causes a retry (up to MAX_RETRIES).

const FindingEnhancementSchema = z.object({
  fingerprint:            z.string().min(1),
  narrative_explanation:  z.string().min(20),
  exploit_scenario:       z.string().min(20),
  fix_recommendation:     z.string().min(10),
  fix_code:               z.string().nullable(),
  business_impact:        z.string().min(10),
});

const CorrelationResponseSchema = z.object({
  enhancements: z.array(FindingEnhancementSchema),
});

type CorrelationResponse = z.infer<typeof CorrelationResponseSchema>;
type FindingEnhancement  = z.infer<typeof FindingEnhancementSchema>;

const MAX_RETRIES = 3;
const BASE_TIMEOUT_MS = 90_000; // 90 s — Claude Sonnet is fast, Opus takes longer

function getModel(plan: string): string {
  switch (plan.toLowerCase()) {
    case 'deep_audit':  return process.env.CLAUDE_OPUS_MODEL   ?? 'claude-opus-4-7';
    case 'enterprise':  return process.env.CLAUDE_SONNET_MODEL ?? 'claude-sonnet-4-6';
    default:            return process.env.CLAUDE_HAIKU_MODEL  ?? 'claude-haiku-4-5-20251001';
  }
}

function getMaxTokens(plan: string): number {
  switch (plan.toLowerCase()) {
    case 'deep_audit':  return 8000;
    case 'enterprise':  return 5000;
    default:            return 2500;
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────
export async function runAICorrelationPass(
  auditId: string,
  findings: NormalizedFinding[],
  contractCode: string,
  plan: string,
  similarity: SimilarityService
): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    log.warn({ auditId }, 'ANTHROPIC_API_KEY missing — skipping AI pass');
    return;
  }

  // Only enhance findings that are worth paying for (medium and above)
  const enhanceable = findings.filter((f) =>
    ['critical', 'high', 'medium'].includes(f.severity)
  );

  if (enhanceable.length === 0) {
    log.info({ auditId }, 'No enhanceable findings — AI pass skipped');
    return;
  }

  const client = new Anthropic({ apiKey });

  // ── Step 1: Historical exploit enrichment ─────────────────────────────────
  log.info({ auditId, count: enhanceable.length }, 'enriching findings with historical exploits');
  const similarMap = await similarity.enrichFindings(
    enhanceable.map((f) => ({
      fingerprint:  f.fingerprint,
      codeSnippet:  f.codeSnippet,
      category:     f.category,
    }))
  );

  // ── Step 2: Build prompt ───────────────────────────────────────────────────
  const userPrompt = buildCorrelationUserPrompt(enhanceable, contractCode, similarMap);
  const model      = getModel(plan);
  const maxTokens  = getMaxTokens(plan);

  // ── Step 3: Call Claude with retry on schema validation failure ────────────
  const aiStart = Date.now();
  let response: CorrelationResponse | null = null;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      log.debug({ auditId, model, attempt }, 'calling Claude');

      const msg = await Promise.race([
        client.messages.create({
          model,
          max_tokens: maxTokens,
          system:     CORRELATION_SYSTEM_PROMPT,
          messages:   [{ role: 'user', content: userPrompt }],
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Claude timeout after ${BASE_TIMEOUT_MS}ms`)),
            BASE_TIMEOUT_MS
          )
        ),
      ]);

      const rawText = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');

      // Strip any accidental markdown code fences
      const jsonText = rawText.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();

      const parsed = JSON.parse(jsonText);
      response = CorrelationResponseSchema.parse(parsed);
      log.info({ auditId, attempt, enhancements: response.enhancements.length }, 'Claude response validated');
      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      log.warn({ auditId, attempt, error: lastError.message }, 'Claude attempt failed');

      if (attempt < MAX_RETRIES) {
        await sleep(2_000 * attempt); // exponential-ish backoff
      }
    }
  }

  metrics.aiLatency.observe((Date.now() - aiStart) / 1000);

  if (!response) {
    log.error({ auditId, error: lastError?.message }, 'AI pass failed after all retries');
    metrics.aiErrors.inc({ reason: 'max_retries' });
    return;
  }

  // ── Step 4: Persist enhancements ──────────────────────────────────────────
  const enhancementMap = new Map(
    response.enhancements.map((e) => [e.fingerprint, e])
  );

  const dbFindings = await prisma.finding.findMany({
    where:  { auditId },
    select: { id: true, title: true },
  });

  // We store enhancements in the FindingEnhancement table
  const rows: Array<{
    findingId:           string;
    narrativeExplanation: string;
    exploitScenario:     string;
    fixRecommendation:   string;
    fixCode:             string | null;
    businessImpact:      string;
    similarExploitIds:   string[];
    similarityScores:    number[];
    generatedBy:         string;
  }> = [];

  for (const dbFinding of dbFindings) {
    // Match by fingerprint stored in title (we use title as the fingerprint key)
    // In a full implementation, store fingerprint in Finding table directly.
    const enhancement = enhancementMap.get(dbFinding.id) ??
      // Fallback: try any enhancement if fingerprint matching is imprecise
      response.enhancements.find((e) => e.fingerprint === dbFinding.id);

    if (!enhancement) continue;

    const similar     = similarMap.get(dbFinding.id) ?? [];
    const exploitIds  = similar.map((s) => s.id);
    const scores      = similar.map((s) => s.similarity);

    rows.push({
      findingId:            dbFinding.id,
      narrativeExplanation: enhancement.narrative_explanation,
      exploitScenario:      enhancement.exploit_scenario,
      fixRecommendation:    enhancement.fix_recommendation,
      fixCode:              enhancement.fix_code,
      businessImpact:       enhancement.business_impact,
      similarExploitIds:    exploitIds,
      similarityScores:     scores,
      generatedBy:          model,
    });
  }

  if (rows.length > 0) {
    await prisma.$transaction(
      rows.map((r) =>
        prisma.findingEnhancement.upsert({
          where:  { findingId: r.findingId },
          create: r,
          update: r,
        })
      )
    );
    log.info({ auditId, count: rows.length }, 'enhancements persisted');
  }

  metrics.aiEnhancementsTotal.inc(rows.length);
}

// ── Echidna harness generation ────────────────────────────────────────────────
export async function generateEchidnaHarness(
  auditId: string,
  findings: NormalizedFinding[],
  contractCode: string,
  contractName: string
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const { HARNESS_SYSTEM_PROMPT, buildHarnessUserPrompt } = await import('../prompts/harness.prompt');
  const client = new Anthropic({ apiKey });

  const userPrompt = buildHarnessUserPrompt(contractCode, findings, contractName);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const msg = await client.messages.create({
        model:      process.env.CLAUDE_SONNET_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 4000,
        system:     HARNESS_SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: userPrompt }],
      });

      const rawCode = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')
        .replace(/^```(?:solidity)?\s*/m, '')
        .replace(/\s*```$/m, '')
        .trim();

      // Basic validation: must contain pragma and echidna_ function
      if (
        rawCode.includes('pragma solidity') &&
        rawCode.includes('echidna_') &&
        rawCode.includes('AuditSmartFuzzHarness')
      ) {
        log.info({ auditId, attempt }, 'Echidna harness generated successfully');
        return rawCode;
      }

      log.warn({ auditId, attempt }, 'Harness validation failed — retrying');
    } catch (err) {
      log.warn({ auditId, attempt, err }, 'Harness generation error');
    }

    await sleep(2_000 * attempt);
  }

  log.error({ auditId }, 'Echidna harness generation failed after all retries');
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
