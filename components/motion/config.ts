// components/motion/config.ts — Animation design tokens

export const spring = {
  gentle:   { type: 'spring' as const, stiffness: 100, damping: 20, mass: 1 },
  snappy:   { type: 'spring' as const, stiffness: 360, damping: 28, mass: 0.8 },
  cinematic:{ type: 'spring' as const, stiffness: 70,  damping: 22, mass: 1.4 },
  slow:     { type: 'spring' as const, stiffness: 55,  damping: 18, mass: 1.2 },
  micro:    { type: 'spring' as const, stiffness: 600, damping: 36, mass: 0.6 },
};

export const ease = {
  smooth:    [0.25, 0.10, 0.25, 1.00] as const,
  expo:      [0.16, 1.00, 0.30, 1.00] as const,
  cinematic: [0.77, 0.00, 0.18, 1.00] as const,
  gentle:    [0.43, 0.13, 0.23, 0.96] as const,
  sharp:     [0.32, 0.00, 0.67, 0.00] as const,
};

export const dur = {
  instant:   0.10,
  fast:      0.20,
  normal:    0.40,
  medium:    0.60,
  slow:      0.80,
  cinematic: 1.20,
};

export const stagger = {
  xs:   0.04,
  sm:   0.07,
  md:   0.11,
  lg:   0.18,
  xl:   0.25,
};

// Shared motion variants — compose via `variants` prop
export const variants = {
  reveal: {
    hidden:  { opacity: 0, y: 28, filter: 'blur(4px)' },
    visible: { opacity: 1, y: 0,  filter: 'blur(0px)' },
  },
  fadeUp: {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0  },
  },
  fade: {
    hidden:  { opacity: 0 },
    visible: { opacity: 1 },
  },
  scale: {
    hidden:  { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1    },
  },
  slideLeft: {
    hidden:  { opacity: 0, x: -32 },
    visible: { opacity: 1, x: 0   },
  },
  slideRight: {
    hidden:  { opacity: 0, x: 32 },
    visible: { opacity: 1, x: 0  },
  },
  container: {
    hidden:  {},
    visible: { transition: { staggerChildren: stagger.md } },
  },
  containerFast: {
    hidden:  {},
    visible: { transition: { staggerChildren: stagger.sm } },
  },
};
