'use client';

/**
 * useKeyboardNav — global keyboard shortcuts for the Neural View.
 *
 * Shortcut map:
 *   Esc          → deactivate node + close detail + return camera to ambient
 *   Home / 0     → full reset (deactivate, close detail, camera home)
 *   Tab          → cycle forward through visible nodes (wraps)
 *   Shift + Tab  → cycle backward (wraps)
 *   Enter        → open detail card on the current active node
 *   M            → toggle mute (useAudioStore)
 *   G            → toggle guided tour — flips cinema mode into/out of
 *                  `tour` and hud.isTourActive together
 *   ?            → toggle the key cheat-sheet overlay
 *
 * Typing guard: events are ignored if the target is an `<input>`,
 * `<textarea>`, `<select>`, or a `contenteditable` element — so users
 * filling future forms or rich-text regions aren't hijacked.
 *
 * Mount once from a client-side component (page.tsx at Task 24).
 */

import { useEffect } from 'react';

import { useGraphStore } from '@/store/useGraphStore';
import { useHudStore } from '@/store/useHudStore';
import { useCinemaStore } from '@/store/useCinemaStore';
import { useAudioStore } from '@/store/useAudioStore';

// ---------------------------------------------------------------------------
// Typing guard
// ---------------------------------------------------------------------------

function isTypingInInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export default function useKeyboardNav(): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingInInput(e.target)) return;

      switch (e.key) {
        case 'Escape': {
          e.preventDefault();
          useGraphStore.getState().deactivate();
          useHudStore.getState().setDetailOpen(false);
          useCinemaStore.getState().returnToAmbient();
          break;
        }

        case 'Home':
        case '0': {
          e.preventDefault();
          useGraphStore.getState().deactivate();
          useHudStore.getState().setDetailOpen(false);
          useCinemaStore.getState().returnToAmbient();
          break;
        }

        case 'Tab': {
          e.preventDefault();
          const direction: 1 | -1 = e.shiftKey ? -1 : 1;
          const state = useGraphStore.getState();
          const visible = state.getVisibleNodes();
          if (visible.length === 0) break;

          const currentIdx = state.activeNodeId
            ? visible.findIndex((n) => n.id === state.activeNodeId)
            : -1;

          const nextIdx =
            currentIdx === -1
              ? direction === 1
                ? 0
                : visible.length - 1
              : (currentIdx + direction + visible.length) % visible.length;

          state.activate(visible[nextIdx].id);
          break;
        }

        case 'Enter': {
          const activeId = useGraphStore.getState().activeNodeId;
          if (activeId) {
            e.preventDefault();
            useHudStore.getState().setDetailOpen(true);
          }
          break;
        }

        case 'm':
        case 'M': {
          const audio = useAudioStore.getState();
          audio.setMuted(!audio.isMuted);
          break;
        }

        case 'g':
        case 'G': {
          const hud = useHudStore.getState();
          const next = !hud.isTourActive;
          hud.setTourActive(next);
          if (next) {
            useCinemaStore.getState().startTour();
          } else {
            useCinemaStore.getState().returnToAmbient();
          }
          break;
        }

        case '?': {
          const hud = useHudStore.getState();
          hud.setCheatSheetOpen(!hud.isCheatSheetOpen);
          break;
        }
      }

      // Cmd+K / Ctrl+K — open command palette (checked outside the switch
      // so modifier key combos don't need a dedicated case branch).
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const hud = useHudStore.getState();
        hud.setCommandPaletteOpen(!hud.isCommandPaletteOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
