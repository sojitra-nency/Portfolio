'use client';

/**
 * BootSequence — the Neural View's terminal-style entry animation.
 *
 * Phases (non-reduced-motion):
 *   1. `pulse`   (0 – 600 ms)  — a single cyan dot breathes at center,
 *                                 scale 0 → 1 → 0.
 *   2. `typing`  (≈ 5 s)       — the five telemetry lines type in at
 *                                 40 ms / char, sequential line-by-line.
 *   3. `ready`                 — the overlay waits for the user to press
 *                                 any key or click anywhere.
 *   4. `flash`   (120 ms)      — a full-screen white opacity-1 sheet,
 *                                 then `useHudStore.setBootComplete(true)`
 *                                 so the parent can unmount us.
 *
 * Skip-to-dismiss: clicks or keydowns during `pulse` / `typing` jump
 * straight to the flash phase — no one wants to wait through a 5-second
 * boot on reload.
 *
 * Reduced motion: the `pulse` and `typing` phases are skipped. Everything
 * renders instantly; dismissal bypasses the flash and calls
 * `setBootComplete(true)` directly.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { useHudStore } from '@/store/useHudStore';
import { useReducedMotion } from '@/lib/animations';
import { EASE_EXPO } from '@/lib/neural-motion';

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

const LINES = [
  '> INITIALIZING SYNAPTIC MATRIX…',
  '> Mapping 77 neurons',
  '> Routing 115 synapses',
  '> Calibrating signal strength',
  '> READY. ◂ PRESS TO ENTER ▸',
] as const;

const TYPE_DELAY_MS = 40;
const PULSE_DURATION = 0.6; // seconds
const FLASH_DURATION = 120; // ms

type Phase = 'pulse' | 'typing' | 'ready' | 'flash';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BootSequence() {
  const reducedMotion = useReducedMotion();

  // Reduced motion jumps straight to "ready" — no pulse, no typewriter.
  const [phase, setPhase] = useState<Phase>(() =>
    reducedMotion ? 'ready' : 'pulse',
  );
  const [charsSoFar, setCharsSoFar] = useState<number>(() =>
    reducedMotion
      ? LINES.reduce((sum, l) => sum + l.length, 0) // all visible
      : 0,
  );

  // Per-line cumulative char offsets — computed once, used in the render.
  const lineOffsets = useMemo(() => {
    const offsets: number[] = [];
    let acc = 0;
    for (const line of LINES) {
      offsets.push(acc);
      acc += line.length;
    }
    return offsets;
  }, []);
  const totalChars = useMemo(
    () => LINES.reduce((sum, l) => sum + l.length, 0),
    [],
  );

  // ── Typewriter tick ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'typing') return;
    if (charsSoFar >= totalChars) {
      setPhase('ready');
      return;
    }
    const t = window.setTimeout(
      () => setCharsSoFar((c) => c + 1),
      TYPE_DELAY_MS,
    );
    return () => window.clearTimeout(t);
  }, [phase, charsSoFar, totalChars]);

  // ── Dismiss handlers ──────────────────────────────────────────────────
  const handleDismiss = useCallback(() => {
    if (phase === 'flash') return;
    if (reducedMotion) {
      useHudStore.getState().setBootComplete(true);
      return;
    }
    setPhase('flash');
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (phase === 'flash') return;
    const onKey = () => handleDismiss();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, handleDismiss]);

  // ── Flash → setBootComplete ────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'flash') return;
    const t = window.setTimeout(() => {
      useHudStore.getState().setBootComplete(true);
    }, FLASH_DURATION);
    return () => window.clearTimeout(t);
  }, [phase]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      onClick={handleDismiss}
      role="button"
      aria-label="Press to enter Neural Nexus"
      tabIndex={0}
    >
      {/* Phase 1 — center pulse */}
      {phase === 'pulse' && (
        <motion.div
          className="h-4 w-4 rounded-full bg-[var(--synapse)]"
          style={{
            boxShadow: '0 0 48px rgba(124, 211, 255, 0.9)',
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: [0, 1, 0], opacity: [1, 1, 0] }}
          transition={{
            duration: PULSE_DURATION,
            ease: EASE_EXPO,
            times: [0, 0.5, 1],
          }}
          onAnimationComplete={() => setPhase('typing')}
        />
      )}

      {/* Phases 2/3 — terminal lines */}
      {phase !== 'pulse' && (
        <div className="font-mono-hud text-[13px] text-[var(--synapse)] w-full max-w-xl px-8 space-y-2">
          {LINES.map((line, i) => {
            const offset = lineOffsets[i];
            const remaining = charsSoFar - offset;
            if (remaining <= 0 && !reducedMotion) return null;
            const shown = Math.min(line.length, remaining);
            const isTyping = !reducedMotion && shown < line.length;
            const isReadyLine =
              i === LINES.length - 1 && shown === line.length;
            return (
              <motion.div
                key={i}
                initial={
                  reducedMotion ? false : { opacity: 0, y: 4 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: EASE_EXPO }}
                className={
                  isReadyLine
                    ? 'text-white font-medium'
                    : 'text-white/80'
                }
              >
                <span>{reducedMotion ? line : line.slice(0, shown)}</span>
                {isTyping && (
                  <motion.span
                    aria-hidden
                    className="ml-[1px] inline-block"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    ▋
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Phase 4 — white flash (skipped on reduced motion) */}
      {phase === 'flash' && !reducedMotion && (
        <motion.div
          className="absolute inset-0 bg-white pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: FLASH_DURATION / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}
