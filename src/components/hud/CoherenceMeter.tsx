'use client';

/**
 * CoherenceMeter — bottom-left circular progress ring showing the
 * user's exploration percent from `useExplorationStore`. Hidden entirely
 * until the first visit (`percent > 0`); fades in with `hudEnter` on
 * first appearance.
 *
 * Milestones at 25 / 50 / 75 / 100 % each trigger:
 *   - A full-canvas white ring rippling outward from screen center.
 *   - A "COHERENCE: N%" banner that slides in/out for ~2 s near the top.
 *
 * Milestone tracking uses a ref so each threshold only fires once across
 * the session — re-renders on the same percent don't re-trigger.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { useExplorationStore } from '@/store/useExplorationStore';
import { useHudStore } from '@/store/useHudStore';
import { CATEGORY_COLORS } from '@/data/types';
import { EASE_EXPO, hudEnter } from '@/lib/neural-motion';

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

const SIZE = 120;
const CENTER = SIZE / 2;
const STROKE_WIDTH = 4;
const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const MILESTONES = [25, 50, 75, 100] as const;
const RIPPLE_DURATION = 1.4; // s — matches the motion transition below
const BANNER_DURATION = 2000; // ms the banner stays mounted

const SKILLS_COLOR = CATEGORY_COLORS.skills;

// ---------------------------------------------------------------------------
// Full-canvas ripple
// ---------------------------------------------------------------------------

/**
 * An SVG overlay whose `viewBox="0 0 100 100"` is stretched across the
 * viewport via `preserveAspectRatio="xMidYMid slice"`. The motion.circle
 * animates `r` from 0 → 120 — well beyond the viewBox — so the stroke
 * sweeps across the entire screen regardless of aspect ratio.
 */
function Ripple({ reducedMotion }: { reducedMotion: boolean }) {
  // Reduced motion — skip the expanding-ring visual. The milestone
  // banner + aria-live announcement still surface the event for all
  // users; the ripple is purely decorative.
  if (reducedMotion) return null;
  return (
    <svg
      className="fixed inset-0 z-40 h-full w-full pointer-events-none"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 100 100"
      aria-hidden
    >
      <motion.circle
        cx="50"
        cy="50"
        fill="none"
        stroke="white"
        strokeWidth={0.35}
        initial={{ r: 0, opacity: 0.85 }}
        animate={{ r: 120, opacity: 0 }}
        transition={{ duration: RIPPLE_DURATION, ease: 'easeOut' }}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Milestone banner
// ---------------------------------------------------------------------------

function MilestoneBanner({
  value,
  reducedMotion,
}: {
  value: number;
  reducedMotion: boolean;
}) {
  const enter = reducedMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0 };
  const initial = reducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -16 };
  const exit = reducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -16 };
  return (
    <motion.div
      className="fixed inset-x-0 top-24 z-50 flex justify-center pointer-events-none"
      initial={initial}
      animate={enter}
      exit={exit}
      transition={{
        duration: reducedMotion ? 0 : 0.3,
        ease: EASE_EXPO,
      }}
      role="status"
      aria-live="polite"
    >
      <div
        className="flex items-center gap-2.5 rounded-full border border-[color:var(--synapse)]/40 bg-[color:var(--void-warm)]/85 backdrop-blur-lg px-5 py-2"
        style={{ boxShadow: '0 0 32px rgba(124, 211, 255, 0.35)' }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full bg-[var(--synapse)] animate-neural-pulse"
          aria-hidden
        />
        <span className="font-mono-hud text-xs uppercase tracking-[0.22em] text-white">
          COHERENCE:{' '}
          <span className="tabular-nums text-[color:var(--synapse)]">
            {value}%
          </span>
        </span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function CoherenceMeter() {
  const percent = useExplorationStore((s) => s.explorationPercent);
  const reducedMotion = useHudStore((s) => s.isReducedMotion);

  const [bannerValue, setBannerValue] = useState<number | null>(null);
  const [rippleKey, setRippleKey] = useState<number | null>(null);
  const lastMilestoneRef = useRef(0);

  // Detect threshold crossings. Only fires once per milestone, per session.
  useEffect(() => {
    const hit = MILESTONES.reduce<number>(
      (max, t) => (percent >= t ? t : max),
      0,
    );
    if (hit <= lastMilestoneRef.current) return;
    lastMilestoneRef.current = hit;

    setBannerValue(hit);
    setRippleKey(hit);

    const rippleTimer = window.setTimeout(
      () => setRippleKey(null),
      RIPPLE_DURATION * 1000,
    );
    const bannerTimer = window.setTimeout(
      () => setBannerValue(null),
      BANNER_DURATION,
    );
    return () => {
      window.clearTimeout(rippleTimer);
      window.clearTimeout(bannerTimer);
    };
  }, [percent]);

  if (percent <= 0) return null;

  const dashoffset = CIRCUMFERENCE * (1 - percent / 100);

  return (
    <>
      <motion.div
        variants={hudEnter(reducedMotion)}
        initial="hidden"
        animate="visible"
        className="fixed bottom-6 left-6 z-30 pointer-events-none"
      >
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <defs>
              <linearGradient
                id="coherence-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="var(--synapse)" />
                <stop offset="100%" stopColor={SKILLS_COLOR} />
              </linearGradient>
            </defs>

            {/* Background ring — gray 10%. */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="white"
              strokeOpacity={0.1}
              strokeWidth={STROKE_WIDTH}
            />

            {/* Progress ring — synapse → skills gradient. Rotated -90°
                around the center so 0% starts at 12 o'clock. */}
            <motion.circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="url(#coherence-gradient)"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: dashoffset }}
              transition={{
                duration: reducedMotion ? 0 : 1,
                ease: EASE_EXPO,
              }}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: `${CENTER}px ${CENTER}px`,
              }}
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono-hud text-[22px] font-semibold leading-none text-white tabular-nums">
              {percent}%
            </span>
            <span className="mt-1 font-mono-hud text-[8px] uppercase tracking-[0.24em] text-gray-400">
              NEURAL
            </span>
            <span className="font-mono-hud text-[8px] uppercase tracking-[0.24em] text-gray-400">
              COHERENCE
            </span>
          </div>
        </div>
      </motion.div>

      {/* Ripple — keyed so each milestone remounts a fresh SVG. */}
      {rippleKey !== null && (
        <Ripple key={rippleKey} reducedMotion={reducedMotion} />
      )}

      {/* Banner — AnimatePresence runs the exit slide-out when unmounted. */}
      <AnimatePresence>
        {bannerValue !== null && (
          <MilestoneBanner
            key={bannerValue}
            value={bannerValue}
            reducedMotion={reducedMotion}
          />
        )}
      </AnimatePresence>

      {/* aria-live announcement for the current coherence percent —
          ensures screen-reader users hear milestone changes even when
          the ripple + banner are suppressed. */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        Neural coherence at {percent} percent.
      </div>
    </>
  );
}
