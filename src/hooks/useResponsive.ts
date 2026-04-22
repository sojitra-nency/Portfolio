'use client';

/**
 * useResponsive — detects environment capabilities and writes them to
 * `useHudStore` so any consumer (EffectsStack, StarField, EnergyParticles,
 * CinemaCamera, pointer magnetism, etc.) can read a single source of
 * truth instead of each detecting independently.
 *
 * Detects:
 * - **isMobile**   — `window.innerWidth < 768`. Re-evaluated on resize.
 * - **isReducedMotion** — `prefers-reduced-motion: reduce` via matchMedia.
 *   Reactive to OS-level accessibility toggles.
 * - **gpuTier**    — 0 | 1 | 2 | 3 resolved asynchronously via
 *   `detect-gpu`. Defaults to 2 until resolution; then narrowed.
 *
 * Mount once from a top-level client component (page.tsx at Task 24).
 */

import { useEffect } from 'react';
import { getGPUTier } from 'detect-gpu';

import { useHudStore } from '@/store/useHudStore';

const MOBILE_BREAKPOINT = 768;

export default function useResponsive(): void {
  useEffect(() => {
    const { setMobile, setReducedMotion, setGpuTier } = useHudStore.getState();

    // ── Viewport ────────────────────────────────────────────────────────
    const updateMobile = () => {
      setMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    updateMobile();
    window.addEventListener('resize', updateMobile);

    // ── Reduced motion ──────────────────────────────────────────────────
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    const onMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    motionQuery.addEventListener('change', onMotionChange);

    // ── GPU tier (async) ────────────────────────────────────────────────
    let cancelled = false;
    getGPUTier()
      .then((result) => {
        if (cancelled) return;
        const raw = result.tier ?? 2;
        const clamped = Math.max(0, Math.min(3, raw)) as 0 | 1 | 2 | 3;
        setGpuTier(clamped);
      })
      .catch(() => {
        // Detection failure → fall through on the default (tier 2).
      });

    // ── Cleanup ─────────────────────────────────────────────────────────
    return () => {
      cancelled = true;
      window.removeEventListener('resize', updateMobile);
      motionQuery.removeEventListener('change', onMotionChange);
    };
  }, []);
}
