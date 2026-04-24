'use client';

/**
 * CommandPalette — Cmd+K / Ctrl+K fuzzy search over all graph nodes.
 *
 * Search is powered by Fuse.js indexing: id, label, summary, description,
 * and metadata.tags. Results are capped at 8 to keep the list scannable.
 *
 * Keyboard behaviour:
 *   ↑ / ↓   — move the highlighted result
 *   Enter   — select highlighted result
 *   Esc     — close (also handled by useKeyboardNav, but duplicated here
 *              so the palette closes even when the input is focused and
 *              the global handler's typing guard would skip it)
 *
 * On select: activate + focusOn + open DetailCard + play select-chime.
 *
 * Styling follows the DetailCard / KeyCheatSheet aesthetic:
 * `--void-warm`/80 background, backdrop-blur-xl, 1 px category-tinted
 * border on the selected result, synapse-tinted input focus ring.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import { AnimatePresence, motion } from 'framer-motion';

import { useHudStore } from '@/store/useHudStore';
import { useGraphStore } from '@/store/useGraphStore';
import { useCinemaStore } from '@/store/useCinemaStore';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/data/types';
import { nodes as allNodes } from '@/data/nodes';
import { playFX } from '@/hooks/useAudio';
import { EASE_EXPO } from '@/lib/neural-motion';
import type { NeuralNode } from '@/data/types';

// ---------------------------------------------------------------------------
// Fuse index — built once at module level (data is static)
// ---------------------------------------------------------------------------

const fuse = new Fuse(allNodes, {
  keys: [
    { name: 'label', weight: 3 },
    { name: 'id', weight: 2 },
    { name: 'summary', weight: 2 },
    { name: 'description', weight: 1 },
    { name: 'metadata.tags', weight: 1 },
  ],
  threshold: 0.35,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 1,
});

const MAX_RESULTS = 8;

// ---------------------------------------------------------------------------
// Result row
// ---------------------------------------------------------------------------

function ResultRow({
  node,
  isHighlighted,
  onSelect,
  onHover,
}: {
  node: NeuralNode;
  isHighlighted: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const color = CATEGORY_COLORS[node.category];
  const label = CATEGORY_LABELS[node.category];

  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onClick={onSelect}
      className="w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors focus:outline-none"
      style={
        isHighlighted
          ? {
              background: `${color}14`,
              border: `1px solid ${color}40`,
            }
          : {
              background: 'transparent',
              border: '1px solid transparent',
            }
      }
    >
      {/* Category dot */}
      <span
        className="shrink-0 h-1.5 w-1.5 rounded-full"
        style={{
          background: color,
          boxShadow: isHighlighted ? `0 0 8px ${color}` : 'none',
        }}
        aria-hidden
      />

      {/* Labels */}
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-white truncate">
          {node.label}
        </span>
        {node.summary && (
          <span className="block font-mono-hud text-[10px] text-gray-500 truncate mt-0.5">
            {node.summary}
          </span>
        )}
      </div>

      {/* Category badge */}
      <span
        className="shrink-0 font-mono-hud text-[9px] uppercase tracking-[0.18em]"
        style={{ color }}
      >
        {label}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// CommandPalette
// ---------------------------------------------------------------------------

export default function CommandPalette() {
  const isOpen = useHudStore((s) => s.isCommandPaletteOpen);
  const reducedMotion = useHudStore((s) => s.isReducedMotion);

  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo<NeuralNode[]>(() => {
    if (!query.trim()) {
      // Empty query — show all level-0 and level-1 nodes as defaults.
      return allNodes
        .filter((n) => n.level <= 1 && !n.isHidden)
        .slice(0, MAX_RESULTS);
    }
    return fuse
      .search(query)
      .slice(0, MAX_RESULTS)
      .map((r) => r.item);
  }, [query]);

  // Reset state when palette opens.
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setHighlighted(0);
    // Defer focus so Framer's enter animation has started.
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  // Clamp highlight when result list shrinks.
  useEffect(() => {
    setHighlighted((h) => Math.min(h, Math.max(0, results.length - 1)));
  }, [results.length]);

  const close = useCallback(() => {
    useHudStore.getState().setCommandPaletteOpen(false);
  }, []);

  const select = useCallback(
    (node: NeuralNode) => {
      close();
      useGraphStore.getState().activate(node.id);
      useCinemaStore.getState().focusOn(node.id);
      useHudStore.getState().setDetailOpen(true);
      playFX('select-chime');
    },
    [close],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlighted((h) => (h + 1) % Math.max(1, results.length));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlighted((h) =>
            (h - 1 + Math.max(1, results.length)) % Math.max(1, results.length),
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (results[highlighted]) select(results[highlighted]);
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [results, highlighted, select, close],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cmd-backdrop"
            className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: EASE_EXPO }}
            onClick={close}
            aria-hidden
          />

          {/* Palette */}
          <motion.div
            key="cmd-palette"
            role="dialog"
            aria-modal="true"
            aria-label="Node search"
            className="fixed left-1/2 top-[20%] z-[56] w-full max-w-lg -translate-x-1/2"
            initial={reducedMotion ? false : { opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: EASE_EXPO }}
          >
            <div className="rounded-xl border border-[color:var(--synapse)]/25 bg-[color:var(--void-warm)]/90 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(124,211,255,0.25)] overflow-hidden">

              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                {/* Search icon */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-gray-500"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setHighlighted(0);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Search neurons…"
                  aria-label="Search neurons"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 outline-none caret-[color:var(--synapse)]"
                />

                {/* Esc hint */}
                <kbd className="shrink-0 inline-flex items-center justify-center rounded border border-white/20 bg-white/[0.04] px-1.5 py-0.5 font-mono-hud text-[10px] text-gray-500">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="p-2 max-h-[320px] overflow-y-auto scrollbar-none">
                {results.length === 0 ? (
                  <p className="px-3 py-4 text-center font-mono-hud text-[11px] text-gray-600">
                    No neurons found
                  </p>
                ) : (
                  results.map((node, i) => (
                    <ResultRow
                      key={node.id}
                      node={node}
                      isHighlighted={i === highlighted}
                      onSelect={() => select(node)}
                      onHover={() => setHighlighted(i)}
                    />
                  ))
                )}
              </div>

              {/* Footer hint */}
              <div className="flex items-center gap-3 px-4 py-2 border-t border-white/[0.06]">
                <span className="font-mono-hud text-[9px] text-gray-600 uppercase tracking-[0.18em]">
                  ↑↓ navigate · Enter select · Esc close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
