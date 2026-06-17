import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkspaceUserId } from "@/lib/workspace/auth-user";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await getWorkspaceUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const latest = await prisma.analysis.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(latest);
  } catch (error) {
    console.error("Latest analysis error:", error);
    return NextResponse.json({ error: "Failed to fetch latest analysis" }, { status: 500 });
  }
}
