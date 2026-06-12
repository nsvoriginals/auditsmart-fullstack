"""
Slither Analysis Sidecar — FastAPI service wrapping the Slither static analyzer.

Internal-only service (not exposed publicly). Called by the BullMQ worker via HTTP.
Accepts Solidity source code, runs Slither, and returns normalized findings.
"""
from __future__ import annotations

import json
import logging
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("slither-service")

app = FastAPI(title="Slither Analysis Sidecar", version="1.0.0")

# ── Models ────────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    code:          str
    contract_name: str = "Contract"
    solc_version:  str | None = None   # e.g. "0.8.19" — auto-detected if None

class SlitherFinding(BaseModel):
    tool:         str = "slither"
    agent_name:   str
    type:         str
    severity:     str
    file:         str
    line_start:   int
    line_end:     int
    description:  str
    code_snippet: str
    swc_id:       str
    confidence:   str   # Slither's own confidence: High / Medium / Low

class AnalyzeResponse(BaseModel):
    success:  bool
    findings: list[SlitherFinding] = Field(default_factory=list)
    error:    str | None = None
    version:  str | None = None    # solc version actually used


# ── Slither impact → severity ─────────────────────────────────────────────────

_IMPACT_MAP: dict[str, str] = {
    "High":          "high",
    "Medium":        "medium",
    "Low":           "low",
    "Informational": "info",
    "Optimization":  "info",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _detect_pragma(code: str) -> str | None:
    """Extract the first `pragma solidity` version string from source."""
    import re
    m = re.search(r"pragma solidity\s+([^;]+);", code)
    if not m:
        return None
    spec = m.group(1).strip()
    # Extract a concrete version from spec like "^0.8.19" or ">=0.7.0 <0.9.0"
    version_match = re.search(r"(\d+\.\d+\.\d+)", spec)
    return version_match.group(1) if version_match else None


def _ensure_solc(version: str) -> None:
    """Install the requested solc version via solc-select (no-op if already installed)."""
    try:
        subprocess.run(
            ["solc-select", "install", version],
            check=True, capture_output=True, timeout=120
        )
        subprocess.run(
            ["solc-select", "use", version],
            check=True, capture_output=True, timeout=30
        )
        log.info("solc %s selected", version)
    except subprocess.CalledProcessError as exc:
        log.warning("solc-select failed for %s: %s", version, exc.stderr.decode())


def _extract_lines(code: str, start: int, end: int) -> str:
    lines = code.splitlines()
    s = max(0, start - 1)
    e = min(len(lines), end)
    return "\n".join(lines[s:e])[:500]


def _parse_slither_output(raw: dict[str, Any], code: str) -> list[SlitherFinding]:
    findings: list[SlitherFinding] = []

    detectors = raw.get("results", {}).get("detectors", [])
    for det in detectors:
        check      = det.get("check", "unknown")
        impact     = det.get("impact", "Informational")
        confidence = det.get("confidence", "Low")
        description: str = det.get("description", "").strip()[:500]

        elements: list[dict] = det.get("elements", [])

        # Gather all line references
        all_lines: list[int] = []
        primary_file = "Contract.sol"
        for elem in elements:
            sm = elem.get("source_mapping") or {}
            lines_list: list[int] = sm.get("lines") or []
            if lines_list:
                all_lines.extend(lines_list)
            if sm.get("filename_short"):
                primary_file = Path(sm["filename_short"]).name

        line_start = min(all_lines) if all_lines else 0
        line_end   = max(all_lines) if all_lines else 0

        findings.append(SlitherFinding(
            tool         = "slither",
            agent_name   = f"slither-{check}",
            type         = check,
            severity     = _IMPACT_MAP.get(impact, "info"),
            file         = primary_file,
            line_start   = line_start,
            line_end     = line_end,
            description  = description,
            code_snippet = _extract_lines(code, line_start, line_end),
            swc_id       = "SWC-000",   # worker maps this via slither-swc.ts
            confidence   = confidence,
        ))

    return findings


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    code = req.code
    if not code.strip():
        raise HTTPException(status_code=400, detail="Empty contract code")

    # Determine solc version
    solc_version = req.solc_version or _detect_pragma(code)
    if solc_version:
        try:
            _ensure_solc(solc_version)
        except Exception as exc:
            log.warning("Could not set solc %s — using system default: %s", solc_version, exc)
            solc_version = None

    with tempfile.TemporaryDirectory() as tmpdir:
        contract_path = Path(tmpdir) / f"{req.contract_name}.sol"
        contract_path.write_text(code, encoding="utf-8")

        cmd = [
            "slither",
            str(contract_path),
            "--json", "-",
            "--no-fail-pedantic",
            "--disable-color",
        ]

        log.info("Running: %s", " ".join(cmd))
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                timeout=int(os.getenv("SLITHER_TIMEOUT", "120")),
            )
        except subprocess.TimeoutExpired:
            return AnalyzeResponse(success=False, error="Slither timed out")
        except FileNotFoundError:
            return AnalyzeResponse(success=False, error="slither not found in PATH")

        # Slither exits non-zero when findings exist — that is expected
        stdout = result.stdout.decode("utf-8", errors="replace").strip()
        stderr = result.stderr.decode("utf-8", errors="replace").strip()

        if not stdout:
            log.warning("Slither produced no stdout. stderr: %s", stderr[:500])
            if result.returncode not in (0, 1):
                return AnalyzeResponse(success=False, error=stderr[:300] or "Slither failed")
            return AnalyzeResponse(success=True, findings=[], version=solc_version)

        try:
            raw = json.loads(stdout)
        except json.JSONDecodeError as exc:
            log.error("Failed to parse Slither JSON: %s | stdout: %s", exc, stdout[:200])
            return AnalyzeResponse(success=False, error="Invalid JSON from Slither")

        if not raw.get("success", True):
            err_msg = raw.get("error") or "Slither reported failure"
            log.warning("Slither error: %s", err_msg)
            # Still parse any partial findings
            findings = _parse_slither_output(raw, code)
            return AnalyzeResponse(success=False, findings=findings, error=err_msg[:200], version=solc_version)

        findings = _parse_slither_output(raw, code)
        log.info("Slither found %d issue(s)", len(findings))
        return AnalyzeResponse(success=True, findings=findings, version=solc_version)
