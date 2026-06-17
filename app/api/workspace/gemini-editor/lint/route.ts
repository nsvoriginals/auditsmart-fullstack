import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceUserId } from "@/lib/workspace/auth-user";
import { geminiEditorLint } from "@/lib/workspace/gemini-editor";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const userId = await getWorkspaceUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, fileName } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    const text = await geminiEditorLint({ code, fileName: fileName || "Contract.sol" });
    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("Gemini editor lint error:", err?.message ?? err);
    return NextResponse.json({ error: err?.message || "Lint failed" }, { status: 500 });
  }
}
