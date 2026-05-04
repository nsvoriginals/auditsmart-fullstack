"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Bug, Shield, CheckCircle, Send, AlertTriangle, Lock } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = [
  { value: "security", label: "Security Vulnerability", icon: Shield, color: "var(--destructive)", urgent: true },
  { value: "bug", label: "Platform Bug", icon: Bug, color: "var(--warning)", urgent: false },
  { value: "data", label: "Data / Privacy Issue", icon: Lock, color: "var(--brand-purple)", urgent: true },
  { value: "other", label: "Other Issue", icon: AlertTriangle, color: "var(--text-muted)", urgent: false },
];

const SEVERITY_LEVELS = [
  { value: "critical", label: "Critical", desc: "System compromise, data breach, RCE", color: "var(--destructive)", bg: "rgba(239,68,68,0.08)" },
  { value: "high", label: "High", desc: "Auth bypass, privilege escalation, data leak", color: "var(--warning)", bg: "rgba(245,158,11,0.08)" },
  { value: "medium", label: "Medium", desc: "XSS, CSRF, limited info disclosure", color: "var(--brand)", bg: "rgba(0,212,255,0.08)" },
  { value: "low", label: "Low", desc: "Minor issues, informational", color: "var(--brand-green)", bg: "rgba(0,255,148,0.08)" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "var(--elevated)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--text-primary)",
  fontFamily: "'Satoshi', sans-serif",
  fontSize: 13,
  outline: "none",
  transition: "border-color 0.15s",
};

export default function ReportPage() {
  const [form, setForm] = useState({
    name: "", email: "", category: "", severity: "", title: "", description: "", stepsToReproduce: "", impact: "", contactOk: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId] = useState(`BUG-${Math.floor(10000 + Math.random() * 90000)}`);

  const isSecurityReport = form.category === "security" || form.category === "data";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.category || !form.title || !form.description) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1400));
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "'Satoshi', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(239,68,68,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-2xl mx-auto relative">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.18)",
            }}
          >
            <Bug size={26} style={{ color: "var(--destructive)" }} />
          </div>
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
          >
            Report an Issue
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Found a bug or security vulnerability in AuditSmart? We take all reports seriously and respond within 2 hours for security issues.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
        {/* Security disclosure notice */}
        <div
          className="rounded-xl p-5 mb-8"
          style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <div className="flex items-start gap-3">
            <Shield size={16} style={{ color: "var(--destructive)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: "var(--destructive)" }}>Security Researchers Welcome</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                We run an active bug bounty program. Critical vulnerabilities earn up to $2,000. We commit to acknowledging reports within 2 hours, never taking legal action against good-faith researchers, and crediting you publicly if desired.
                See our <a href="/security" style={{ color: "var(--brand)" }}>Security page</a> for full bounty details.
              </p>
            </div>
          </div>
        </div>

        {submitted ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(0,255,148,0.1)", border: "2px solid rgba(0,255,148,0.3)" }}
            >
              <CheckCircle size={30} style={{ color: "var(--brand-green)" }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Report Received</h2>
            <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
              Thank you for taking the time to report this.
              {form.email && <> We&apos;ll follow up at <strong style={{ color: "var(--text-secondary)" }}>{form.email}</strong>.</>}
            </p>
            <div
              className="inline-block px-4 py-2 rounded-lg text-sm font-bold mb-6"
              style={{ background: "var(--elevated)", color: "var(--brand)", border: "1px solid var(--border)" }}
            >
              Report ID: {reportId}
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {isSecurityReport
                ? "Security reports are reviewed within 2 hours. You'll hear from our security team shortly."
                : "We review all bug reports within 24 hours and prioritize fixes by impact."}
            </p>
          </div>
        ) : (
          <div
            className="rounded-2xl p-8"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                  Report Category <span style={{ color: "var(--brand)" }}>*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const active = form.category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat.value })}
                        className="flex items-center gap-2.5 p-3 rounded-xl text-sm font-semibold text-left transition-all"
                        style={{
                          background: active ? `${cat.color}12` : "var(--background)",
                          border: `1px solid ${active ? cat.color + "55" : "var(--border)"}`,
                          color: active ? cat.color : "var(--text-muted)",
                        }}
                      >
                        <Icon size={15} />
                        <div>
                          {cat.label}
                          {cat.urgent && <span className="block text-[10px] font-normal opacity-70">Bounty eligible</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Severity (only for security) */}
              {isSecurityReport && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Estimated Severity</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SEVERITY_LEVELS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setForm({ ...form, severity: s.value })}
                        className="flex items-start gap-2 p-3 rounded-lg text-left transition-all"
                        style={{
                          background: form.severity === s.value ? s.bg : "var(--background)",
                          border: `1px solid ${form.severity === s.value ? s.color + "44" : "var(--border)"}`,
                        }}
                      >
                        <div>
                          <div className="text-xs font-bold" style={{ color: s.color }}>{s.label}</div>
                          <div className="text-[10px]" style={{ color: "var(--text-disabled)" }}>{s.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Your Name <span className="font-normal" style={{ color: "var(--text-disabled)" }}>(optional)</span>
                  </label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Anonymous is fine" style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Email <span style={{ color: "var(--brand)" }}>*</span>
                  </label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="for follow-up" style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")} required />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Issue Title <span style={{ color: "var(--brand)" }}>*</span>
                </label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Short, clear description of the issue" style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")} required />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Description <span style={{ color: "var(--brand)" }}>*</span>
                </label>
                <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={isSecurityReport
                    ? "Describe the vulnerability. Include affected endpoint, payload used, and what data/access was exposed..."
                    : "What happened? What did you expect? Include any error messages or screenshots..."}
                  style={{ ...inputStyle, resize: "vertical", minHeight: 110 }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")} required />
              </div>

              {/* Steps */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Steps to Reproduce <span className="font-normal" style={{ color: "var(--text-disabled)" }}>(optional but helpful)</span>
                </label>
                <textarea rows={3} value={form.stepsToReproduce} onChange={(e) => setForm({ ...form, stepsToReproduce: e.target.value })}
                  placeholder="1. Navigate to...\n2. Submit form with...\n3. Observe..."
                  style={{ ...inputStyle, resize: "vertical", minHeight: 70 }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")} />
              </div>

              {/* Impact (security) */}
              {isSecurityReport && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Impact Assessment</label>
                  <textarea rows={2} value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })}
                    placeholder="What could an attacker achieve? What data or access would be exposed?"
                    style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")} />
                </div>
              )}

              {/* Credit consent */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.contactOk}
                  onChange={(e) => setForm({ ...form, contactOk: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded accent-[var(--brand)]"
                />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  I consent to being contacted about this report and credited in our security hall of fame if the issue is confirmed.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
                style={{
                  background: isSecurityReport
                    ? "linear-gradient(135deg, #ef4444, #ff3d9a)"
                    : "linear-gradient(135deg, var(--brand-purple), var(--brand))",
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                <Send size={15} />
                {submitting ? "Submitting..." : isSecurityReport ? "Submit Security Report" : "Submit Bug Report"}
              </button>
            </form>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
