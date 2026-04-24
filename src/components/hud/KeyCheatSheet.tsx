'use client';

/**
 * KeyCheatSheet — full-screen `?`-toggled overlay listing every keyboard
 * shortcut wired through `useKeyboardNav`. Backdrop dims the scene,
 * centered glassy card fades + scales in, click outside or press `Esc`
 * (or `?` again) to dismiss.
 *
 * Visibility is driven by `useHudStore.isCheatSheetOpen`. The `?`
 * keypress is already bound in `useKeyboardNav`; this component self-
 * registers an Escape listener while it's open.
 */

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { useHudStore } from '@/store/useHudStore';
import { EASE_EXPO } from '@/lib/neural-motion';

// ---------------------------------------------------------------------------
// Shortcut data
// ---------------------------------------------------------------------------

interface Shortcut {
  keys: readonly string[];
  action: string;
}

const SHORTCUTS: readonly Shortcut[] = [
  { keys: ['Cmd+K'], action: 'Open node search palette' },
  { keys: ['Esc'], action: 'Close detail / return to ambient' },
  { keys: ['Tab', 'Shift+Tab'], action: 'Cycle through visible neurons' },
  { keys: ['Enter'], action: 'Open detail on the active neuron' },
  { keys: ['Home', '0'], action: 'Reset view to origin' },
  { keys: ['M'], action: 'Toggle mute' },
  { keys: ['G'], action: 'Toggle guided tour' },
  { keys: ['?'], action: 'Toggle this cheat sheet' },
];

// ---------------------------------------------------------------------------
// Keycap pill
// ---------------------------------------------------------------------------

function Keycap({ label }: { label: string }) {
  return (
    <span
      className="inline-flex min-w-[28px] items-center justify-center rounded-md border border-white/20 bg-white/[0.04] px-2 py-0.5 font-mono-hud text-[11px] font-medium text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.4)]"
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function KeyCheatSheet() {
  const isOpen = useHudStore((s) => s.isCheatSheetOpen);
  const setOpen = useHudStore((s) => s.setCheatSheetOpen);
  const reducedMotion = useHudStore((s) => s.isReducedMotion);

  // Esc closes the sheet when open. (? key toggling is already handled
  // globally by useKeyboardNav.)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isOpen, setOpen]);

  const cardVariants = reducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0 } },
        exit: { opacity: 0, transition: { duration: 0 } },
      }
    : {
        hidden: { opacity: 0, scale: 0.92 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { duration: 0.3, ease: EASE_EXPO },
        },
        exit: {
          opacity: 0,
          scale: 0.96,
          transition: { duration: 0.18, ease: EASE_EXPO },
        },
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cheat-backdrop"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE_EXPO }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cheat-sheet-title"
        >
          <motion.div
            // Card — stop the click from bubbling to the backdrop.
            className="relative w-full max-w-lg rounded-2xl border border-[color:var(--synapse)]/25 bg-[color:var(--void-warm)]/90 backdrop-blur-xl p-6 shadow-[0_30px_80px_-20px_rgba(124,211,255,0.3)]"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close (X) */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close cheat sheet"
              className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--synapse)]"
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

            {/* Header */}
            <div className="mb-5 flex items-center gap-2.5">
              <span
                aria-hidden
                className="h-2 w-2 rounded-full bg-[var(--synapse)] shadow-[0_0_10px_rgba(124,211,255,0.7)]"
              />
              <h2
                id="cheat-sheet-title"
                className="font-mono-hud text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--synapse)]"
              >
                KEYBOARD SHORTCUTS
              </h2>
            </div>

            {/* Shortcut grid */}
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SHORTCUTS.map(({ keys, action }) => (
                <div
                  key={keys.join('+')}
                  className="flex items-start gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3"
                >
                  <dt className="flex shrink-0 flex-wrap items-center gap-1">
                    {keys.map((key, i) => (
                      <span key={key} className="inline-flex items-center gap-1">
                        <Keycap label={key} />
                        {i < keys.length - 1 && (
                          <span className="text-[10px] text-gray-500">/</span>
                        )}
                      </span>
                    ))}
                  </dt>
                  <dd className="pt-0.5 text-[12px] leading-snug text-gray-300">
                    {action}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Hint line */}
            <p className="mt-5 text-center font-mono-hud text-[10px] uppercase tracking-[0.18em] text-gray-500">
              Press <Keycap label="?" /> or <Keycap label="Esc" /> to close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
