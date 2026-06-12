"use client";
// components/sections/home/cta.tsx — Final conversion section

import Link from "next/link";
import { motion } from "framer-motion";
import { ease, dur } from "@/components/motion/config";
import { Reveal, MagneticButton } from "@/components/motion/primitives";
import { ArrowRight, Shield } from "lucide-react";

interface CTAProps {
  isAuthed: boolean;
}

export function CTASection({ isAuthed }: CTAProps) {
  return (
    <section className="relative py-40 overflow-hidden" style={{ background: "var(--background)" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "var(--border)" }} />

      {/* Atmospheric glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.08) 0%, rgba(123,47,255,0.04) 30%, transparent 70%)",
        }}
      />

      <div className="max-w-4xl mx-auto px-6 sm:px-10 text-center relative z-10">

        {/* Icon */}
        <motion.div
          className="flex items-center justify-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: dur.medium, ease: ease.expo }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(123,47,255,0.15))",
              border: "1px solid rgba(0,212,255,0.2)",
              boxShadow: "0 0 60px rgba(0,212,255,0.15)",
            }}
          >
            <Shield className="w-9 h-9" style={{ color: "#00d4ff" }} />
          </div>
        </motion.div>

        {/* Headline */}
        <Reveal>
          <h2
            className="text-[clamp(2.8rem,7vw,7rem)] font-black uppercase leading-[0.88] tracking-tight mb-8"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne)" }}
          >
            AUDIT YOUR<br />CONTRACT NOW.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="text-lg leading-relaxed mb-12 max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Free to start. No credit card. Results in under 60 seconds.
            Join security researchers and protocol teams who trust AuditSmart.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <MagneticButton>
              <Link
                href={isAuthed ? "/dashboard" : "/register"}
                className="group inline-flex items-center gap-2 px-10 py-4 rounded-full font-bold text-base tracking-wide transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #00d4ff, #7b2fff)",
                  color: "#fff",
                  boxShadow: "0 0 60px rgba(0,212,255,0.3)",
                }}
              >
                {isAuthed ? "Go to Dashboard" : "Start Free Audit"}
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
