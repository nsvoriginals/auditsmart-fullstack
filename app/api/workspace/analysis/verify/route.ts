import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceUserId } from "@/lib/workspace/auth-user";
import { verifyContract } from "@/lib/workspace/verify";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const userId = await getWorkspaceUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { address, contractName, compilerVersion, standardInput, constructorArgs, network } =
      await req.json();

    const result = await verifyContract({
      address,
      contractName,
      compilerVersion,
      standardInput,
      constructorArgs,
      network,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
