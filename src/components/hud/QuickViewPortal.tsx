'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

import { useHudStore } from '@/store/useHudStore';
import { EASE_EXPO } from '@/lib/neural-motion';

export default function QuickViewPortal() {
  const router = useRouter();
  const reducedMotion = useHudStore((s) => s.isReducedMotion);
  const isDetailMinimized = useHudStore((s) => s.isDetailMinimized);
  const isDetailOpen = useHudStore((s) => s.isDetailOpen);
  // When the minimized tab is showing (40px wide), shift the button left.
  const tabVisible = isDetailMinimized && isDetailOpen;
  const [isPoweringDown, setIsPoweringDown] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (isPoweringDown) return;
    setIsPoweringDown(true);
    useHudStore.getState().chromaticSpike();
    window.setTimeout(() => router.push('/quick-view'), 400);
  }, [isPoweringDown, router]);

  return (
    <>
      <motion.div
        className="fixed bottom-6 z-30 pointer-events-auto opacity-50 hover:opacity-100 transition-opacity duration-300"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, right: tabVisible ? 56 : 24 }}
        transition={{ duration: tabVisible ? 0.18 : 0.5, delay: tabVisible ? 0 : 0.3, ease: EASE_EXPO }}
      >
        {/* Outer glow bloom — always on, pulses */}
        {!reducedMotion && (
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full pointer-events-none"
            animate={{
              boxShadow: hovered
                ? '0 0 32px 6px rgba(91,143,255,0.35)'
                : ['0 0 8px 0px rgba(91,143,255,0.08)', '0 0 18px 2px rgba(91,143,255,0.18)', '0 0 8px 0px rgba(91,143,255,0.08)'],
            }}
            transition={hovered
              ? { duration: 0.2 }
              : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
            }
          />
        )}

        <motion.button
          type="button"
          onClick={handleClick}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          aria-label="Open Quick View"
          whileHover="hovered"
          whileTap={{ scale: 0.95 }}
          className="group relative flex items-center gap-2 rounded-full px-5 py-2.5 overflow-hidden"
          style={{
            background: hovered
              ? 'rgba(91,143,255,0.08)'
              : 'rgba(91,143,255,0.04)',
            border: `1px solid rgba(91,143,255,${hovered ? '0.45' : '0.2'})`,
            backdropFilter: 'blur(16px)',
            boxShadow: hovered
              ? 'inset 0 1px 0 rgba(91,143,255,0.2)'
              : 'inset 0 1px 0 rgba(91,143,255,0.06)',
            transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
          }}
        >
          {/* Scan-line sweep on hover */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full pointer-events-none"
            variants={{
              hovered: {
                background: [
                  'linear-gradient(90deg, transparent 0%, rgba(91,143,255,0.06) 50%, transparent 100%)',
                ],
              },
            }}
          />

          {/* Prompt sigil */}
          <span
            className="font-mono-hud text-[10px] tracking-[0.1em] select-none transition-colors duration-200"
            style={{ color: hovered ? 'rgba(91,143,255,0.7)' : 'rgba(91,143,255,0.3)' }}
          >
            ~/
          </span>

          {/* Label */}
          <span
            className="font-mono-hud text-[11px] uppercase tracking-[0.2em] transition-colors duration-200"
            style={{ color: hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)' }}
          >
            quick-view
          </span>

          {/* Arrow — slides in and brightens on hover */}
          <motion.span
            aria-hidden
            className="font-mono-hud text-[12px]"
            style={{ color: 'var(--synapse)' }}
            variants={{
              hovered: { opacity: 1, x: 0, transition: { duration: 0.15, ease: EASE_EXPO } },
            }}
            initial={{ opacity: 0, x: -6 }}
          >
            →
          </motion.span>
        </motion.button>
      </motion.div>

      {/* Power-down dissolve */}
      <AnimatePresence>
        {isPoweringDown && (
          <motion.div
            key="power-down"
            className="fixed inset-0 z-[100] bg-[var(--void)] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE_EXPO }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
