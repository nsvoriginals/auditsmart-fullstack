import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Public — no auth required (shared report links).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id: params.id },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Public analysis fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch analysis" }, { status: 500 });
  }
}
