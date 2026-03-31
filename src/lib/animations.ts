'use client';

import { type Variants } from 'framer-motion';
import { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// 1. Scroll-reveal variants
// ---------------------------------------------------------------------------

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT_EXPO },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT_EXPO },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: EASE_OUT_EXPO },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: EASE_OUT_EXPO },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: EASE_OUT_EXPO },
  },
};

// ---------------------------------------------------------------------------
// 2. Container variants for staggering children
// ---------------------------------------------------------------------------

export const staggerContainer = (
  staggerDelay = 0.08,
  delayChildren = 0.1,
): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: staggerDelay, delayChildren },
  },
});

// ---------------------------------------------------------------------------
// 3. Shared viewport config
// ---------------------------------------------------------------------------

export const viewportConfig = {
  once: true,
  amount: 0.15,
  margin: '-50px' as const,
};

// ---------------------------------------------------------------------------
// 4. Card hover variants
// ---------------------------------------------------------------------------

export const cardHover: Variants = {
  rest: { scale: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

// ---------------------------------------------------------------------------
// 5. Glow hover factory (dynamic color)
// ---------------------------------------------------------------------------

export const glowHover = (color: string): Variants => ({
  rest: { boxShadow: `0 0 0px ${color}00` },
  hover: {
    boxShadow: `0 4px 30px ${color}25`,
    transition: { duration: 0.3 },
  },
});

// ---------------------------------------------------------------------------
// 6. Tag / pill reveal
// ---------------------------------------------------------------------------

export const tagReveal: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: EASE_OUT_EXPO },
  },
};

// ---------------------------------------------------------------------------
// 7. Section heading reveal
// ---------------------------------------------------------------------------

export const headingReveal: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: EASE_OUT_EXPO },
  },
};

// ---------------------------------------------------------------------------
// 8. Hero-specific variants
// ---------------------------------------------------------------------------

export const heroContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

export const heroItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  },
};

// ---------------------------------------------------------------------------
// 9. Counter animation hook
// ---------------------------------------------------------------------------

/**
 * Animates a number from 0 to `target` over `duration` ms once the
 * returned ref's element scrolls into view.
 *
 * Usage:
 * ```tsx
 * const ref = useRef(null);
 * const count = useCountUp(42, 1500);
 * // attach ref to the element wrapping the number
 * ```
 */
export function useCountUp(target: number, duration = 1500): number {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  useEffect(() => {
    if (hasAnimated) return;

    // Start animation immediately (caller is responsible for triggering
    // visibility — this keeps the hook simple and SSR-safe).
    const start = performance.now();

    let frameId: number;

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setHasAnimated(true);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [target, duration, hasAnimated]);

  return count;
}

// ---------------------------------------------------------------------------
// 10. Reduced motion support
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the user has enabled "Reduce motion" in their OS
 * accessibility settings.
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}
