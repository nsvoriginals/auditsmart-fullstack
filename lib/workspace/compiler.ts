// Ported from Sentinel OS backend/utils/compiler.js.
// Compiles Solidity via solc-js. Imports are resolved from user-provided extra
// files first, then the project's node_modules (e.g. @openzeppelin if installed).
import { createRequire } from "module";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const require = createRequire(import.meta.url);
// solc is CommonJS; load lazily-friendly via createRequire.
const solc = require("solc");

// In the Next app, dependencies live under the project root node_modules.
const NODE_MODULES = resolve(process.cwd(), "node_modules");

export interface SolFile {
  name: string;
  content: string;
}

export interface CompileResult {
  abi: any[];
  bytecode: string;
  contractName: string;
  standardInput: any;
  compilerVersion: string;
}

function buildImportResolver(extraFiles: Record<string, string> = {}) {
  return function findImport(importPath: string) {
    const ozV4Redirects: Record<string, string> = {
      "@openzeppelin/contracts/security/ReentrancyGuard.sol":
        "@openzeppelin/contracts/utils/ReentrancyGuard.sol",
      "@openzeppelin/contracts/security/Pausable.sol":
        "@openzeppelin/contracts/utils/Pausable.sol",
    };
    if (ozV4Redirects[importPath]) {
      importPath = ozV4Redirects[importPath];
    }

    if (extraFiles[importPath]) {
      return { contents: extraFiles[importPath] };
    }

    const filename = importPath.split("/").pop() as string;
    const matchByName = Object.entries(extraFiles).find(([k]) => k.endsWith(filename));
    if (matchByName) {
      return { contents: matchByName[1] };
    }

    const searchPaths = [
      resolve(NODE_MODULES, importPath),
      resolve(NODE_MODULES, "@openzeppelin", importPath),
    ];

    for (const fullPath of searchPaths) {
      if (existsSync(fullPath)) {
        try {
          return { contents: readFileSync(fullPath, "utf8") };
        } catch {
          return { error: `Could not read: ${fullPath}` };
        }
      }
    }

    return { error: `Import not found: ${importPath}` };
  };
}

export function compileContract(files: SolFile[], contractName: string): CompileResult {
  const sources: Record<string, { content: string }> = {};
  const extraFiles: Record<string, string> = {};

  files.forEach((f) => {
    sources[f.name] = { content: f.content };
    extraFiles[f.name] = f.content;
    extraFiles[f.name.split("/").pop() as string] = f.content;
  });

  const compilationInput = {
    language: "Solidity",
    sources,
    settings: {
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
      optimizer: { enabled: true, runs: 200 },
    },
  };

  const verificationInput = {
    language: "Solidity",
    sources,
    settings: {
      outputSelection: { "*": { "*": ["*"] } },
      optimizer: { enabled: true, runs: 200 },
    },
  };

  const output = JSON.parse(
    solc.compile(JSON.stringify(compilationInput), { import: buildImportResolver(extraFiles) })
  );

  const errors = (output.errors || []).filter((e: any) => e.severity === "error");
  const missingImports = errors.filter((e: any) => e.message.includes("not found"));
  const fatalErrors = errors.filter((e: any) => !e.message.includes("not found"));

  if (missingImports.length > 0 && fatalErrors.length === 0) {
    const missing = missingImports
      .map((e: any) => e.message.match(/Source "(.+)" not found/)?.[1])
      .filter(Boolean)
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

    throw new Error(
      `Missing imported files:\n${missing.map((m: string) => `  • ${m}`).join("\n")}\n\n` +
        `Add these files as additional contract files in the deploy panel.`
    );
  }

  if (fatalErrors.length > 0) {
    throw new Error(fatalErrors.map((e: any) => e.formattedMessage || e.message).join("\n"));
  }

  let targetContract: any = null;
  let targetKey: string | null = null;

  for (const [, contracts] of Object.entries<any>(output.contracts || {})) {
    for (const [name, contract] of Object.entries<any>(contracts)) {
      if (name.toLowerCase() === contractName.toLowerCase()) {
        targetContract = contract;
        targetKey = name;
        break;
      }
    }
    if (targetContract) break;
  }

  if (!targetContract) {
    const firstFile = Object.values<any>(output.contracts || {})[0];
    if (firstFile) {
      targetKey = Object.keys(firstFile)[0];
      targetContract = firstFile[targetKey];
    }
  }

  if (!targetContract?.evm?.bytecode?.object) {
    throw new Error(`Could not extract bytecode for: ${contractName}`);
  }

  return {
    abi: targetContract.abi,
    bytecode: targetContract.evm.bytecode.object,
    contractName: targetKey as string,
    standardInput: verificationInput,
    compilerVersion: solc.version(),
  };
}
