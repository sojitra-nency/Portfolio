'use client';

/**
 * CornerHUD — the top-edge brand + actions strip of the Neural View.
 *
 * Desktop layout:
 *   [●] NEURAL NEXUS                         [mute] [tour] [quick-view]
 *       NENCY SOJITRA
 *
 * Mobile (< 768 px):
 *   [●] NEURAL NEXUS                                         [≡]
 *       NENCY SOJITRA                                           ↓ reveal
 *
 * - Fade-in on mount via `hudEnter` from neural-motion (reduced-motion-aware).
 * - Pulsing halo dot + "NEURAL NEXUS" mono-HUD title + caption.
 * - Three icon buttons share `HUD_BUTTON_CLASS` + identical Framer hover.
 *     · MuteToggle — bound to `useAudioStore`.
 *     · Tour button — toggles `hud.isTourActive` + flips cinema mode
 *       (mirrors useKeyboardNav's `G` shortcut).
 *     · Quick View link — 400 ms power-down dissolve (full-screen --void
 *       fade + chromaticSpike) before `router.push('/quick-view')`.
 * - Mobile: buttons collapse behind a hamburger that reveals them as a
 *   vertical panel. Click-outside closes.
 */

import { motion } from 'framer-motion';

import { useHudStore } from '@/store/useHudStore';
import { hudEnter } from '@/lib/neural-motion';


// ---------------------------------------------------------------------------
// Brand block — includes inline mute toggle
// ---------------------------------------------------------------------------

function Brand() {
  const reducedMotion = useHudStore((s) => s.isReducedMotion);
  return (
    <div className="flex items-center gap-3">
      {/* Pulsing dot */}
      <div className="relative h-2.5 w-2.5 shrink-0">
        {!reducedMotion && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-[var(--synapse)]"
            animate={{ scale: [1, 2, 2], opacity: [0.5, 0, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <span
          className="relative block h-2.5 w-2.5 rounded-full bg-[var(--synapse)]"
          style={{ boxShadow: '0 0 10px rgba(124, 211, 255, 0.7)' }}
        />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-mono-hud text-[11px] font-semibold tracking-[0.2em] text-white">
          NEURAL NEXUS
        </span>
        <span className="font-mono-hud text-[9px] tracking-[0.18em] text-gray-500">
          NENCY SOJITRA
        </span>
      </div>
      {/* Mute is in CanvasControls toolbar */}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CornerHUD — main component
// ---------------------------------------------------------------------------

export default function CornerHUD() {
  const reducedMotion = useHudStore((s) => s.isReducedMotion);

  return (
    <motion.nav
      variants={hudEnter(reducedMotion)}
      initial="hidden"
      animate="visible"
      className="fixed inset-x-0 top-0 z-30 flex items-start px-6 py-6 pointer-events-none"
    >
      <div className="pointer-events-auto">
        <Brand />
      </div>
    </motion.nav>
  );
}
