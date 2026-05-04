"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MessageSquare, Clock, AlertTriangle, CheckCircle, Upload, Send, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

const ISSUE_TYPES = [
  { value: "bug", label: "Bug Report", icon: AlertTriangle, color: "var(--destructive)" },
  { value: "billing", label: "Billing Issue", icon: MessageSquare, color: "var(--warning)" },
  { value: "account", label: "Account Problem", icon: MessageSquare, color: "var(--brand-purple)" },
  { value: "audit", label: "Audit Question", icon: MessageSquare, color: "var(--brand)" },
  { value: "feature", label: "Feature Request", icon: MessageSquare, color: "var(--brand-green)" },
  { value: "other", label: "Other", icon: MessageSquare, color: "var(--text-muted)" },
];

const SEVERITY = [
  { value: "critical", label: "Critical — service is unusable", color: "var(--destructive)" },
  { value: "high", label: "High — major feature broken", color: "var(--warning)" },
  { value: "medium", label: "Medium — partial functionality affected", color: "var(--brand)" },
  { value: "low", label: "Low — minor inconvenience", color: "var(--brand-green)" },
];

const QUICK_LINKS = [
  { title: "Billing & subscriptions", href: "/help#billing", icon: ChevronRight },
  { title: "Getting started guide", href: "/help#getting-started", icon: ChevronRight },
  { title: "How to run an audit", href: "/help#running-audits", icon: ChevronRight },
  { title: "API documentation", href: "/docs/api", icon: ChevronRight },
  { title: "Community Discord", href: "/community", icon: ChevronRight },
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

export default function SupportPage() {
  const [form, setForm] = useState({
    name: "", email: "", issueType: "", severity: "", subject: "", description: "", stepsToReproduce: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId] = useState(`AS-${Math.floor(10000 + Math.random() * 90000)}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.issueType || !form.subject || !form.description) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
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
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(123,47,255,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-2xl mx-auto relative">
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
          >
            Support Center
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Submit a ticket and our team will get back to you. Typical response time is under 24 hours.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {[
              { icon: Clock, label: "< 24h Response", color: "var(--brand-green)" },
              { icon: MessageSquare, label: "Human Support", color: "var(--brand)" },
              { icon: CheckCircle, label: "99.9% Resolved", color: "var(--brand-purple)" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Icon size={12} style={{ color: item.color }} />
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 grid lg:grid-cols-[1fr_320px] gap-10">
        {/* Form */}
        <div>
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
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Ticket Submitted!</h2>
              <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                Your ticket has been created. We&apos;ll reply to <strong style={{ color: "var(--text-secondary)" }}>{form.email}</strong>.
              </p>
              <div
                className="inline-block px-4 py-2 rounded-lg text-sm font-bold mb-6"
                style={{ background: "var(--elevated)", color: "var(--brand)", border: "1px solid var(--border)" }}
              >
                Ticket ID: {ticketId}
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Save this ID for reference. Check your email for a confirmation.
              </p>
            </div>
          ) : (
            <div
              className="rounded-2xl p-8"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
            >
              <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Open a Support Ticket</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name & Email */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Name <span style={{ color: "var(--brand)" }}>*</span>
                    </label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name" style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Email <span style={{ color: "var(--brand)" }}>*</span>
                    </label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com" style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")} required />
                  </div>
                </div>

                {/* Issue type */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                    Issue Type <span style={{ color: "var(--brand)" }}>*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ISSUE_TYPES.map((type) => {
                      const Icon = type.icon;
                      const active = form.issueType === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setForm({ ...form, issueType: type.value })}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left"
                          style={{
                            background: active ? "var(--elevated)" : "var(--background)",
                            border: `1px solid ${active ? type.color : "var(--border)"}`,
                            color: active ? type.color : "var(--text-muted)",
                          }}
                        >
                          <Icon size={12} style={{ color: active ? type.color : "var(--text-muted)" }} />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Severity</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    style={{ ...inputStyle, cursor: "pointer" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <option value="">Select severity...</option>
                    {SEVERITY.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Subject <span style={{ color: "var(--brand)" }}>*</span>
                  </label>
                  <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Brief description of the issue" style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")} required />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Description <span style={{ color: "var(--brand)" }}>*</span>
                  </label>
                  <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe what happened, what you expected, and any error messages you see..."
                    style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")} required />
                </div>

                {/* Steps */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Steps to Reproduce <span className="font-normal" style={{ color: "var(--text-disabled)" }}>(optional)</span>
                  </label>
                  <textarea rows={3} value={form.stepsToReproduce} onChange={(e) => setForm({ ...form, stepsToReproduce: e.target.value })}
                    placeholder="1. Go to...\n2. Click on...\n3. Expected vs actual..."
                    style={{ ...inputStyle, resize: "vertical", minHeight: 70 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")} />
                </div>

                {/* Attachment note */}
                <div
                  className="flex items-center gap-2 p-3 rounded-lg text-xs"
                  style={{ background: "var(--elevated)", border: "1px dashed var(--border)", color: "var(--text-muted)" }}
                >
                  <Upload size={13} style={{ color: "var(--text-disabled)" }} />
                  Screenshots and files can be attached by emailing <a href="mailto:support@auditsmart.org" style={{ color: "var(--brand)" }}>support@auditsmart.org</a> after submitting
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, var(--brand-purple), var(--brand))",
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  <Send size={15} />
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          <div
            className="rounded-2xl p-5"
            style={{ background: "rgba(0,255,148,0.04)", border: "1px solid rgba(0,255,148,0.15)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} style={{ color: "var(--brand-green)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--brand-green)" }}>Support Hours</span>
            </div>
            <div className="space-y-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <div className="flex justify-between"><span>General support</span><span style={{ color: "var(--text-secondary)" }}>Mon–Fri, 9–6 UTC</span></div>
              <div className="flex justify-between"><span>Critical issues</span><span style={{ color: "var(--text-secondary)" }}>24/7</span></div>
              <div className="flex justify-between"><span>Typical response</span><span style={{ color: "var(--text-secondary)" }}>&lt; 24 hours</span></div>
            </div>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-sm font-bold mb-4" style={{ color: "var(--text-primary)" }}>Quick Links</h3>
            <ul className="space-y-1">
              {QUICK_LINKS.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 py-2 px-2 rounded-lg text-xs font-medium transition-all"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--brand)"; (e.currentTarget as HTMLElement).style.background = "var(--brand-faint)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <ChevronRight size={11} />
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>Email Us Directly</h3>
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Prefer email? We reply to every message.</p>
            <a href="mailto:support@auditsmart.org" className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
              support@auditsmart.org
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
