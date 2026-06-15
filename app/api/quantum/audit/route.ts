import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Quantum auditing is gated to paid plans (Pro → PREMIUM, Enterprise) and Admins.
  const ALLOWED_PLANS = ["PREMIUM", "ENTERPRISE", "ADMIN"];
  const effectivePlan = (session.user.plan || session.user.role || "FREE").toUpperCase();
  if (!ALLOWED_PLANS.includes(effectivePlan) && session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Quantum auditing is available on Pro and Enterprise plans." },
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
