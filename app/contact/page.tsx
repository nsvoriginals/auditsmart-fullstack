"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Mail, MessageSquare, Clock, MapPin, Send, CheckCircle } from "lucide-react";
import { FaTelegram, FaDiscord, FaTwitter, FaLinkedin } from "react-icons/fa";
import toast from "react-hot-toast";

const CONTACT_OPTIONS = [
  {
    icon: MessageSquare,
    color: "var(--brand)",
    bg: "rgba(0,212,255,0.08)",
    title: "General Inquiries",
    desc: "Questions about AuditSmart, features, or partnerships.",
    contact: "hello@auditsmart.org",
    href: "mailto:hello@auditsmart.org",
  },
  {
    icon: Mail,
    color: "var(--brand-purple)",
    bg: "rgba(123,47,255,0.08)",
    title: "Sales & Enterprise",
    desc: "Custom plans, team pricing, or enterprise contracts.",
    contact: "sales@auditsmart.org",
    href: "mailto:sales@auditsmart.org",
  },
  {
    icon: Clock,
    color: "var(--brand-green)",
    bg: "rgba(0,255,148,0.08)",
    title: "Security Reports",
    desc: "Found a vulnerability in AuditSmart? Report it responsibly.",
    contact: "security@auditsmart.org",
    href: "mailto:security@auditsmart.org",
  },
  {
    icon: MapPin,
    color: "var(--brand-pink)",
    bg: "rgba(255,61,154,0.08)",
    title: "Press & Media",
    desc: "Media inquiries, press kits, and interview requests.",
    contact: "press@auditsmart.org",
    href: "mailto:press@auditsmart.org",
  },
];

const SOCIAL = [
  { name: "Twitter / X", icon: FaTwitter, href: "https://x.com/auditsmart1", desc: "Latest updates & security news" },
  { name: "LinkedIn", icon: FaLinkedin, href: "https://www.linkedin.com/company/audit-smart/", desc: "Company announcements" },
  { name: "Telegram", icon: FaTelegram, href: "https://t.me/auditsmart1", desc: "Community chat" },
  { name: "Discord", icon: FaDiscord, href: "https://discord.gg/BHJNbEtxC", desc: "Developer community" },
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

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setSubmitting(false);
    toast.success("Message sent! We'll reply within 24 hours.");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "'Satoshi', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-2xl mx-auto relative">
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
          >
            Get in Touch
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Have a question, partnership idea, or need enterprise pricing? We typically respond within 24 hours.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid lg:grid-cols-[1fr_420px] gap-12">
          {/* Form */}
          <div>
            <div
              className="rounded-2xl p-8"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
            >
              {sent ? (
                <div className="text-center py-12">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ background: "rgba(0,255,148,0.1)", border: "2px solid rgba(0,255,148,0.3)" }}
                  >
                    <CheckCircle size={30} style={{ color: "var(--brand-green)" }} />
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Message Sent!</h2>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Thanks for reaching out. We&apos;ll get back to you at <strong style={{ color: "var(--text-secondary)" }}>{form.email}</strong> within 24 hours.
                  </p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    className="mt-6 text-sm font-semibold underline"
                    style={{ color: "var(--brand)" }}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Send a Message</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                        Name <span style={{ color: "var(--brand)" }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Alex Chen"
                        style={inputStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                        Email <span style={{ color: "var(--brand)" }}>*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        style={inputStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Subject
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="Enterprise pricing inquiry"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Message <span style={{ color: "var(--brand)" }}>*</span>
                    </label>
                    <textarea
                      rows={6}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us how we can help..."
                      style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                      required
                    />
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
                    {submitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5">
            {/* Response time */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(0,255,148,0.04)", border: "1px solid rgba(0,255,148,0.15)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} style={{ color: "var(--brand-green)" }} />
                <span className="text-sm font-bold" style={{ color: "var(--brand-green)" }}>Fast Response Times</span>
              </div>
              <div className="space-y-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <div className="flex justify-between"><span>General inquiries</span><span className="font-medium" style={{ color: "var(--text-secondary)" }}>&lt; 24h</span></div>
                <div className="flex justify-between"><span>Sales & enterprise</span><span className="font-medium" style={{ color: "var(--text-secondary)" }}>&lt; 4h</span></div>
                <div className="flex justify-between"><span>Security reports</span><span className="font-medium" style={{ color: "var(--text-secondary)" }}>&lt; 2h</span></div>
              </div>
            </div>

            {/* Contact options */}
            <div className="space-y-3">
              {CONTACT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <a
                    key={opt.title}
                    href={opt.href}
                    className="flex items-start gap-3 p-4 rounded-xl transition-all group block"
                    style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: opt.bg }}
                    >
                      <Icon size={16} style={{ color: opt.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{opt.title}</div>
                      <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{opt.desc}</div>
                      <div className="text-xs font-medium" style={{ color: opt.color }}>{opt.contact}</div>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Socials */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
            >
              <h3 className="text-sm font-bold mb-4" style={{ color: "var(--text-primary)" }}>Find Us Online</h3>
              <div className="grid grid-cols-2 gap-2">
                {SOCIAL.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg transition-all"
                      style={{ background: "var(--elevated)", border: "1px solid var(--border)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                    >
                      <Icon size={14} style={{ color: "var(--text-muted)" }} />
                      <div>
                        <div className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{s.name}</div>
                        <div className="text-[10px]" style={{ color: "var(--text-disabled)" }}>{s.desc}</div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
