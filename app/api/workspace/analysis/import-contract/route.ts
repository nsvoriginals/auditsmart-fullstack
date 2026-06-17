import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceUserId } from "@/lib/workspace/auth-user";

export const runtime = "nodejs";

// Parse Etherscan/Blockscout SourceCode (handles Standard JSON inputs)
function parseSourceCode(rawSource: string, contractName: string) {
  // Double-wrapped JSON (most common for verified contracts)
  if (rawSource.startsWith("{{")) {
    try {
      const json = JSON.parse(rawSource.slice(1, -1));
      return Object.entries<any>(json.sources).map(([filename, { content }]) => ({
        name: filename.split("/").pop(),
        content,
      }));
    } catch {
      /* fall through */
    }
  }

  // Standard JSON
  if (rawSource.startsWith("{")) {
    try {
      const json = JSON.parse(rawSource);
      if (json.sources) {
        return Object.entries<any>(json.sources).map(([filename, { content }]) => ({
          name: filename.split("/").pop(),
          content,
        }));
      }
    } catch {
      /* fall through */
    }
  }

  // Plain Solidity string — wrap as single file
  return [{ name: `${contractName}.sol`, content: rawSource }];
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getWorkspaceUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const network = searchParams.get("network") || "mainnet";

    if (!address) {
      return NextResponse.json({ error: "Contract address is required" }, { status: 400 });
    }

    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(address)) {
      return NextResponse.json({ error: "Invalid contract address format" }, { status: 400 });
    }

    const chainId = network === "testnet" ? "5003" : "5000";
    const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getsourcecode&address=${address}&apikey=${process.env.ETHERSCAN_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Etherscan API returned status ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "1" || !data.result?.length) {
      const raw = data.result || data.message || "Failed to fetch source code";
      const errorMsg =
        typeof raw === "string" && raw.includes("not verified")
          ? "Contract is not verified. Only verified contracts can be imported."
          : raw;
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const contractInfo = data.result[0];
    const {
      SourceCode: rawSourceCode,
      ContractName: contractName = "ImportedContract",
      CompilerVersion: compilerVersion,
      OptimizationUsed: optimizationUsed,
      Runs: runs,
    } = contractInfo;

    if (!rawSourceCode) {
      return NextResponse.json({ error: "Source code is empty or missing." }, { status: 400 });
    }

    const files = parseSourceCode(rawSourceCode, contractName);

    return NextResponse.json({
      success: true,
      contractName,
      files,
      compilerVersion,
      optimizationUsed,
      runs,
    });
  } catch (error) {
    console.error("Import contract error:", error);
    return NextResponse.json(
      { error: "Failed to import contract. Please try again." },
      { status: 500 }
    );
  }
}
