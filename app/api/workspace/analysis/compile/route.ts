import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkspaceUserId } from "@/lib/workspace/auth-user";
import { compileContract, SolFile } from "@/lib/workspace/compiler";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const userId = await getWorkspaceUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { analysisId, useOptimized, extraFiles } = await req.json();

    if (!analysisId) {
      return NextResponse.json({ error: "Analysis ID is required" }, { status: 400 });
    }

    const analysis = await prisma.analysis.findFirst({
      where: { id: analysisId, userId },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    const code = useOptimized ? analysis.optimizedCode : analysis.originalCode;
    if (!code) {
      return NextResponse.json(
        { error: "No Solidity code found in this analysis" },
        { status: 400 }
      );
    }

    const contractName = analysis.filename.replace(/\.sol$/i, "");

    const filesInput: SolFile[] = [{ name: analysis.filename, content: code }];
    if (extraFiles && Array.isArray(extraFiles)) {
      extraFiles.forEach((f: SolFile) => {
        if (f.name && f.content && f.name !== analysis.filename) {
          filesInput.push({ name: f.name, content: f.content });
        }
      });
    }

    const result = compileContract(filesInput, contractName);

    return NextResponse.json({
      success: true,
      abi: result.abi,
      bytecode: result.bytecode,
      constructorArgs:
        result.abi.find((item: any) => item.type === "constructor")?.inputs || [],
      standardInput: result.standardInput,
      compilerVersion: result.compilerVersion,
    });
  } catch (error: any) {
    console.error("Compilation error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
