'use client';

/**
 * CommTooltip — the Neural View's onboarding whisper.
 *
 * Renders a small mono-HUD pill whose text is driven by
 * `useHudStore.commTooltipText`. Any code can push a hint by calling
 * `useHudStore.getState().setCommTooltipText("…")` and clear it by
 * setting to `null`. This component also auto-drives two contextual
 * hints on its own:
 *
 *   1. Entry hint (shown once, 6 s max or until first hover/click):
 *      "Hover a neuron to sense. Click to focus."
 *
 *   2. First-focus hint (shown once, 4 s):
 *      "Press Esc to return."
 *
 * Layout:
 *   - Desktop: follows the cursor with a small offset via Framer motion
 *     values (no per-frame re-renders).
 *   - Mobile: sticks top-center below the CornerHUD strip.
 */

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useMotionValue } from 'framer-motion';

import { useHudStore } from '@/store/useHudStore';
import { useGraphStore } from '@/store/useGraphStore';
import { commTooltipReveal } from '@/lib/neural-motion';

const ENTRY_HINT = 'Hover a neuron to sense. Click to focus.';
const FOCUS_HINT = 'Press Esc to return.';
const ENTRY_DURATION_MS = 6000;
const FOCUS_DURATION_MS = 4000;

// Cursor offset from the actual pointer so the pill doesn't sit under it.
const CURSOR_OFFSET_X = 18;
const CURSOR_OFFSET_Y = 18;

export default function CommTooltip() {
  const text = useHudStore((s) => s.commTooltipText);
  const setText = useHudStore((s) => s.setCommTooltipText);
  const isBootComplete = useHudStore((s) => s.isBootComplete);
  const isMobile = useHudStore((s) => s.isMobile);
  const reducedMotion = useHudStore((s) => s.isReducedMotion);

  const hoveredNodeId = useGraphStore((s) => s.hoveredNodeId);
  const activeNodeId = useGraphStore((s) => s.activeNodeId);

  // Ref guards so each contextual hint shows at most once per session.
  const shownEntryRef = useRef(false);
  const shownFocusRef = useRef(false);

  // Motion values drive the desktop pill's transform without re-rendering.
  // Start off-screen so it doesn't flash at (0,0) before the first mousemove.
  const cursorX = useMotionValue(-1000);
  const cursorY = useMotionValue(-1000);

  // ── Auto-show entry hint on first boot complete ──────────────────────────
  useEffect(() => {
    if (!isBootComplete || shownEntryRef.current) return;
    shownEntryRef.current = true;
    setText(ENTRY_HINT);
    const timer = window.setTimeout(() => {
      // Only clear if the text is still OUR entry hint — a contextual
      // setter may have replaced it in the meantime.
      if (useHudStore.getState().commTooltipText === ENTRY_HINT) {
        setText(null);
      }
    }, ENTRY_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [isBootComplete, setText]);

  // ── Dismiss entry hint on first hover / click ────────────────────────────
  useEffect(() => {
    if (!shownEntryRef.current) return;
    if (!hoveredNodeId && !activeNodeId) return;
    if (useHudStore.getState().commTooltipText === ENTRY_HINT) {
      setText(null);
    }
  }, [hoveredNodeId, activeNodeId, setText]);

  // ── Show focus hint on first activation ──────────────────────────────────
  useEffect(() => {
    if (!activeNodeId || shownFocusRef.current) return;
    shownFocusRef.current = true;
    setText(FOCUS_HINT);
    const timer = window.setTimeout(() => {
      if (useHudStore.getState().commTooltipText === FOCUS_HINT) {
        setText(null);
      }
    }, FOCUS_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [activeNodeId, setText]);

  // ── Cursor tracking (desktop only) ───────────────────────────────────────
  useEffect(() => {
    if (isMobile) return;
    const onMove = (e: MouseEvent) => {
      cursorX.set(e.clientX + CURSOR_OFFSET_X);
      cursorY.set(e.clientY + CURSOR_OFFSET_Y);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [isMobile, cursorX, cursorY]);

  const pillContent = text ? (
    <>
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--synapse)] animate-neural-pulse"
      />
      <span>{text}</span>
    </>
  ) : null;

  const pillBase =
    'inline-flex items-center gap-2 rounded-full border border-white/15 ' +
    'bg-[color:var(--void-warm)]/85 backdrop-blur-md px-3 py-1.5 ' +
    'font-mono-hud text-[11px] tracking-[0.06em] text-white ' +
    'shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]';

  return (
    <AnimatePresence>
      {text &&
        (isMobile ? (
          <motion.div
            key="comm-tooltip-mobile"
            role="status"
            aria-live="polite"
            className={`${pillBase} fixed left-1/2 top-[88px] z-40 -translate-x-1/2 pointer-events-none`}
            variants={commTooltipReveal(reducedMotion)}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {pillContent}
          </motion.div>
        ) : (
          <motion.div
            key="comm-tooltip-desktop"
            role="status"
            aria-live="polite"
            className={`${pillBase} fixed left-0 top-0 z-40 pointer-events-none`}
            style={{ x: cursorX, y: cursorY }}
            variants={commTooltipReveal(reducedMotion)}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {pillContent}
          </motion.div>
        ))}
    </AnimatePresence>
  );
}
