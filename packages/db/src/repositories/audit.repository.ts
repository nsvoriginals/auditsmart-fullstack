// packages/db/src/repositories/audit.repository.ts
// All Audit + Finding DB access goes through this repository.
// Services never import Prisma directly — they call these typed methods.
import type { Audit, Finding, Prisma } from '@prisma/client';
import { prisma }                        from '../client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuditWithFindings = Audit & { findings: Finding[] };

export interface CreateAuditInput {
  userId:       string;
  contractName: string;
  contractCode: string;
  chain:        string;
  plan:         string;
}

export interface UpdateAuditStatusInput {
  auditId: string;
  status:  string;
  score?:  number;
  summary?: string;
}

// ── Repository ────────────────────────────────────────────────────────────────

export const AuditRepository = {

  async findById(id: string): Promise<Audit | null> {
    return prisma.audit.findUnique({ where: { id } });
  },

  async findWithFindings(id: string): Promise<AuditWithFindings | null> {
    return prisma.audit.findUnique({
      where:   { id },
      include: { findings: { orderBy: { severity: 'asc' } } },
    });
  },

  async findByReportId(reportId: string): Promise<Audit | null> {
    return prisma.audit.findUnique({ where: { reportId } });
  },

  async findByUserId(
    userId:  string,
    options: { limit?: number; offset?: number; status?: string } = {},
  ): Promise<Audit[]> {
    return prisma.audit.findMany({
      where:   { userId, ...(options.status && { status: options.status as any }) },
      orderBy: { createdAt: 'desc' },
      take:    options.limit ?? 20,
      skip:    options.offset ?? 0,
    });
  },

  async create(input: CreateAuditInput): Promise<Audit> {
    return prisma.audit.create({
      data: {
        userId:       input.userId,
        contractName: input.contractName,
        contractCode: input.contractCode,
        chain:        input.chain as any,
        status:       'PENDING',
      },
    });
  },

  async updateStatus(input: UpdateAuditStatusInput): Promise<void> {
    await prisma.audit.update({
      where: { id: input.auditId },
      data:  {
        status:  input.status as any,
        score:   input.score,
        summary: input.summary,
        ...(input.status === 'COMPLETED' && { completedAt: new Date() }),
        ...(input.status === 'PROCESSING' && { startedAt: new Date() }),
      },
    });
  },

  async countByUserAndStatus(userId: string, status: string): Promise<number> {
    return prisma.audit.count({ where: { userId, status: status as any } });
  },

  async delete(id: string): Promise<void> {
    await prisma.audit.delete({ where: { id } });
  },

} as const;

// ── Finding repository ────────────────────────────────────────────────────────

export interface CreateFindingInput {
  auditId:      string;
  agentType:    string;
  title:        string;
  description:  string;
  severity:     string;
  lineNumber?:  number;
  codeSnippet?: string;
  swcId?:       string;
  cweIds?:      string[];
  confidence?:  number;
}

export const FindingRepository = {

  async createMany(findings: CreateFindingInput[]): Promise<void> {
    if (findings.length === 0) return;
    await prisma.finding.createMany({
      data: findings.map((f) => ({
        auditId:      f.auditId,
        agentType:    f.agentType as any,
        title:        f.title,
        description:  f.description,
        severity:     f.severity.toUpperCase() as any,
        lineNumber:   f.lineNumber,
        codeSnippet:  f.codeSnippet,
      })),
      skipDuplicates: true,
    });
  },

  async findByAuditId(auditId: string): Promise<Finding[]> {
    return prisma.finding.findMany({
      where:   { auditId },
      orderBy: [{ severity: 'asc' }, { createdAt: 'asc' }],
    });
  },

  async countBySeverity(auditId: string): Promise<Record<string, number>> {
    const rows = await prisma.finding.groupBy({
      by:    ['severity'],
      where: { auditId },
      _count: { severity: true },
    });
    return Object.fromEntries(rows.map((r) => [r.severity.toLowerCase(), r._count.severity]));
  },

} as const;
