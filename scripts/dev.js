#!/usr/bin/env node
// scripts/dev.js — Cross-platform dev startup script
// Works on: Windows (PowerShell/cmd), Linux, macOS
// Usage: node scripts/dev.js
//        node scripts/dev.js --no-slither   (skip Slither if Python not ready)
//        node scripts/dev.js --worker-only

'use strict';

const { spawn }   = require('child_process');
const path        = require('path');
const fs          = require('fs');
const os          = require('os');
const http        = require('http');

// ── Platform detection ────────────────────────────────────────────────────────

const IS_WIN  = os.platform() === 'win32';
const ROOT    = path.resolve(__dirname, '..');

// On Windows, `pnpm` is `pnpm.cmd`; Python may be `python` or `py`
const PNPM    = IS_WIN ? 'pnpm.cmd'   : 'pnpm';
const PYTHON  = IS_WIN ? 'python'     : 'python3';
const UVICORN = IS_WIN ? 'uvicorn'    : 'uvicorn';

// ── CLI flags ─────────────────────────────────────────────────────────────────

const args         = process.argv.slice(2);
const NO_SLITHER   = args.includes('--no-slither');
const WORKER_ONLY  = args.includes('--worker-only');
const NO_WORKER    = args.includes('--no-worker');
const WEB_ONLY     = args.includes('--web-only');

// ── ANSI colors ───────────────────────────────────────────────────────────────
// Force color even in terminals that don't auto-detect (Windows cmd, CI)

const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  gray:    '\x1b[90m',
};

function color(str, ...codes) {
  return codes.join('') + str + C.reset;
}

// ── Service definitions ───────────────────────────────────────────────────────

const SERVICES = {
  web: {
    label:    color(' WEB ', C.bold, C.blue),
    tag:      color('[WEB]    ', C.blue),
    cmd:      PNPM,
    args:     ['dev'],
    cwd:      ROOT,
    env:      { FORCE_COLOR: '1' },
    port:     3000,
    healthUrl: 'http://localhost:3000',
  },
  worker: {
    label:    color(' WORKER ', C.bold, C.magenta),
    tag:      color('[WORKER] ', C.magenta),
    cmd:      PNPM,
    args:     ['dev'],
    cwd:      path.join(ROOT, 'services', 'worker'),
    env:      { FORCE_COLOR: '1' },
    port:     9090,
    healthUrl: 'http://localhost:9090/health',
  },
  slither: {
    label:    color(' SLITHER ', C.bold, C.cyan),
    tag:      color('[SLITHER] ', C.cyan),
    cmd:      PYTHON,
    args:     ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8001', '--reload'],
    cwd:      path.join(ROOT, 'services', 'slither'),
    env:      {},
    port:     8001,
    healthUrl: 'http://localhost:8001/health',
  },
};

// ── Banner ────────────────────────────────────────────────────────────────────

function printBanner() {
  console.log('');
  console.log(color('  ╔══════════════════════════════════════════════════╗', C.cyan, C.bold));
  console.log(color('  ║    AuditSmart — Development Environment          ║', C.cyan, C.bold));
  console.log(color('  ║    Multi-Chain Smart Contract Security Platform  ║', C.cyan, C.bold));
  console.log(color('  ╚══════════════════════════════════════════════════╝', C.cyan, C.bold));
  console.log('');
  console.log(color(`  Platform: ${os.platform()} ${os.arch()}`, C.gray));
  console.log(color(`  Node:     ${process.version}`, C.gray));
  console.log(color(`  Root:     ${ROOT}`, C.gray));
  console.log('');
}

// ── Pre-flight checks ─────────────────────────────────────────────────────────

function checkEnvFile() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) {
    console.error(color('\n  ✗ .env file not found.', C.red, C.bold));
    console.error(color('    Copy .env.example to .env and fill in your values.\n', C.red));
    process.exit(1);
  }

  // Load .env into process.env for this script's checks
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }

  console.log(color('  ✓ .env loaded', C.green));
}

