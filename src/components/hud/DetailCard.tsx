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
import { useExplorationStore } from '@/store/useExplorationStore';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/data/types';
import { getNeighbors } from '@/lib/graph-math';
import { EASE_EXPO } from '@/lib/neural-motion';
import { cameraSignals } from '@/lib/cameraControls';

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

/** Outer limit: panel can't exceed 30% of viewport width. No inner minimum — drag to 0 to minimize. */
const PANEL_MAX_RATIO = 0.30;

export default function DetailCard() {
  const activeNodeId = useGraphStore((s) => s.activeNodeId);
  const isDetailOpen = useHudStore((s) => s.isDetailOpen);
  const isMinimized = useHudStore((s) => s.isDetailMinimized);
  const isMobile = useHudStore((s) => s.isMobile);
  const reducedMotion = useHudStore((s) => s.isReducedMotion);
  const panelWidth = useHudStore((s) => s.panelWidth);
  const nodes = useGraphStore((s) => s.nodes);
  const connections = useGraphStore((s) => s.connections);

  const isVisible = Boolean(activeNodeId && isDetailOpen);

  // Wrapper ref — used to mutate width directly during drag (no re-renders).
  const wrapperRef = useRef<HTMLDivElement>(null);

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = useHudStore.getState().panelWidth;
    const maxWidth = Math.floor(window.innerWidth * PANEL_MAX_RATIO);
    const canvasEl = document.querySelector<HTMLElement>('[data-canvas-area]');

    const onMove = (ev: PointerEvent) => {
      // Dragging left → delta positive → width grows.
      const delta = startX - ev.clientX;
      const next = Math.min(maxWidth, Math.max(0, startWidth + delta));

      // Mutate DOM directly — zero React re-renders during drag.
      if (wrapperRef.current) wrapperRef.current.style.width = `${next}px`;
      if (canvasEl) canvasEl.style.width = `calc(100% - ${next}px)`;
    };

    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      const delta = startX - ev.clientX;
      const next = Math.min(maxWidth, Math.max(0, startWidth + delta));

      // If dragged nearly closed, snap to minimized.
      if (next < 60) {
        useHudStore.getState().setDetailMinimized(true);
        useHudStore.getState().setPanelWidth(startWidth); // restore for re-expand
        if (wrapperRef.current) wrapperRef.current.style.width = '40px';
        if (canvasEl) canvasEl.style.width = 'calc(100% - 40px)';
      } else {
        useHudStore.getState().setPanelWidth(next);
        // Clear inline styles — let React take over from store value.
        if (wrapperRef.current) wrapperRef.current.style.width = '';
        if (canvasEl) canvasEl.style.width = '';
      }
    };

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

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
    useHudStore.getState().setDetailMinimized(false);
    useCinemaStore.getState().returnToAmbient();
  };

  const toggleMinimize = () => {
    useHudStore.getState().setDetailMinimized(!isMinimized);
  };

  const focusNeighbor = (id: string) => {
    const { nodes, expandCluster, activate } = useGraphStore.getState();
    // If the target is a child node (level ≥ 2), expand its parent cluster
    // so the node is actually rendered in the canvas before the camera arrives.
    const target = nodes.find((n) => n.id === id);
    if (target && target.level >= 2 && target.parentId) {
      expandCluster(target.parentId);
    }
    activate(id);
    useExplorationStore.getState().visit(id);
    // Reset any user-applied zoom/pan offsets so the camera lands precisely
    // on the targeted neuron rather than at a position skewed by prior input.
    cameraSignals.resetRequested = true;
    useCinemaStore.getState().focusOn(id);
    useHudStore.getState().setDetailOpen(true);
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

  return (
    <>
    {/* ── Minimized tab — rendered as a completely separate fixed element,
        totally independent from the main panel. This is the key fix: the
        tab and panel never share a container, so toggling minimize cannot
        cause the panel's backdrop-blur layer to flash or reflow. */}
    <AnimatePresence>
      {isVisible && node && !isMobile && isMinimized && (
        <motion.button
          key="minimized-tab"
          type="button"
          onClick={toggleMinimize}
          aria-label="Expand detail panel"
          // Slide in from right on mount. Exit is instant (duration 0) so
          // the tab doesn't animate out while the full panel animates in —
          // running both simultaneously caused the visible lag on expand.
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 0, transition: { duration: 0 } }}
          transition={{ duration: 0.18, ease: EASE_EXPO }}
          className="fixed inset-y-0 right-0 z-40 w-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/[0.04] transition-colors duration-150"
          style={{
            background: 'rgba(10,6,28,0.97)',
            borderLeft: `2px solid ${color}`,
            boxShadow: `0 0 20px ${color}40, -4px 0 24px rgba(0,0,0,0.5)`,
          }}
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
          <span
            className="font-mono-hud text-[10px] uppercase tracking-[0.18em] flex-shrink-0"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: 'rgba(255,255,255,0.6)', maxHeight: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {node.label}
          </span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color, opacity: 0.7, flexShrink: 0 }} aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>

    {/* ── Main panel — the motion.div IS the direct AnimatePresence child so
        Framer controls the full mount/unmount. No plain div wrapper in between
        — that was breaking AnimatePresence exit and leaving a 420px black void. */}
    <AnimatePresence>
      {isVisible && node && (!isMinimized || isMobile) && (
        <motion.div
          key="detail-panel"
          ref={wrapperRef}
          className={isMobile
            ? 'fixed inset-x-0 bottom-0 z-40 flex items-end pointer-events-none'
            : 'fixed inset-y-0 right-0 z-40 flex'}
          style={!isMobile ? { width: panelWidth, flexShrink: 0 } : undefined}
          initial={reducedMotion ? false : isMobile ? { opacity: 0, y: 48 } : { opacity: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : isMobile ? { opacity: 0, y: 48 } : { opacity: 0 }}
          transition={{ duration: isMobile ? 0.22 : 0.12, ease: EASE_EXPO }}
        >
          {/* Resize handle — left edge, desktop only */}
          {!isMobile && (
            <div
              onPointerDown={startResize}
              className="absolute left-0 inset-y-0 w-3 z-50 cursor-ew-resize flex items-center justify-center group"
              aria-hidden
            >
              <div
                className="w-[2px] h-16 rounded-full opacity-20 group-hover:opacity-80 group-hover:h-24 transition-all duration-150"
                style={{ background: color }}
              />
            </div>
          )}

          {/* Inner panel surface — solid background, no backdrop-blur.
              backdrop-blur creates a GPU compositing layer that cannot fade
              cleanly with opacity and always shows as a dark rectangle during
              transitions regardless of animation duration. */}
          <div
            ref={cardRef}
            className={isMobile
              ? 'relative flex flex-col w-full h-[65vh] rounded-t-2xl overflow-hidden pointer-events-auto'
              : 'relative flex flex-col h-full overflow-hidden pointer-events-auto flex-1'}
            style={isMobile ? {
              background: 'rgba(12,8,32,0.96)',
              border: `1px solid rgba(153,102,255,0.15)`,
              boxShadow: `0 20px 60px -20px ${color}40, inset 0 1px 0 rgba(153,102,255,0.10)`,
            } : {
              width: '100%',
              background: 'rgba(10,6,28,0.97)',
              borderLeft: `1px solid rgba(153,102,255,0.12)`,
              borderTop: `1px solid rgba(153,102,255,0.08)`,
              boxShadow: `-16px 0 60px -8px rgba(0,0,0,0.7), inset 1px 0 0 rgba(153,102,255,0.08)`,
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`detail-title-${node.id}`}
          >

            {/* Category colour accent line at top of desktop panel */}
            {!isMobile && (
              <div
                className="shrink-0 h-[2px] w-full relative z-10"
                style={{ background: `linear-gradient(90deg, transparent, ${color}cc, transparent)` }}
              />
            )}

            {/* Corner L-brackets — mobile bottom sheet only */}
            {isMobile && (
              <div style={{ color }} className="pointer-events-none absolute inset-0 z-10">
                <Bracket className="top-2 left-2" rotate={0} />
                <Bracket className="top-2 right-2" rotate={90} />
                <Bracket className="bottom-2 right-2" rotate={180} />
                <Bracket className="bottom-2 left-2" rotate={270} />
              </div>
            )}

            {/* Minimize — collapses panel to a slim tab on both desktop and mobile */}
            <button
              type="button"
              onClick={toggleMinimize}
              aria-label={isMinimized ? 'Expand details' : 'Collapse details'}
              className="absolute top-3.5 right-20 z-30 inline-flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--synapse)]"
            >
              {isMinimized ? (
                /* expand — chevron left (open panel) */
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              ) : (
                /* collapse — chevron right */
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </button>

            {/* Copy link */}
            <button
              type="button"
              onClick={copyLink}
              aria-label="Copy link to this neuron"
              className="absolute top-3.5 right-12 z-30 inline-flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--synapse)]"
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
              className="absolute top-3.5 right-3.5 z-30 inline-flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--synapse)]"
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
              className="relative z-10 flex min-h-0 flex-1 flex-col"
            >
              {/* ── Fixed header: never scrolls ── */}
              <div className="shrink-0 px-6 pt-6 pr-14 pb-4">
                {/* Category badge */}
                <div className="flex items-center gap-2 mb-3">
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
              </div>

              {/* ── Scrollable body — collapsible on mobile only ── */}
              <AnimatePresence initial={false}>
              {(isMobile ? !isMinimized : true) && (
              <motion.div
                key="body"
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: EASE_EXPO }}
                style={{ overflow: 'hidden' }}
                className="min-h-0 flex-1"
              >
              <div className="h-full overflow-y-auto px-6 pb-8 space-y-5 scrollbar-none">
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
                          className="rounded-lg p-3"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(8px)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                          }}
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
                        background: `${color}18`,
                        border: `1px solid ${color}40`,
                        backdropFilter: 'blur(6px)',
                        boxShadow: `inset 0 1px 0 ${color}20`,
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
                    background: `${color}15`,
                    border: `1px solid ${color}50`,
                    backdropFilter: 'blur(8px)',
                    boxShadow: `0 0 20px ${color}25, inset 0 1px 0 ${color}20`,
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
                            background: `${nColor}12`,
                            border: `1px solid ${nColor}35`,
                            backdropFilter: 'blur(6px)',
                            boxShadow: `inset 0 1px 0 ${nColor}15`,
                          }}
                        >
                          {n.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              </div>
              </motion.div>
              )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
