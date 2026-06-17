// Ported from Sentinel OS backend/utils/gemini-editor.js.
// Uses the @google/generative-ai SDK (already an AuditSmart dependency) instead
// of @google/genai. Provides ghost-text completion + lint for the workspace
// Solidity editor.
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sanitizeUntrustedSource } from "@auditsmart/shared";

const GEMINI_EDITOR_MODEL = process.env.GEMINI_EDITOR_MODEL || "gemini-2.5-flash";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  if (!client) {
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return client;
}

export async function geminiEditorComplete({
  code,
  line,
  column,
  fileName = "Contract.sol",
}: {
  code: string;
  line: number;
  column: number;
  fileName?: string;
}): Promise<string> {
  code = sanitizeUntrustedSource(code).sanitized;
  const lines = code.split("\n");
  const lineIdx = Math.max(0, line - 1);

  const before = lines.slice(Math.max(0, lineIdx - 20), lineIdx + 1).join("\n");
  const after = lines.slice(lineIdx + 1, lineIdx + 8).join("\n");
  const currentLine = lines[lineIdx] ?? "";

  const trimmed = currentLine.trimStart();
  const isFunctionStart = trimmed.startsWith("function");
  const isModifier = trimmed.startsWith("modifier");
  const isEvent = trimmed.startsWith("event");
  const isMapping = trimmed.includes("mapping");
  const isRequire = trimmed.startsWith("require");
  const isForLoop = trimmed.startsWith("for");
  const isEmit = trimmed.startsWith("emit");

  const prompt = `You are SENTINEL_OS, an expert Solidity code completion engine for Mantle L2.

Complete the Solidity code at the cursor position. Your completion must:
- Follow the existing code style, indentation, and naming conventions exactly
- Be valid, deployable Solidity compatible with ^0.8.x
- Apply Mantle L2 best practices: prefer calldata over memory for external function params, use ++i over i++, cache array lengths outside loops, prefer custom errors over require strings
- Never introduce reentrancy vulnerabilities — always update state before external calls
- Never use tx.origin for authorization — use msg.sender
- Complete the immediate logical unit only (finish the current function, struct, or block)
- Match the security and gas patterns already established in this contract

FILE: ${fileName}
CURSOR POSITION: line ${line}, column ${column}
CURRENT LINE: ${currentLine}
CONTEXT HINT: ${
    isFunctionStart
      ? "completing a function signature and body"
      : isModifier
        ? "completing a modifier"
        : isEvent
          ? "completing an event declaration"
          : isMapping
            ? "completing a mapping declaration"
            : isRequire
              ? "completing a require statement"
              : isForLoop
                ? "completing a for loop — use cached length and ++i"
                : isEmit
                  ? "completing an emit statement"
                  : "completing general Solidity code"
  }

--- CONTRACT CODE BEFORE CURSOR ---
${before}
--- CONTRACT CODE AFTER CURSOR ---
${after}

STRICT OUTPUT RULES:
- Return ONLY the raw Solidity code to insert at the cursor
- No markdown, no backticks, no code fences, no explanation
- No SPDX headers, no pragma lines, no contract redeclaration
- 1 to 6 lines maximum
- If the current line is already complete and correct, return a single newline only
- Never repeat code that already exists before or after the cursor
- Preserve the exact indentation level of the current line`;

  const ai = getClient();
  const model = ai.getGenerativeModel({
    model: GEMINI_EDITOR_MODEL,
    generationConfig: { temperature: 0.15, maxOutputTokens: 320 },
  });
  const result = await model.generateContent(prompt);

  return (result.response.text() ?? "")
    .replace(/^```(?:solidity)?\n?/i, "")
    .replace(/```$/i, "")
    .replace(/^\/\/ SPDX.*\n?/gm, "")
    .replace(/^pragma solidity.*\n?/gm, "")
    .trim();
}

export async function geminiEditorLint({
  code,
  fileName = "Contract.sol",
}: {
  code: string;
  fileName?: string;
}): Promise<string> {
  code = sanitizeUntrustedSource(code).sanitized;
  const snippet = code.length > 12000 ? code.slice(-12000) : code;

  const prompt = `You are SENTINEL_OS, an expert Solidity security linter for Mantle L2.

Analyze the following Solidity contract for real security vulnerabilities, gas inefficiencies, and Mantle L2-specific issues.

RULES:
- Latest supported Solidity version is 0.8.35 — never flag ^0.8.x pragma versions as errors
- Only flag REAL issues with clear evidence in the code — no speculative warnings
- Prioritize: reentrancy, tx.origin usage, unchecked external calls, integer overflow, unbounded loops, improper access control, uninitialized storage pointers
- For gas issues: flag unbounded loops, redundant storage reads, memory vs calldata misuse, inefficient mappings
- For Mantle L2 specifically: flag direct block.timestamp reliance, tx.gasprice assumptions, oversized calldata that may exceed EigenDA limits
- Do NOT flag: missing NatSpec comments, style issues, naming conventions, floating pragma (unless below 0.6.0)
- Do NOT duplicate findings — one entry per unique issue
- Line numbers must be accurate — count from line 1

File: ${fileName}

\`\`\`solidity
${snippet}
\`\`\`

Return ONLY a valid JSON array with no markdown, no explanation, no backticks outside the array.
Maximum 8 findings. If no issues found return exactly: []

Schema:
[
  {
    "line": <exact 1-indexed line number>,
    "severity": "high" | "med" | "low",
    "title": "<5 words max issue name>",
    "message": "<one sentence explaining the vulnerability and its impact>",
    "fix": "<one sentence specific fix recommendation>"
  }
]`;

  const ai = getClient();
  const model = ai.getGenerativeModel({
    model: GEMINI_EDITOR_MODEL,
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
  });
  const result = await model.generateContent(prompt);

  return (result.response.text() ?? "").trim();
}
