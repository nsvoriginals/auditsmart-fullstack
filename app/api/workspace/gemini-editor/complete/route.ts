import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceUserId } from "@/lib/workspace/auth-user";
import { geminiEditorComplete } from "@/lib/workspace/gemini-editor";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const userId = await getWorkspaceUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, line, column, fileName } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    const text = await geminiEditorComplete({
      code,
      line: Number(line) || 1,
      column: Number(column) || 1,
      fileName: fileName || "Contract.sol",
    });

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("Gemini editor complete error:", err?.message ?? err);
    return NextResponse.json({ error: err?.message || "Completion failed" }, { status: 500 });
  }
}
