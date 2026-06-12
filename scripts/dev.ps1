# scripts/dev.ps1 — Windows PowerShell dev startup wrapper
# Usage: .\scripts\dev.ps1 [--no-slither] [--web-only] [--worker-only]

param(
    [switch]$NoSlither,
    [switch]$WebOnly,
    [switch]$WorkerOnly,
    [switch]$NoWorker
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir

# Check Node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ node not found. Install Node.js 20+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check pnpm
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pnpm not found. Run: npm install -g pnpm" -ForegroundColor Red
    exit 1
}

Set-Location $Root

# Build args to pass through
$nodeArgs = @("scripts/dev.js")
if ($NoSlither)  { $nodeArgs += "--no-slither" }
if ($WebOnly)    { $nodeArgs += "--web-only" }
if ($WorkerOnly) { $nodeArgs += "--worker-only" }
if ($NoWorker)   { $nodeArgs += "--no-worker" }

& node @nodeArgs
