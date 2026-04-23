'use client';

/**
 * useIdleCuriosity — after 30 s of zero user interaction, the graph starts
 * sending spontaneous `preFire` pulses along random edges every 6–10 s.
 *
 * Behaviour:
 *   - A 30 s inactivity timer resets on any pointer or keyboard event.
 *   - Once idle, a random visible edge is chosen each cycle and `preFire`
 *     is called on its source node so the shimmer ripples out naturally.
 *   - Any user interaction immediately cancels the idle loop and restarts
 *     the 30 s countdown.
 *   - Entirely disabled when `isReducedMotion` is true (motion spec) or
 *     when the tour is active (tour drives its own camera/pulses).
 *   - Does nothing server-side — the `typeof window` guard keeps it safe
 *     for SSR even though page.tsx is a client component.
 */

import { useEffect, useRef } from 'react';

import { useHudStore } from '@/store/useHudStore';
import { useGraphStore } from '@/store/useGraphStore';
import { preFire } from '@/hooks/useChainReaction';

/** Inactivity threshold before idle pulses begin (ms). */
const IDLE_THRESHOLD_MS = 30_000;

/** Random interval between curiosity pulses (ms). */
const PULSE_MIN_MS = 6_000;
const PULSE_MAX_MS = 10_000;

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export default function useIdleCuriosity() {
  const isReducedMotion = useHudStore((s) => s.isReducedMotion);
  const isTourActive = useHudStore((s) => s.isTourActive);

  // Refs so the timer callbacks always close over the latest values
  // without needing them in dependency arrays.
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false); // true while the idle loop is running

  const clearAll = () => {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (pulseTimerRef.current !== null) {
      clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = null;
    }
    activeRef.current = false;
  };

  const schedulePulse = () => {
    if (!activeRef.current) return;

    const { connections, positions } = useGraphStore.getState();

    // Only use connections whose both endpoints have settled positions.
    const live = connections.filter(
      (c) => positions.has(c.sourceId) && positions.has(c.targetId),
    );
    if (live.length === 0) return;

    // Pick a random edge and shimmer from its source.
    const edge = live[Math.floor(Math.random() * live.length)];
    preFire(edge.sourceId);

    // Schedule the next pulse.
    pulseTimerRef.current = setTimeout(
      schedulePulse,
      randomBetween(PULSE_MIN_MS, PULSE_MAX_MS),
    );
  };

  const startIdle = () => {
    activeRef.current = true;
    schedulePulse();
  };

  const resetIdleCountdown = () => {
    clearAll();
    // Restart the 30 s countdown for the next idle window.
    idleTimerRef.current = setTimeout(startIdle, IDLE_THRESHOLD_MS);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isReducedMotion || isTourActive) {
      clearAll();
      return;
    }

    const onInteraction = () => resetIdleCountdown();

    window.addEventListener('pointermove', onInteraction);
    window.addEventListener('pointerdown', onInteraction);
    window.addEventListener('keydown', onInteraction);

    // Start the initial countdown.
    idleTimerRef.current = setTimeout(startIdle, IDLE_THRESHOLD_MS);

    return () => {
      clearAll();
      window.removeEventListener('pointermove', onInteraction);
      window.removeEventListener('pointerdown', onInteraction);
      window.removeEventListener('keydown', onInteraction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReducedMotion, isTourActive]);
}
