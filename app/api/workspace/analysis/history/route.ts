import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkspaceUserId } from "@/lib/workspace/auth-user";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const userId = await getWorkspaceUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1") || 1;
    const limit = parseInt(searchParams.get("limit") || "20") || 20;
    const skip = (page - 1) * limit;

    const [total, records] = await Promise.all([
      prisma.analysis.count({ where: { userId } }),
      prisma.analysis.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          filename: true,
          createdAt: true,
          securityScore: true,
          severityTag: true,
          gasSavedPercent: true,
          vulnerabilities: true,
          address: true,
          network: true,
          originalCode: true,
          optimizedCode: true,
        },
      }),
    ]);

    const formattedRecords = records.map((r) => ({
      id: r.id,
      filename: r.filename,
      createdAt: r.createdAt,
      securityScore: r.securityScore,
      severityTag: r.severityTag,
      gasEfficiency: r.gasSavedPercent,
      vulnerabilityCount: Array.isArray(r.vulnerabilities) ? r.vulnerabilities.length : 0,
      address: r.address,
      network: r.network,
      originalCode: r.originalCode,
      optimizedCode: r.optimizedCode,
    }));

    return NextResponse.json({ total, records: formattedRecords });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
