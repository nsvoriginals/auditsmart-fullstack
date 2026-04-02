"use client";
// app/page.tsx — Landing page

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Search,
  Zap,
  FileText,
  Brain,
  Eye,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
} from "lucide-react";

const FEATURES = [
  {
    icon: <Brain className="w-5 h-5" />,
    title: "Multi-Agent Analysis",
    description: "Groq LLaMA, Claude, and Gemini independently audit your contract and cross-validate findings for maximum accuracy.",
  },
  {
    icon: <Search className="w-5 h-5" />,
    title: "Smart Deduplication",
    description: "Our engine merges duplicate findings from multiple agents, eliminating noise and surfacing what actually matters.",
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: "Real-time Monitoring",
    description: "Paste any contract address and watch live for vulnerability patterns, suspicious activity, and upgrade events.",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "PDF Audit Reports",
    description: "Download professional reports with executive summaries, severity rankings, and remediation code snippets.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Claude Opus Deep Audit",
    description: "One-off deep scans with extended thinking — see the AI's full reasoning chain and get exploit-ready PoC scenarios.",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Deployment Verdict",
    description: "Every audit ends with a clear SAFE / CAUTION / DO NOT DEPLOY verdict backed by quantified risk scoring.",
  },
];

const STATS = [
  { value: "12,000+", label: "Contracts Audited", icon: <CheckCircle className="w-4 h-4" /> },
  { value: "98.4%", label: "Accuracy Rate", icon: <Shield className="w-4 h-4" /> },
  { value: "<45s", label: "Avg Scan Time", icon: <Clock className="w-4 h-4" /> },
  { value: "$0", label: "Start Free", icon: <DollarSign className="w-4 h-4" /> },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_100%)]" />
        
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <Badge variant="outline" className="mb-8 px-4 py-2 text-xs font-mono bg-primary/5 border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mr-2" />
            Powered by Claude Opus · Groq LLaMA · Gemini
          </Badge>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1]">
            Audit smart contracts
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-primary">
              before attackers do.
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Multi-agent AI audits Solidity contracts in under 45 seconds. Find reentrancy, oracle manipulation,
            access control flaws, and 50+ vulnerability classes — with zero false positives.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="group">
              <Link href="/register">
                Start auditing free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#features">
                See how it works
              </Link>
            </Button>
          </div>

          {/* Code Preview */}
          <div className="mt-16 max-w-3xl mx-auto text-left">
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs font-mono text-muted-foreground">VulnerableVault.sol</span>
              </div>
              <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto bg-card text-muted-foreground">
                {`// ⚠ CRITICAL: Reentrancy vulnerability detected
function withdraw(uint amount) external {
    require(balances[msg.sender] >= amount);
    
    // ❌ External call BEFORE state update
    (bool ok,) = msg.sender.call{value: amount}("");
    require(ok);
    
    balances[msg.sender] -= amount; // too late
}

// ✅ AuditSmart fix suggestion:
// Move state update BEFORE external call (CEI pattern)`}
              </pre>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-b bg-card">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-2 text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {stat.value}
                  <span className="text-primary">{stat.icon}</span>
                </div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              What we do
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Enterprise security.
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                No retainer required.
              </span>
            </h2>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="group hover:border-primary transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-foreground">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <Card className="relative overflow-hidden text-center border-primary/30">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                3 free audits. No credit card.
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Start securing your contracts today. Upgrade to Pro or Enterprise when you need more.
              </p>
              <Button asChild size="lg" className="group">
                <Link href="/register">
                  Create free account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold text-foreground">
            Audit<span className="text-primary">Smart</span>
          </span>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AuditSmart. Powered by Claude · Groq · Gemini.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Docs"].map((link) => (
              <Link
                key={link}
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {link}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}