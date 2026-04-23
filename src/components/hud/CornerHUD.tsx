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

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

import { useHudStore } from '@/store/useHudStore';
import { useCinemaStore } from '@/store/useCinemaStore';
import { EASE_EXPO, hudEnter } from '@/lib/neural-motion';

import MuteToggle, { HUD_BUTTON_CLASS } from './MuteToggle';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function StarIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Brand block
// ---------------------------------------------------------------------------

function Brand() {
  const reducedMotion = useHudStore((s) => s.isReducedMotion);
  return (
    <div className="flex items-center gap-2.5">
      {/* Pulsing dot — outer ping ring + crisp core. Skip the animated
          ping on reduced motion; the static core still reads as a live
          indicator. */}
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tour button
// ---------------------------------------------------------------------------

function TourButton() {
  const isTourActive = useHudStore((s) => s.isTourActive);
  const setTourActive = useHudStore((s) => s.setTourActive);

  const handleClick = () => {
    const next = !isTourActive;
    setTourActive(next);
    if (next) {
      useCinemaStore.getState().startTour();
    } else {
      useCinemaStore.getState().returnToAmbient();
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label={isTourActive ? 'Stop guided tour' : 'Start guided tour'}
      aria-pressed={isTourActive}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.18, ease: EASE_EXPO }}
      data-active={isTourActive || undefined}
      className={`${HUD_BUTTON_CLASS} data-[active]:text-[color:var(--synapse)] data-[active]:border-[color:var(--synapse)]/60 data-[active]:bg-[color:var(--synapse)]/10`}
    >
      <StarIcon filled={isTourActive} />
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Quick-View button (parent drives the power-down dissolve)
// ---------------------------------------------------------------------------

function QuickViewButton({ onPowerDown }: { onPowerDown: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onPowerDown}
      aria-label="Open Quick View"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.18, ease: EASE_EXPO }}
      className={HUD_BUTTON_CLASS}
    >
      <ArrowRightIcon />
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Actions cluster (desktop row or mobile panel)
// ---------------------------------------------------------------------------

function ActionsCluster({
  onPowerDown,
  orientation,
}: {
  onPowerDown: () => void;
  orientation: 'horizontal' | 'vertical';
}) {
  const layout =
    orientation === 'horizontal'
      ? 'flex-row items-center gap-2'
      : 'flex-col items-center gap-2 p-2 rounded-xl border border-white/10 bg-[color:var(--void-warm)]/85 backdrop-blur-lg';
  return (
    <div className={`flex ${layout}`}>
      <MuteToggle />
      <TourButton />
      <QuickViewButton onPowerDown={onPowerDown} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// CornerHUD — main component
// ---------------------------------------------------------------------------

export default function CornerHUD() {
  const router = useRouter();
  const isMobile = useHudStore((s) => s.isMobile);
  const reducedMotion = useHudStore((s) => s.isReducedMotion);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isPoweringDown, setIsPoweringDown] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Power-down dissolve: chromatic shock + 400 ms fade to --void, then route.
  const handlePowerDown = useCallback(() => {
    if (isPoweringDown) return;
    setIsPoweringDown(true);
    useHudStore.getState().chromaticSpike();
    window.setTimeout(() => {
      router.push('/quick-view');
    }, 400);
  }, [isPoweringDown, router]);

  // Click-outside closes the mobile menu (defer one tick so the opening
  // click doesn't immediately close it).
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const t = window.setTimeout(() => {
      document.addEventListener('click', onDocClick);
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('click', onDocClick);
    };
  }, [menuOpen]);

  return (
    <>
      <motion.nav
        variants={hudEnter(reducedMotion)}
        initial="hidden"
        animate="visible"
        // Outer strip is pointer-transparent so the canvas still catches
        // clicks in empty HUD areas; interactive children re-enable.
        className="fixed inset-x-0 top-0 z-30 flex items-start justify-between px-6 py-6 pointer-events-none"
      >
        <div className="pointer-events-auto">
          <Brand />
        </div>

        {isMobile ? (
          <div ref={menuRef} className="relative pointer-events-auto">
            <motion.button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.18, ease: EASE_EXPO }}
              className={HUD_BUTTON_CLASS}
            >
              <HamburgerIcon />
            </motion.button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  key="mobile-menu"
                  className="absolute right-0 top-full mt-2"
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: EASE_EXPO }}
                >
                  <ActionsCluster
                    orientation="vertical"
                    onPowerDown={handlePowerDown}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="pointer-events-auto">
            <ActionsCluster
              orientation="horizontal"
              onPowerDown={handlePowerDown}
            />
          </div>
        )}
      </motion.nav>

      {/* Power-down dissolve — fullscreen --void fade over 400ms. */}
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