function checkRequired() {
  const required = {
    DATABASE_URL:    'Neon PostgreSQL connection string',
    GROQ_API_KEY:    'Groq API key (llama-3.3-70b agents)',
    ANTHROPIC_API_KEY: 'Anthropic API key (Claude enhancement)',
  };

  const optional = {
    REDIS_URL:       'BullMQ worker queue (required for worker)',
    GEMINI_API_KEY:  'Gemini agents (gas + compliance analysis)',
    OPENAI_API_KEY:  'OpenAI embeddings for exploit KB',
  };

  let missingRequired = false;

  for (const [key, desc] of Object.entries(required)) {
    if (!process.env[key] || process.env[key].includes('CHANGE_ME')) {
      console.error(color(`  ✗ Missing ${key}: ${desc}`, C.red));
      missingRequired = true;
    } else {
      console.log(color(`  ✓ ${key}`, C.green));
    }
  }

  for (const [key, desc] of Object.entries(optional)) {
    if (!process.env[key] || process.env[key].includes('CHANGE_ME')) {
      console.log(color(`  ⚠ ${key} not set (${desc})`, C.yellow));
    } else {
      console.log(color(`  ✓ ${key}`, C.green));
    }
  }

  if (missingRequired) {
    console.error(color('\n  Required env vars missing. Aborting.\n', C.red, C.bold));
    process.exit(1);
  }

  // Warn about missing REDIS_URL if running worker
  if (!WORKER_ONLY && !WEB_ONLY && !process.env.REDIS_URL) {
    console.log('');
    console.log(color('  ⚠  REDIS_URL not set — worker will fail to connect.', C.yellow, C.bold));
    console.log(color('     Get your Upstash TCP URL from console.upstash.com', C.yellow));
    console.log(color('     (Connect → Node.js → ioredis URL starts with rediss://)', C.yellow));
    console.log('');
  }
}

function checkPythonForSlither() {
  return new Promise((resolve) => {
    const probe = spawn(PYTHON, ['--version'], { stdio: 'pipe' });
    probe.on('close', (code) => resolve(code === 0));
    probe.on('error', () => resolve(false));
  });
}

// ── Process management ────────────────────────────────────────────────────────

const procs = new Map(); // id → ChildProcess

function startService(id) {
  const svc = SERVICES[id];
  if (!svc) return;

  console.log(color(`\n  Starting ${svc.label}...`, C.bold));
  console.log(color(`  $ ${svc.cmd} ${svc.args.join(' ')}`, C.gray));
  console.log(color(`  cwd: ${svc.cwd}`, C.gray));

  const env = { ...process.env, ...svc.env };

  const child = spawn(svc.cmd, svc.args, {
    cwd:   svc.cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    // On Windows, shell: true is needed for .cmd files
    shell: IS_WIN,
  });

  procs.set(id, child);

  // Prefix every line of stdout/stderr with the service tag
  function prefixLines(data, isError) {
    const text = data.toString();
    const lines = text.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      const prefix = isError ? color('[ERR]', C.red) : svc.tag;
      process.stdout.write(prefix + ' ' + line.trimEnd() + '\n');
    }
  }

  child.stdout.on('data', (d) => prefixLines(d, false));
  child.stderr.on('data', (d) => prefixLines(d, true));

  child.on('close', (code, signal) => {
    procs.delete(id);
    if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGINT') {
      console.log('');
      console.log(color(`  ${svc.label} exited with code ${code}`, C.red, C.bold));
      console.log(color(`  Check output above for errors.`, C.red));
    }
  });

  child.on('error', (err) => {
    console.error(color(`\n  Failed to start ${id}: ${err.message}`, C.red, C.bold));
    if (id === 'slither' && err.code === 'ENOENT') {
      console.error(color(`  Python not found. Install with: pip install -r services/slither/requirements.txt`, C.yellow));
      console.error(color(`  Or restart with --no-slither flag`, C.yellow));
    }
    procs.delete(id);
  });
}

// ── Health polling ────────────────────────────────────────────────────────────

