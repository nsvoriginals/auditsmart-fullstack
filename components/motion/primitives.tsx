"use client";
// components/motion/primitives.tsx — Reusable animation building blocks

import React, { useRef, type ReactNode, type CSSProperties } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  type Variants,
  type MotionProps,
} from "framer-motion";
import { dur, ease, spring, variants } from "./config";

// ── View trigger defaults ──────────────────────────────────────────────────

const DEFAULT_VIEWPORT = { once: true, margin: "-60px" };

// ── Reveal ─────────────────────────────────────────────────────────────────
// Fade + slide + blur on scroll entry. The workhorse reveal primitive.

interface RevealProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  duration?: number;
  y?: number;
  blur?: boolean;
  once?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
}

export function Reveal({
  children,
  className,
  style,
  delay = 0,
  duration = dur.medium,
  y = 24,
  blur = true,
  once = true,
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-60px" });

  const hidden: MotionProps["animate"] = {
    opacity: 0,
    y,
    filter: blur ? "blur(6px)" : "blur(0px)",
  };
  const visible: MotionProps["animate"] = {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  };

  const Tag = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <Tag
      ref={ref}
      className={className}
      style={style}
      initial={hidden}
      animate={inView ? visible : hidden}
      transition={{ duration, ease: ease.expo, delay }}
    >
      {children}
    </Tag>
  );
}

// ── StaggerReveal ──────────────────────────────────────────────────────────
// Wraps children so they stagger-reveal on scroll entry.

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  staggerDelay?: number;
  delay?: number;
  childVariants?: Variants;
  once?: boolean;
}

export function StaggerReveal({
  children,
  className,
  style,
  staggerDelay = 0.10,
  delay = 0,
  childVariants = variants.fadeUp,
  once = true,
}: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay, delayChildren: delay } },
      }}
    >
      {React.Children.map(children, (child) =>
        child ? (
          <motion.div
            variants={childVariants}
            transition={{ duration: dur.medium, ease: ease.expo }}
          >
            {child}
          </motion.div>
        ) : null
      )}
    </motion.div>
  );
}

// ── Parallax ───────────────────────────────────────────────────────────────
// Vertical parallax driven by container scroll.

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  speed?: number; // positive = slower, negative = faster
}

export function Parallax({ children, className, speed = 0.3 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`${-speed * 100}px`, `${speed * 100}px`]);

  return (
    <div ref={ref} className={className} style={{ overflow: "hidden" }}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

// ── HoverLift ─────────────────────────────────────────────────────────────
// Subtle lift + border glow on hover. Use on cards.

interface HoverLiftProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  liftY?: number;
}

export function HoverLift({ children, className, style, liftY = -4 }: HoverLiftProps) {
  return (
    <motion.div
      className={className}
      style={style}
      whileHover={{ y: liftY, transition: spring.snappy }}
      whileTap={{ scale: 0.98, transition: spring.micro }}
    >
      {children}
    </motion.div>
  );
}

// ── MagneticButton ────────────────────────────────────────────────────────
// Magnet effect — element follows cursor within its bounds.

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

export function MagneticButton({ children, className, strength = 0.3 }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;
    ref.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)", display: "inline-block" }}
    >
      {children}
    </div>
  );
}

// ── RevealLine ────────────────────────────────────────────────────────────
// Animated horizontal rule that expands from left on scroll.

export function RevealLine({ className, delay = 0 }: { className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} className={`overflow-hidden ${className ?? ""}`}>
      <motion.div
        className="h-px w-full origin-left"
        style={{ background: "var(--border-strong)" }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: inView ? 1 : 0 }}
        transition={{ duration: dur.cinematic, ease: ease.expo, delay }}
      />
    </div>
  );
}

// ── CountUp ───────────────────────────────────────────────────────────────
// Number that counts up when in view.

interface CountUpProps {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}

export function CountUp({ value, suffix = "", prefix = "", className, duration: d = 1.8 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      <motion.span>
        {inView && (
          <Counter from={0} to={value} duration={d} />
        )}
        {!inView && "0"}
      </motion.span>
      {suffix}
    </motion.span>
  );
}

function Counter({ from, to, duration: d }: { from: number; to: number; duration: number }) {
  const [count, setCount] = React.useState(from);

  React.useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / (d * 1000);
      const progress = Math.min(elapsed, 1);
      // Ease out expo
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [from, to, d]);

  return <>{count}</>;
}

// ── MotionDiv ─────────────────────────────────────────────────────────────
// Typed re-export of motion.div for convenience.

export { motion };
