'use client';

/**
 * useDeepLink — hydrates `?focus=<nodeId>&view=neural|quick` on mount and
 * keeps the URL in sync as the user activates different nodes.
 *
 * Behaviour:
 *   - On first load: reads `focus` from the URL. Waits until the boot
 *     overlay has dismissed AND the force layout has written a position
 *     for that id, then calls activate + focusOn + open DetailCard. The
 *     wait is implemented via a Zustand subscription so we don't poll.
 *   - `view=quick`: redirects to `/quick-view#<nodeId>` immediately.
 *   - After hydration: subscribes to `activeNodeId` changes and mirrors
 *     them into the URL via `router.replace` (no history entry, no
 *     reload). Clearing the active node removes the `focus` param.
 *   - Gate: an unknown `focus` id (not in `positions`) is silently ignored
 *     after a 10 s grace window — covers hidden unlockables that never
 *     materialise.
 */

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useGraphStore } from '@/store/useGraphStore';
import { useCinemaStore } from '@/store/useCinemaStore';
import { useHudStore } from '@/store/useHudStore';

const HYDRATION_GRACE_MS = 10_000;

export default function useDeepLink() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydratedRef = useRef(false);

  // ── 1. Hydrate from URL on first render ──────────────────────────────
  useEffect(() => {
    if (hydratedRef.current) return;
    const focusId = searchParams.get('focus');
    const view = searchParams.get('view');

    if (view === 'quick' && focusId) {
      router.replace(`/quick-view#${focusId}`);
      return;
    }

    if (!focusId) {
      hydratedRef.current = true;
      return;
    }

    // We need both: boot dismissed AND a position written for the id.
    // Subscribe to both stores; trigger once when both are ready.
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      hydratedRef.current = true;
      unsubBoot();
      unsubPositions();
    }, HYDRATION_GRACE_MS);

    const tryHydrate = () => {
      if (timedOut || hydratedRef.current) return;
      const bootDone = useHudStore.getState().isBootComplete;
      const hasPos = useGraphStore.getState().positions.has(focusId);
      if (!bootDone || !hasPos) return;

      hydratedRef.current = true;
      clearTimeout(timer);
      unsubBoot();
      unsubPositions();

      useGraphStore.getState().activate(focusId);
      useCinemaStore.getState().focusOn(focusId);
      useHudStore.getState().setDetailOpen(true);
    };

    const unsubBoot = useHudStore.subscribe(
      (s) => s.isBootComplete,
      () => tryHydrate(),
    );
    const unsubPositions = useGraphStore.subscribe(
      (s) => s.positions,
      () => tryHydrate(),
    );
    tryHydrate();

    return () => {
      clearTimeout(timer);
      unsubBoot();
      unsubPositions();
    };
    // searchParams intentionally excluded — we only hydrate once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Mirror activeNodeId → URL ─────────────────────────────────────
  useEffect(() => {
    const write = (id: string | null) => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const current = params.get('focus');
      if (id === current) return;
      if (id) {
        params.set('focus', id);
      } else {
        params.delete('focus');
      }
      const qs = params.toString();
      const next = qs ? `/?${qs}` : '/';
      router.replace(next, { scroll: false });
    };

    const unsub = useGraphStore.subscribe(
      (s) => s.activeNodeId,
      (id) => {
        // Don't write before initial hydration completes — avoids
        // racing with the hydration step and stripping the URL before
        // we've read it.
        if (!hydratedRef.current) return;
        write(id);
      },
    );
    return unsub;
  }, [router]);
}
