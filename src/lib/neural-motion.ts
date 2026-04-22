/**
 * Neural View motion tokens — the single source of truth for timing,
 * easing, and Framer Motion variants across the immersive experience.
 *
 * Every variant is a **factory** (`(reducedMotion?: boolean) => Variants`)
 * so consumers can honour `prefers-reduced-motion` at the call site by
 * passing the flag from `useResponsive` / `useReducedMotion`. The instant
 * form collapses transitions to `duration: 0` and strips keyframes so
 * content appears without motion — but without tearing the component tree.
 *
 * Usage:
 * ```tsx
 * const reduced = useReducedMotion();
 * <motion.div variants={hudEnter(reduced)} initial="hidden" animate="visible" />
 * ```
 */

import { type Variants } from 'framer-motion';

// ---------------------------------------------------------------------------
// 1. Easing curves
// ---------------------------------------------------------------------------

/**
 * Signature easing of the Neural View — an "out-expo" curve that decelerates
 * sharply, giving motion an effortless, cinematic quality. Best for
 * entrances, camera focus transitions, and large surface reveals.
 */
export const EASE_EXPO: readonly [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Softer "out-cubic" easing for small, frequent motions — chain-reaction
 * hops, tag reveals, pulse decays. Less dramatic than {@link EASE_EXPO}.
 */
export const EASE_CUBIC_OUT: readonly [number, number, number, number] = [0.33, 1, 0.68, 1];

// ---------------------------------------------------------------------------
// 2. Duration tokens (seconds — matches Framer Motion convention)
// ---------------------------------------------------------------------------

/** Instant white spike when a neuron is clicked ("firing"). 60 ms. */
export const FIRE_FLASH = 0.06;

/** Expanding halo ring immediately after a fire flash. 350 ms. */
export const SHOCKWAVE = 0.35;

/** Duration of a single hop as the chain reaction propagates outward. 180 ms. */
export const HOP = 0.18;

/** Camera transition from ambient to focus mode. 900 ms. */
export const FOCUS = 0.9;

/** DetailCard surface-in animation. 550 ms. */
export const DETAIL_SURFACE = 0.55;

/** Cluster children materializing once their parent is focused. 700 ms. */
export const CLUSTER_MATERIALIZE = 0.7;

/** One full cycle of idle breathing on neurons and HUD beacons. 3.2 s. */
export const BREATHE = 3.2;

/** Glitch-reveal duration for newly-unlocked hidden nodes. 1.2 s. */
export const UNLOCK_GLITCH = 1.2;

/** Corner HUD fade-in after the boot sequence completes. 600 ms. */
export const HUD_ENTER = 0.6;

// ---------------------------------------------------------------------------
// 3. Variant factory contract
// ---------------------------------------------------------------------------

/**
 * Shape every Neural-View motion variant implements. Passing `true` for
 * `reducedMotion` returns the instant form; passing `false` (default)
 * returns the full animated variant.
 */
export type NeuralVariants = (reducedMotion?: boolean) => Variants;

// ---------------------------------------------------------------------------
// 4. Variants
// ---------------------------------------------------------------------------

/**
 * Corner HUD entrance. Fades in with a subtle 8-pixel rise.
 *
 * Use for `CornerHUD`, `CoherenceMeter`, `NeuralMap` — any element that
 * should appear once `BootSequence` completes. Bound to {@link HUD_ENTER}.
 */
export const hudEnter: NeuralVariants = (reducedMotion = false) => {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: HUD_ENTER, ease: EASE_EXPO },
    },
  };
};

/**
 * DetailCard surface-in — the cinematic card that rises after a neuron is
 * focused. Combines opacity, a subtle upward translation, and a gentle
 * scale. The corner L-brackets animate independently inside the card.
 * Bound to {@link DETAIL_SURFACE}.
 */
export const detailSurface: NeuralVariants = (reducedMotion = false) => {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0 } },
      exit: { opacity: 0, transition: { duration: 0 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: DETAIL_SURFACE, ease: EASE_EXPO },
    },
    exit: {
      opacity: 0,
      y: 12,
      scale: 0.98,
      transition: { duration: 0.3, ease: EASE_CUBIC_OUT },
    },
  };
};

/**
 * CommTooltip reveal — small pill that appears near the cursor (or
 * top-center on mobile) with a subtle scale + fade. Used for onboarding
 * hints and guided-tour narration.
 */
export const commTooltipReveal: NeuralVariants = (reducedMotion = false) => {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0 } },
      exit: { opacity: 0, transition: { duration: 0 } },
    };
  }
  return {
    hidden: { opacity: 0, scale: 0.85, y: 4 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.35, ease: EASE_EXPO },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 4,
      transition: { duration: 0.25, ease: EASE_CUBIC_OUT },
    },
  };
};

/**
 * Glitch-materialize for newly-unlocked hidden nodes at the DOM layer.
 *
 * Three-stage keyframe reveal combining opacity, blur, saturation/hue
 * (chromatic hint), and scale — simulating a signal locking in after
 * static. Bound to {@link UNLOCK_GLITCH}.
 *
 * For the WebGL-side unlock effect on the actual 3D neuron, see
 * `UnlockReveal.tsx` (Task 31) which runs in shader space instead.
 */
export const glitchMaterialize: NeuralVariants = (reducedMotion = false) => {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0 } },
    };
  }
  return {
    hidden: {
      opacity: 0,
      scale: 0.6,
      filter: 'blur(14px) saturate(1.6) hue-rotate(30deg)',
    },
    visible: {
      opacity: [0, 0.55, 0.35, 1],
      scale: [0.6, 1.1, 0.92, 1],
      filter: [
        'blur(14px) saturate(1.6) hue-rotate(30deg)',
        'blur(3px) saturate(1.2) hue-rotate(-15deg)',
        'blur(6px) saturate(1.4) hue-rotate(10deg)',
        'blur(0px) saturate(1) hue-rotate(0deg)',
      ],
      transition: {
        duration: UNLOCK_GLITCH,
        times: [0, 0.4, 0.65, 1],
        ease: EASE_CUBIC_OUT,
      },
    },
  };
};

/**
 * BootSequence line reveal — used for typewriter telemetry lines on entry.
 * Each line fades in with a 4-pixel rise. Stagger is handled externally
 * via the parent container's `staggerChildren` / `delayChildren`.
 */
export const bootLineReveal: NeuralVariants = (reducedMotion = false) => {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 4 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: EASE_CUBIC_OUT },
    },
  };
};

/**
 * Shockwave ring — expanding halo that fires immediately after a neuron
 * click. Scales 1× → 4× while fading from 0.8 alpha → 0 in a single
 * gesture. Apply to an absolutely-positioned ring anchored on the fired
 * node. Bound to {@link SHOCKWAVE}.
 */
export const shockwaveRing: NeuralVariants = (reducedMotion = false) => {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0, scale: 1 },
      visible: { opacity: 0, scale: 1, transition: { duration: 0 } },
    };
  }
  return {
    hidden: { opacity: 0.8, scale: 1 },
    visible: {
      opacity: 0,
      scale: 4,
      transition: { duration: SHOCKWAVE, ease: EASE_EXPO },
    },
  };
};
