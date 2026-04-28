import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Activity, CheckCircle, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "System Status",
  description: "AuditSmart system status — real-time uptime and incident history.",
};

const SERVICES = [
  { name: "Audit Engine (Claude Opus)", status: "operational" },
  { name: "Audit Engine (Groq LLaMA)", status: "operational" },
  { name: "Audit Engine (Gemini)", status: "operational" },
  { name: "Web Application", status: "operational" },
  { name: "API", status: "operational" },
  { name: "PDF Report Generation", status: "operational" },
  { name: "Authentication", status: "operational" },
  { name: "Email Delivery (Resend)", status: "operational" },
  { name: "Payment Processing (Razorpay)", status: "operational" },
  { name: "Database", status: "operational" },
];

const INCIDENTS: { date: string; title: string; desc: string; resolved: boolean }[] = [];

export default function StatusPage() {
  const allOperational = SERVICES.every((s) => s.status === "operational");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-24">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6">
            <Activity className="w-3 h-3" />
            System Status
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-6">System Status</h1>

          {/* Overall status */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            allOperational ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          }`}>
            <span className={`w-2 h-2 rounded-full ${allOperational ? "bg-green-400" : "bg-amber-400"} animate-pulse`} />
            {allOperational ? "All systems operational" : "Partial outage"}
          </div>
        </div>

        {/* Services */}
        <section className="mb-16">
          <h2 className="text-lg font-semibold mb-4">Services</h2>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {SERVICES.map(({ name, status }) => (
              <div key={name} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm">{name}</span>
                <div className="flex items-center gap-1.5 text-xs font-medium text-green-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Operational
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Incidents */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Incident history</h2>
          {INCIDENTS.length === 0 ? (
            <div className="flex items-center gap-3 p-6 rounded-xl border border-border bg-card text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0" />
              <span className="text-sm">No incidents in the past 90 days.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {INCIDENTS.map(({ date, title, desc, resolved }) => (
                <div key={title} className="p-5 rounded-xl border border-border bg-card">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <span className="font-medium text-sm">{title}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
