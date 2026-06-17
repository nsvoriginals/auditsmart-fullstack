// @ts-nocheck — vendored animate-ui (authored for React 19); ref types mismatch React 18 @types but runtime is fine
'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

import { Slot, type WithAsChild } from '@/components/workspace/components/animate-ui/primitives/animate/slot';

type ButtonProps = WithAsChild<
  HTMLMotionProps<'button'> & {
    hoverScale?: number;
    tapScale?: number;
  }
>;

function Button({
  hoverScale = 1.05,
  tapScale = 0.95,
  asChild = false,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : motion.button;

  return (
    <Component
      whileTap={{ scale: tapScale }}
      whileHover={{ scale: hoverScale }}
      {...props}
    />
  );
}

export { Button, type ButtonProps };