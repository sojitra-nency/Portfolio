'use client';

/**
 * DetailCard — cinematic info surface for the currently-focused neuron.
 *
 * Gated on `useGraphStore.activeNodeId` + `useHudStore.isDetailOpen`. The
 * keyboard binding (Enter on the active node) sets `isDetailOpen`, and
 * Esc / the close button clear both flags along with camera reset.
 *
 * Visual language:
 *   - Desktop: 420 px-wide card anchored 48 px from the right edge,
 *     vertically centered via a full-height flex wrapper (so the card's
 *     own transform can animate scale/translate without fighting CSS
 *     centering).
 *   - Mobile: bottom sheet filling 65 vh, slides up from the bottom.
 *   - 1 px border tinted to the node's category color at 40 % alpha
 *     (`${color}66`).
 *
 * Entrance choreography:
 *   1. Outer card fades/scales in (Framer AnimatePresence).
 *   2. Four corner L-brackets draw in over 180 ms via `pathLength 0 → 1`.
 *   3. Inner content block fades + rises 8 px → 0 over 380 ms after a
 *      180 ms delay so it follows the brackets.
 *
 * Node switches (click another neuron while open) keep the card mounted
 * but re-key the content block so its fade-in re-runs. The brackets
 * only draw once per card-lifecycle.
 *
 * Content sections: category badge • label (Syne) • summary • description •
 * stats (2-col grid) • tags (chips) • external URL glowing button •
 * 4 connected-neuron chips (click → focus).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

import { useGraphStore } from '@/store/useGraphStore';
import { useHudStore } from '@/store/useHudStore';
import { useCinemaStore } from '@/store/useCinemaStore';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/data/types';
import { getNeighbors } from '@/lib/graph-math';
import { EASE_EXPO } from '@/lib/neural-motion';

// ---------------------------------------------------------------------------
// L-bracket corner marker
// ---------------------------------------------------------------------------

function Bracket({
  className,
  rotate,
}: {
  className: string;
  rotate: number;
}) {
  return (
    <svg
      className={`pointer-events-none absolute ${className}`}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden
    >
      <motion.path
        d="M 1 12 L 1 1 L 12 1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.9 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.18, ease: EASE_EXPO }}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Motion variants
// ---------------------------------------------------------------------------

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: EASE_EXPO, delay: 0.18 },
  },
};

// ---------------------------------------------------------------------------
// DetailCard
// ---------------------------------------------------------------------------

export default function DetailCard() {
  const activeNodeId = useGraphStore((s) => s.activeNodeId);
  const isDetailOpen = useHudStore((s) => s.isDetailOpen);
  const isMobile = useHudStore((s) => s.isMobile);
  const reducedMotion = useHudStore((s) => s.isReducedMotion);
  const nodes = useGraphStore((s) => s.nodes);
  const connections = useGraphStore((s) => s.connections);

  const isVisible = Boolean(activeNodeId && isDetailOpen);

  // Refs for focus trapping and focus restoration.
  const cardRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // On open: record the element that had focus before the dialog opened,
  // move focus to the close button (autoFocus equivalent), and trap Tab.
  // On close: restore focus to the previously-focused element.
  useEffect(() => {
    if (!isVisible) return;

    // Record the triggering element.
    returnFocusRef.current = document.activeElement as HTMLElement | null;

    // Next tick so the close button has rendered before we focus it.
    const raf = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const root = cardRef.current;
    if (!root) {
      return () => window.cancelAnimationFrame(raf);
    }

    // Focus-trap: on Tab, clamp focus to children of the card.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    root.addEventListener('keydown', onKey);

    return () => {
      window.cancelAnimationFrame(raf);
      root.removeEventListener('keydown', onKey);
      // On unmount (card closing), return focus to the original trigger.
      returnFocusRef.current?.focus?.();
    };
  }, [isVisible]);

  const node = useMemo(() => {
    if (!activeNodeId) return null;
    return nodes.find((n) => n.id === activeNodeId) ?? null;
  }, [activeNodeId, nodes]);

  // Resolve up to 4 1-hop neighbors for the "CONNECTED NEURONS" chips.
  const neighbors = useMemo(() => {
    if (!activeNodeId) return [];
    const ids = [...getNeighbors(activeNodeId, 1, connections)].slice(0, 4);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    return ids
      .map((id) => byId.get(id))
      .filter((n): n is NonNullable<typeof n> => Boolean(n));
  }, [activeNodeId, connections, nodes]);

  const color = node ? CATEGORY_COLORS[node.category] : '#FFFFFF';
  const categoryLabel = node ? CATEGORY_LABELS[node.category] : '';

  const close = () => {
    useGraphStore.getState().deactivate();
    useHudStore.getState().setDetailOpen(false);
    useCinemaStore.getState().returnToAmbient();
  };

  const focusNeighbor = (id: string) => {
    useGraphStore.getState().activate(id);
    useCinemaStore.getState().focusOn(id);
  };

  // Copy-link toast: shows "Link copied" for 1.5 s. A single timer ref
  // so rapid re-clicks restart the countdown cleanly.
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyLink = async () => {
    if (!node) return;
    const url = `${window.location.origin}/?focus=${encodeURIComponent(node.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast('Link copied');
    } catch {
      setToast('Copy failed');
    }
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 1500);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Flex wrapper handles vertical centering (desktop) or bottom anchoring
  // (mobile) so the card's own transform can animate freely.
  const wrapperClasses = isMobile
    ? 'fixed inset-x-0 bottom-0 z-40 flex items-end pointer-events-none'
    : 'fixed inset-y-0 right-0 z-40 flex items-center pr-12 pointer-events-none';

  const cardBase =
    'pointer-events-auto relative overflow-hidden bg-[color:var(--void-warm)]/80 backdrop-blur-xl';
  const cardSizing = isMobile
    ? 'w-full h-[65vh] rounded-t-2xl'
    : 'w-[420px] max-h-[80vh] rounded-2xl';

  // Direction-specific enter/exit.
  const initialPose = reducedMotion
    ? false
    : isMobile
    ? { opacity: 0, y: 48 }
    : { opacity: 0, x: 32, scale: 0.98 };
  const animatePose = { opacity: 1, x: 0, y: 0, scale: 1 };
  const exitPose = reducedMotion
    ? { opacity: 0 }
    : isMobile
    ? { opacity: 0, y: 48 }
    : { opacity: 0, x: 32, scale: 0.98 };

  return (
    <AnimatePresence>
      {isVisible && node && (
        <div className={wrapperClasses}>
          <motion.div
            ref={cardRef}
            className={`${cardBase} ${cardSizing}`}
            style={{
              border: `1px solid ${color}66`, // category color @ 40% alpha
              boxShadow: `0 20px 60px -20px ${color}40`,
            }}
            initial={initialPose}
            animate={animatePose}
            exit={exitPose}
            transition={{ duration: 0.3, ease: EASE_EXPO }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`detail-title-${node.id}`}
          >
            {/* Corner L-brackets — draw in once on card mount. */}
            <div style={{ color }} className="absolute inset-0">
              <Bracket className="top-2 left-2" rotate={0} />
              <Bracket className="top-2 right-2" rotate={90} />
              <Bracket className="bottom-2 right-2" rotate={180} />
              <Bracket className="bottom-2 left-2" rotate={270} />
            </div>

            {/* Copy link */}
            <button
              type="button"
              onClick={copyLink}
              aria-label="Copy link to this neuron"
              className="absolute top-3.5 right-12 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--synapse)]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>

            {/* Close */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              aria-label="Close details"
              className="absolute top-3.5 right-3.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--synapse)]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden
              >
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>

            {/* Toast — local to the card, pointer-none so it never steals
                clicks. Uses aria-live so screen readers catch the status. */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  key={toast}
                  role="status"
                  aria-live="polite"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: EASE_EXPO }}
                  className="pointer-events-none absolute top-14 right-3.5 z-10 rounded-md px-2.5 py-1 font-mono-hud text-[10px] uppercase tracking-[0.2em]"
                  style={{
                    background: `${color}18`,
                    border: `1px solid ${color}50`,
                    color,
                  }}
                >
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content — keyed by node.id so it re-runs its fade when the
                user clicks a different neuron while the card stays open. */}
            <motion.div
              key={node.id}
              variants={contentVariants}
              initial={reducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              className="relative h-full overflow-y-auto p-6 pr-10 pb-8 space-y-5 scrollbar-none"
            >
              {/* Category badge */}
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    background: color,
                    boxShadow: `0 0 8px ${color}`,
                  }}
                  aria-hidden
                />
                <span
                  className="font-mono-hud text-[10px] uppercase tracking-[0.24em]"
                  style={{ color }}
                >
                  {categoryLabel}
                </span>
              </div>

              {/* Label */}
              <h2
                id={`detail-title-${node.id}`}
                className="font-[var(--font-syne)] text-2xl font-bold leading-tight text-white"
              >
                {node.label}
              </h2>

              {/* Summary */}
              {node.summary && (
                <p className="text-sm leading-relaxed text-gray-300">
                  {node.summary}
                </p>
              )}

              {/* Description */}
              {node.description && (
                <p className="text-[13px] leading-relaxed text-gray-400">
                  {node.description}
                </p>
              )}

              {/* Stats — 2-col grid */}
              {node.metadata?.stats &&
                Object.keys(node.metadata.stats).length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(node.metadata.stats).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                        >
                          <div className="font-mono-hud text-[9px] uppercase tracking-[0.2em] text-gray-500">
                            {key}
                          </div>
                          <div
                            className="mt-1 text-base font-semibold tabular-nums"
                            style={{ color }}
                          >
                            {value}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}

              {/* Tags */}
              {node.metadata?.tags && node.metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {node.metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        color,
                        background: `${color}14`,
                        border: `1px solid ${color}33`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* External URL — glowing button */}
              {node.metadata?.url && (
                <a
                  href={node.metadata.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:brightness-125"
                  style={{
                    color,
                    background: `${color}18`,
                    border: `1px solid ${color}50`,
                    boxShadow: `0 0 18px ${color}33`,
                  }}
                >
                  Open Link
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </a>
              )}

              {/* Connected neurons */}
              {neighbors.length > 0 && (
                <div>
                  <div className="mb-2 font-mono-hud text-[10px] uppercase tracking-[0.22em] text-gray-500">
                    CONNECTED NEURONS
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {neighbors.map((n) => {
                      const nColor = CATEGORY_COLORS[n.category];
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => focusNeighbor(n.id)}
                          className="rounded-md px-2.5 py-1 text-[11px] font-medium transition-all hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--synapse)]"
                          style={{
                            color: nColor,
                            background: `${nColor}10`,
                            border: `1px solid ${nColor}30`,
                          }}
                        >
                          {n.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
