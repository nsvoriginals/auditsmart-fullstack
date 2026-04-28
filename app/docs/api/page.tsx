import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Code2, Key, ArrowRight, Terminal } from "lucide-react";

export const metadata: Metadata = {
  title: "API Reference",
  description: "AuditSmart REST API reference — integrate smart contract auditing into your CI/CD pipeline.",
};

const ENDPOINTS = [
  {
    method: "POST",
    path: "/api/v1/audit",
    desc: "Submit a Solidity contract for analysis. Returns a job ID.",
  },
  {
    method: "GET",
    path: "/api/v1/audit/:id",
    desc: "Retrieve a completed audit report by job ID.",
  },
  {
    method: "GET",
    path: "/api/v1/audits",
    desc: "List all audits for the authenticated user.",
  },
];

export default function ApiReferencePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="mb-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <span>/</span>
            <span>API Reference</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6">
            <Code2 className="w-3 h-3" />
            API
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">API Reference</h1>
          <p className="text-lg text-muted-foreground">
            Integrate AuditSmart into your development pipeline with our REST API.
          </p>
        </div>

        {/* Authentication */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
          <div className="p-6 rounded-xl border border-border bg-card mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Bearer token</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              All API requests require a Bearer token in the Authorization header. Generate your API key in{" "}
              <Link href="/dashboard/settings" className="text-primary underline underline-offset-2">Dashboard → Settings</Link>.
            </p>
            <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">
              <code>{`Authorization: Bearer as_live_xxxxxxxxxxxx`}</code>
            </pre>
          </div>
          <p className="text-sm text-muted-foreground">
            Base URL: <code className="text-primary">https://auditsmart.org/api/v1</code>
          </p>
        </section>

        {/* Endpoints */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Endpoints</h2>
          <div className="space-y-4">
            {ENDPOINTS.map(({ method, path, desc }) => (
              <div key={path} className="p-5 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${method === "POST" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>
                    {method}
                  </span>
                  <code className="text-sm font-mono text-foreground">{path}</code>
                </div>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Example */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Example request</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/50">
              <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">cURL</span>
            </div>
            <pre className="p-5 text-xs overflow-x-auto">
              <code>{`curl -X POST https://auditsmart.org/api/v1/audit \\
  -H "Authorization: Bearer as_live_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "pragma solidity ^0.8.0; contract MyToken { ... }",
    "name": "MyToken",
    "chain": "ethereum"
  }'`}</code>
            </pre>
          </div>
        </section>

        {/* CTA */}
        <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="font-semibold mb-1">Ready to integrate?</div>
            <div className="text-sm text-muted-foreground">Generate your API key from the dashboard.</div>
          </div>
          <Link href="/dashboard/settings" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
            Get API key <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
