import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkspaceUserId } from "@/lib/workspace/auth-user";
import { callAiAnalysis } from "@/lib/workspace/ai";
import { estimateGas } from "@/lib/workspace/gas";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const userId = await getWorkspaceUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { files, address, network } = await req.json();
    const normalizedNetwork =
      network === "testnet" || network === "mainnet" ? network : null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const mainFile = files[0];
    const aiResult = await callAiAnalysis(mainFile.content);

    // Fallback if AI returns incomplete optimizedCode
    const originalLines = mainFile.content.split("\n").length;
    const optimizedLines = aiResult.optimizedCode?.split("\n").length || 0;

    if (optimizedLines < originalLines * 0.4) {
      aiResult.optimizedCode = mainFile.content;
      aiResult.changedLines = { removed: [], added: [] };
      aiResult.optimizationInsights = [
        "Contract too large for full rewrite. Security vulnerabilities and gas recommendations are listed below.",
      ];
    }

    if (aiResult.gasProjection) {
      aiResult.gasProjection.before = parseInt(String(aiResult.gasProjection.before)) || 0;
      aiResult.gasProjection.after = parseInt(String(aiResult.gasProjection.after)) || 0;
    }

    const gasProjection = await estimateGas(aiResult.optimizedCode || mainFile.content);

    let severityTag = "CRITICAL_PASS";
    const score = aiResult.securityScore ?? 0;
    if (score < 50) severityTag = "CRITICAL";
    else if (score < 70) severityTag = "HIGH_RISK";
    else if (score < 85) severityTag = "MEDIUM_RISK";
    else if (score < 95) severityTag = "LOW_RISK";

    const analysis = await prisma.analysis.create({
      data: {
        userId,
        filename: mainFile.name,
        originalCode: mainFile.content,
        optimizedCode: aiResult.optimizedCode,
        changedLines: (aiResult.changedLines || { removed: [], added: [] }) as any,
        securityScore: aiResult.securityScore,
        severityTag,
        vulnerabilities: aiResult.vulnerabilities,
        optimizations: aiResult.optimizations,
        optimizationInsights: aiResult.optimizationInsights,
        gasSavedPercent: aiResult.gasSavedPercent,
        gasProjection: gasProjection as any,
        mantleCompatibility: aiResult.mantleCompatibility,
        summary: aiResult.summary,
        address: address || null,
        network: normalizedNetwork,
      },
    });

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("Create analysis error:", error?.message ?? error);
    const message =
      error instanceof Error && error.message.startsWith("AI analysis failed")
        ? error.message
        : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
