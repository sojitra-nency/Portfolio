'use client';

/**
 * useGuidedTour — walks the TOUR_KEYFRAMES when `useHudStore.isTourActive`.
 *
 * Behaviour:
 *   - Advances through keyframes automatically, dwelling `dwellMs` on each.
 *   - Each step calls `useCinemaStore.focusOn(nodeId)` and sets the
 *     CommTooltip narration via `useHudStore.setCommTooltipText`.
 *   - Any pointer-move or Escape press during the tour calls `cancel()`,
 *     which stops the tour, resets the camera, and clears the tooltip.
 *   - On the final keyframe the tour self-terminates (same as cancel but
 *     without setting commTooltipText to null — the last message stays 3 s
 *     then fades on its own via CommTooltip's auto-clear timeout).
 *   - Reduced motion: dwell time is halved and camera focus is instant
 *     (CinemaCamera already handles the instant-lerp path).
 *
 * Mount once in page.tsx so the hook runs for the lifetime of the session.
 */

import { useEffect, useRef } from 'react';

import { useHudStore } from '@/store/useHudStore';
import { useCinemaStore } from '@/store/useCinemaStore';
import { TOUR_KEYFRAMES } from '@/components/canvas/camera/cameraPaths';

export default function useGuidedTour() {
  const isTourActive = useHudStore((s) => s.isTourActive);
  const isReducedMotion = useHudStore((s) => s.isReducedMotion);

  // Step index and timer ref — kept in refs so the cleanup path always
  // sees the current value without needing them in dependency arrays.
  const stepRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const cancel = () => {
    clearTimer();
    useHudStore.getState().setTourActive(false);
    useHudStore.getState().setCommTooltipText(null);
    useCinemaStore.getState().returnToAmbient();
    stepRef.current = 0;
  };

  // ── Advance to the next keyframe ─────────────────────────────────────
  const advance = (step: number) => {
    if (step >= TOUR_KEYFRAMES.length) {
      // Tour finished — stop gracefully.
      useHudStore.getState().setTourActive(false);
      // Keep the last narration visible briefly; CommTooltip auto-hides it.
      useCinemaStore.getState().returnToAmbient();
      stepRef.current = 0;
      return;
    }

    const kf = TOUR_KEYFRAMES[step];
    stepRef.current = step;

    useCinemaStore.getState().focusOn(kf.nodeId);
    useHudStore.getState().setCommTooltipText(kf.narration);

    const dwell = isReducedMotion ? Math.round(kf.dwellMs / 2) : kf.dwellMs;
    timerRef.current = setTimeout(() => advance(step + 1), dwell);
  };

  // ── React to isTourActive changes ─────────────────────────────────────
  useEffect(() => {
    if (!isTourActive) {
      // If tour was deactivated externally (Esc, Tour button pressed again),
      // clean up whatever dwell timer might be running.
      clearTimer();
      useHudStore.getState().setCommTooltipText(null);
      useCinemaStore.getState().returnToAmbient();
      stepRef.current = 0;
      return;
    }

    // Tour just activated — start from step 0.
    stepRef.current = 0;
    advance(0);

    return () => {
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTourActive]);

  // ── Interaction interrupt listeners ──────────────────────────────────
  // Escape cancels immediately. pointermove only cancels after a 400 ms
  // grace window — this prevents the button-click's own mouse-leave from
  // firing the listener before the tour has visibly started.
  useEffect(() => {
    if (!isTourActive) return;

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel();
    };
    window.addEventListener('keydown', onEsc);

    // Delay registering the pointermove cancel so the cursor moving away
    // from the star button doesn't immediately abort the tour.
    const graceTimer = setTimeout(() => {
      window.addEventListener('pointermove', cancel, { once: true });
    }, 400);

    return () => {
      clearTimeout(graceTimer);
      window.removeEventListener('keydown', onEsc);
      window.removeEventListener('pointermove', cancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTourActive]);
}
