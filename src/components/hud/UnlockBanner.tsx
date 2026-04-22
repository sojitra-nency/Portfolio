'use client';

/**
 * UnlockBanner — top-of-screen "NEW NEURON DETECTED: {label}" pill that
 * announces a progressive-discovery unlock.
 *
 * Subscribes to the exploration store's `onUnlock()` pub/sub (same
 * source `UnlockReveal` listens to, so visual + audio + banner all fire
 * off one event). Slides down from above with a fade, persists for 3 s,
 * slides out. Rapid consecutive unlocks reset the timer so the new
 * label always gets its full window.
 *
 * Mounted once in `page.tsx` alongside the other post-boot HUDs.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { onUnlock } from '@/store/useExplorationStore';
import { useGraphStore } from '@/store/useGraphStore';
import { EASE_EXPO } from '@/lib/neural-motion';

const BANNER_DURATION_MS = 3000;

export default function UnlockBanner() {
  const [label, setLabel] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = onUnlock((id) => {
      const node = useGraphStore.getState().nodes.find((n) => n.id === id);
      if (!node) return;

      // Reset timer if a previous banner is still showing — rapid
      // consecutive unlocks each get their full window.
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      setLabel(node.label);
      timerRef.current = window.setTimeout(() => {
        setLabel(null);
        timerRef.current = null;
      }, BANNER_DURATION_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {label && (
        <motion.div
          key={label}
          className="fixed inset-x-0 top-14 z-50 flex justify-center pointer-events-none"
          initial={{ opacity: 0, y: -28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -28 }}
          transition={{ duration: 0.4, ease: EASE_EXPO }}
          role="status"
          aria-live="polite"
        >
          <div
            className="flex items-center gap-3 rounded-full border border-[color:var(--synapse)]/50 bg-[color:var(--void-warm)]/90 backdrop-blur-lg px-6 py-2.5"
            style={{ boxShadow: '0 0 48px rgba(124, 211, 255, 0.4)' }}
          >
            <span
              aria-hidden
              className="h-2 w-2 rounded-full bg-[var(--synapse)] animate-neural-pulse"
            />
            <span className="font-mono-hud text-xs uppercase tracking-[0.24em] text-white">
              NEW NEURON DETECTED:{' '}
              <span className="text-[color:var(--synapse)]">{label}</span>
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
