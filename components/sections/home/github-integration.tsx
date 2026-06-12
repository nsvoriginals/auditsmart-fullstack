"use client";
// components/sections/home/github-integration.tsx — GitHub CI/CD integration section

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ease, dur } from "@/components/motion/config";
import { Reveal } from "@/components/motion/primitives";
import { GitPullRequest, GitMerge, ShieldCheck, AlertTriangle, FileJson, CheckCircle2 } from "lucide-react";

const PR_STEPS = [
  {
    icon: GitPullRequest,
    label: "PR Opened",
    sub: "Webhook triggered",
    color: "#00d4ff",
    code: `POST /webhook/github
{ "action": "opened",
  "pull_request": { ... } }`,
  },
  {
    icon: ShieldCheck,
    label: "Audit Queued",
    sub: "BullMQ job created",
    color: "#a855f7",
    code: `queue.add('audit:fast', {
  contractCode: diff.added,
  auditId: uuid(),
  priority: 1
})`,
  },
  {
    icon: AlertTriangle,
    label: "Findings Detected",
    sub: "Slither + AI agents",
    color: "#f59e0b",
    code: `[
  { swc: "SWC-107",
    severity: "HIGH",
    line: 142 },
  { swc: "SWC-104",
    severity: "MEDIUM" }
]`,
  },
  {
    icon: FileJson,
    label: "SARIF Upload",
    sub: "Code Scanning alert",
    color: "#00ff88",
    code: `gh api /repos/{owner}/{repo}
  /code-scanning/sarifs
  -f sarif=@results.sarif`,
  },
  {
    icon: CheckCircle2,
    label: "PR Annotated",
    sub: "Inline comments + check",
    color: "#00ff88",
    code: `✓ AuditSmart check passed
  2 HIGH · 1 MEDIUM detected
  View full report →`,
  },
];

export function GitHubIntegration() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-32 overflow-hidden" style={{ background: "var(--background)" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "var(--border)" }} />

      {/* Background accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 20% 60%, rgba(0,255,136,0.04) 0%, transparent 50%)",
        }}
      />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-20 gap-8">
          <div>
            <Reveal>
              <span
                className="text-xs font-semibold tracking-widest uppercase mb-4 block"
                style={{ color: "#00ff88", fontFamily: "var(--font-dm-mono)" }}
              >
                GitHub Integration
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2
                className="text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.9] tracking-tight"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne)" }}
              >
                SECURITY IN<br />EVERY PR
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.2} className="max-w-sm">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Install the GitHub App. Every pull request triggers a full audit.
              Findings appear as inline review comments and Code Scanning alerts.
              Block merges on critical severity.
            </p>
          </Reveal>
        </div>

        {/* PR flow visualization */}
        <div ref={ref} className="relative">

          {/* Flow steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-16">
            {PR_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.label}
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: dur.medium, ease: ease.expo, delay: i * 0.1 }}
                >
                  {/* Connector line — desktop only */}
                  {i < PR_STEPS.length - 1 && (
                    <div
                      className="hidden lg:block absolute top-8 left-full w-4 h-px z-10"
                      style={{ background: "var(--border)" }}
                    >
                      <motion.div
                        className="h-full origin-left"
                        style={{ background: step.color }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: inView ? 1 : 0 }}
                        transition={{ duration: 0.4, ease: ease.expo, delay: 0.3 + i * 0.1 }}
                      />
                    </div>
                  )}

                  {/* Card */}
                  <div
                    className="rounded-xl border p-5 h-full flex flex-col gap-3"
                    style={{
                      background: "var(--surface-1)",
                      borderColor: "var(--border)",
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: step.color + "18" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: step.color }} />
                    </div>

                    {/* Labels */}
                    <div>
                      <div
                        className="font-semibold text-sm mb-0.5"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {step.label}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" }}
                      >
                        {step.sub}
                      </div>
                    </div>

                    {/* Code snippet */}
                    <div
                      className="mt-auto rounded-lg p-3 font-mono text-[10px] leading-relaxed overflow-hidden"
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--text-secondary)",
                        borderLeft: `2px solid ${step.color}`,
                      }}
                    >
                      <pre className="whitespace-pre-wrap break-all">{step.code}</pre>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Feature bullets */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { label: "SARIF 2.1.0 export", desc: "Native GitHub Code Scanning integration — findings appear as security alerts.", color: "#00ff88" },
              { label: "Inline PR comments", desc: "Line-level annotations on changed files. Developers see findings where they write code.", color: "#00d4ff" },
              { label: "Configurable gates", desc: "Block merges on CRITICAL or HIGH findings. Allowlist specific patterns for false-positive control.", color: "#a855f7" },
            ].map(({ label, desc, color }, i) => (
              <Reveal key={label} delay={i * 0.1}>
                <div
                  className="rounded-xl border p-6"
                  style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
                >
                  <div
                    className="w-2 h-2 rounded-full mb-4"
                    style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                  />
                  <div
                    className="font-semibold text-sm mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {label}
                  </div>
                  <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {desc}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
