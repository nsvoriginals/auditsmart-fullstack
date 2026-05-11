import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const PAID_PLANS = new Set(["PREMIUM", "ENTERPRISE", "ADMIN"]);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = (((session.user as any).plan as string) || "FREE").toUpperCase();
  if (!PAID_PLANS.has(plan)) {
    return NextResponse.json(
      { error: "Quantum auditing requires a Pro plan or higher." },
      { status: 403 }
    );
  }

  const quantumUrl = process.env.QUANTUM_URL;
  if (!quantumUrl) {
    return NextResponse.json(
      { error: "Quantum engine is not configured on this server." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${quantumUrl}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // 130s gives the engine (default 120s timeout) time to finish + network overhead
      signal: AbortSignal.timeout(130_000),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    console.error("[quantum/audit]", err);
    return NextResponse.json(
      {
        error: isTimeout
          ? "Quantum engine timed out. Please try again."
          : "Quantum engine is unreachable. Please try again later.",
      },
      { status: isTimeout ? 504 : 502 }
    );
  }
}
