#!/usr/bin/env bash
# scripts/dev.sh — Linux/macOS dev startup wrapper
# Usage: ./scripts/dev.sh [--no-slither] [--web-only] [--worker-only]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"

# Check Node.js is available
if ! command -v node &>/dev/null; then
  echo "❌ node not found. Install Node.js 20+ from https://nodejs.org"
  exit 1
fi

# Check pnpm
if ! command -v pnpm &>/dev/null; then
  echo "❌ pnpm not found. Install with: npm install -g pnpm"
  exit 1
fi

cd "$ROOT"
exec node scripts/dev.js "$@"
