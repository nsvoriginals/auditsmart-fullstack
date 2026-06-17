import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkspaceUserId } from "@/lib/workspace/auth-user";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getWorkspaceUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const analysis = await prisma.analysis.findFirst({
      where: { id: params.id, userId },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Single analysis fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch analysis" }, { status: 500 });
  }
}

// PATCH /api/workspace/analysis/[id] — update contract address/network
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getWorkspaceUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { address, network } = await req.json();
    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    const normalizedNetwork =
      network === "testnet" || network === "mainnet" ? network : undefined;

    const analysis = await prisma.analysis.findFirst({
      where: { id: params.id, userId },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    const updated = await prisma.analysis.update({
      where: { id: analysis.id },
      data: {
        address,
        ...(normalizedNetwork ? { network: normalizedNetwork } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update address error:", error);
    return NextResponse.json({ error: "Failed to update contract address" }, { status: 500 });
  }
}
