// Ported from Sentinel OS backend/utils/verify.js.
// Submits source to Etherscan V2 (Mantle chains) for verification. Constructor
// arg encoding uses ethers' AbiCoder, lazily imported so ethers stays optional
// (only needed when a contract actually has constructor args to encode).

/** Etherscan expects e.g. v0.8.35+commit.47b9dedd; solc-js adds .Emscripten.clang */
function formatCompilerVersion(version: string): string {
  const raw = String(version).replace(/^v/, "");
  const match = raw.match(/^(\d+\.\d+\.\d+\+commit\.[a-f0-9]+)/);
  if (match) return `v${match[1]}`;
  const clean = raw.replace(/\.Emscripten.*$/, "");
  return `v${clean}`;
}

export interface VerifyArgs {
  address: string;
  contractName: string;
  compilerVersion: string;
  standardInput: any;
  constructorArgs?: { type: string }[];
  constructorArgValues?: any[];
  network?: "mainnet" | "testnet";
}

export async function verifyContract({
  address,
  contractName,
  compilerVersion,
  standardInput,
  constructorArgs = [],
  constructorArgValues = [],
  network = "testnet",
}: VerifyArgs): Promise<{ guid: string }> {
  const chainId = network === "testnet" ? "5003" : "5000";
  const apiKey = process.env.ETHERSCAN_API_KEY;

  const baseName = contractName.replace(".sol", "");
  const formattedName = `${baseName}.sol:${baseName}`;

  let encodedArgs = "";
  if (constructorArgs.length > 0 && constructorArgValues.length > 0) {
    try {
      const { AbiCoder } = await import("ethers");
      const coder = new AbiCoder();
      const types = constructorArgs.map((a) => a.type);
      encodedArgs = coder.encode(types, constructorArgValues).slice(2);
    } catch (err: any) {
      console.warn("[VERIFY] Could not encode constructor args:", err?.message);
    }
  }

  const apiBase = `https://api.etherscan.io/v2/api?chainid=${chainId}`;

  const params = new URLSearchParams({
    chainid: chainId,
    module: "contract",
    action: "verifysourcecode",
    apikey: apiKey || "",
    contractaddress: address,
    sourceCode: JSON.stringify(standardInput),
    codeformat: "solidity-standard-json-input",
    contractname: formattedName,
    compilerversion: formatCompilerVersion(compilerVersion),
    constructorArguements: encodedArgs,
  });

  const response = await fetch(apiBase, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Etherscan API returned status ${response.status}`);
  }

  const data = await response.json();
  if (data.status !== "1") {
    throw new Error(data.result || data.message || "Verification submission failed");
  }

  return { guid: data.result };
}

export async function checkVerificationStatus(guid: string, network: "mainnet" | "testnet" = "testnet") {
  const chainId = network === "testnet" ? "5003" : "5000";

  const params = new URLSearchParams({
    chainid: chainId,
    module: "contract",
    action: "checkverifystatus",
    guid,
    apikey: process.env.ETHERSCAN_API_KEY || "",
  });

  const response = await fetch(`https://api.etherscan.io/v2/api?${params}`);
  const data = await response.json();

  return {
    status: data.result,
    isPending: data.result === "Pending in queue",
    isVerified: data.result === "Pass - Verified",
    isFailed: typeof data.result === "string" && data.result.startsWith("Fail"),
  };
}