function waitForPort(port, label, maxWaitMs = 60_000) {
  return new Promise((resolve) => {
    const start  = Date.now();
    const timer  = setInterval(() => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        clearInterval(timer);
        console.log(color(`  ✓ ${label} ready on :${port}`, C.green));
        resolve(true);
      });
      req.on('error', () => {
        if (Date.now() - start > maxWaitMs) {
          clearInterval(timer);
          console.log(color(`  ⚠ ${label} :${port} not responding after ${maxWaitMs / 1000}s`, C.yellow));
          resolve(false);
        }
      });
      req.setTimeout(1000, () => req.destroy());
    }, 2000);
  });
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────

async function shutdown(signal) {
  console.log('');
  console.log(color(`\n  Shutting down (${signal})...`, C.yellow, C.bold));

  for (const [id, child] of procs) {
    console.log(color(`  Stopping ${id}...`, C.gray));
    if (IS_WIN) {
      spawn('taskkill', ['/pid', child.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  }

  await new Promise((r) => setTimeout(r, 2000));
  console.log(color('  All services stopped.\n', C.green));
  process.exit(0);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ── Status printer ────────────────────────────────────────────────────────────

function printUrls() {
  console.log('');
  console.log(color('  ┌─────────────────────────────────────────┐', C.cyan));
  console.log(color('  │  Service URLs                           │', C.cyan));
  console.log(color('  ├─────────────────────────────────────────┤', C.cyan));
  console.log(color('  │', C.cyan) + color('  Web App   ', C.blue)   + color('http://localhost:3000      ', C.white) + color('│', C.cyan));
  if (!WEB_ONLY) {
    console.log(color('  │', C.cyan) + color('  Metrics   ', C.magenta) + color('http://localhost:9090/metrics', C.white) + color('│', C.cyan));
  }
  if (!NO_SLITHER && !WEB_ONLY && !WORKER_ONLY) {
    console.log(color('  │', C.cyan) + color('  Slither   ', C.cyan)   + color('http://localhost:8001/docs  ', C.white) + color('│', C.cyan));
  }
  console.log(color('  └─────────────────────────────────────────┘', C.cyan));
  console.log('');
  console.log(color('  Press Ctrl+C to stop all services.', C.gray));
  console.log('');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  printBanner();

  console.log(color('  Pre-flight checks', C.bold));
  console.log(color('  ─────────────────', C.gray));

  checkEnvFile();
  checkRequired();

  // Determine which services to start
  const toStart = [];

  if (!WORKER_ONLY) {
    toStart.push('web');
  }

  if (!WEB_ONLY && !WORKER_ONLY) {
    // Check for REDIS_URL before starting worker
    if (process.env.REDIS_URL) {
      toStart.push('worker');
    } else {
      console.log(color('\n  Skipping worker — REDIS_URL not set.', C.yellow));
      console.log(color('  Start with REDIS_URL configured to enable the full pipeline.', C.yellow));
    }
  } else if (WORKER_ONLY) {
    toStart.push('worker');
  }

  if (!NO_SLITHER && !WEB_ONLY && !WORKER_ONLY) {
    const hasPython = await checkPythonForSlither();
    if (hasPython) {
      toStart.push('slither');
    } else {
      console.log(color(`\n  Skipping Slither — ${PYTHON} not found.`, C.yellow));
      console.log(color('  Install: pip install -r services/slither/requirements.txt', C.yellow));
    }
  }

  console.log('');
  console.log(color(`  Starting services: ${toStart.join(', ')}`, C.bold));
  console.log(color('  ─────────────────────────────────────────', C.gray));

  // Stagger starts slightly to avoid log collision
  for (let i = 0; i < toStart.length; i++) {
    startService(toStart[i]);
    if (i < toStart.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  console.log('');
  console.log(color('  Waiting for services to be ready...', C.gray));

  const checks = [];
  if (toStart.includes('web'))     checks.push(waitForPort(3000,  'Web App', 90_000));
  if (toStart.includes('worker'))  checks.push(waitForPort(9090,  'Worker',  30_000));
  if (toStart.includes('slither')) checks.push(waitForPort(8001,  'Slither', 60_000));

  await Promise.allSettled(checks);

  printUrls();
}

main().catch((err) => {
  console.error(color(`\nFatal startup error: ${err.message}\n`, C.red, C.bold));
  process.exit(1);
});
