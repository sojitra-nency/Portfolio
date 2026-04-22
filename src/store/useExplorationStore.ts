/**
 * Exploration progression state — what the user has visited, what they've
 * unlocked, and the overall coherence percentage.
 *
 * Persistence:
 * - `visitedNodes` and `unlockedNodes` are persisted to localStorage so
 *   returning visitors resume where they left off (and don't re-unlock
 *   content from scratch).
 * - Sets are serialized as arrays via custom reviver/replacer.
 * - On rehydrate, `explorationPercent` is recomputed from `visitedNodes`
 *   so the number is always consistent with the stored set.
 *
 * Unlock rules (evaluated by `checkUnlocks`):
 * - `hidden-funfacts` — all 6 primary clusters visited (about, skills,
 *   projects, experience, education, contact).
 * - `hidden-future`   — ≥90% exploration.
 *
 * Consumers wanting to react to brand-new unlocks should use
 * `subscribeWithSelector` and diff the incoming vs previous set.
 */

import { create } from 'zustand';
import {
  subscribeWithSelector,
  persist,
  createJSONStorage,
} from 'zustand/middleware';

import { nodes as seedNodes } from '@/data/nodes';

/** Level-1 nodes whose visit gates the `hidden-funfacts` unlock. */
const PRIMARY_CLUSTERS: readonly string[] = [
  'about',
  'skills',
  'projects',
  'experience',
  'education',
  'contact',
];

/** Denominator for `explorationPercent` — every non-hidden node. */
const TOTAL_EXPLORABLE = seedNodes.filter((n) => !n.isHidden).length;

function computePercent(visited: ReadonlySet<string>): number {
  if (TOTAL_EXPLORABLE === 0) return 0;
  return Math.min(100, Math.round((visited.size / TOTAL_EXPLORABLE) * 100));
}

export interface ExplorationState {
  visitedNodes: Set<string>;
  unlockedNodes: Set<string>;
  explorationPercent: number;

  /** Record a node visit. Idempotent; no-ops if already visited. Also
   * recomputes `explorationPercent` and triggers `checkUnlocks`. */
  visit: (id: string) => void;

  /** Evaluate unlock conditions against the current visited set and add
   * newly-unlocked node ids to `unlockedNodes`. Safe to call ad-hoc.
   * Emits via `onUnlock()` for each newly-added id. */
  checkUnlocks: () => void;
}

// ---------------------------------------------------------------------------
// Unlock pub/sub — fires whenever a node transitions from locked → unlocked.
// Consumers subscribe via `onUnlock()`; the module-level listener set is
// fired synchronously from `checkUnlocks`, so subscribers run before React's
// next render (which lets UnlockReveal populate its activeReveals map in
// time for the newly-mounting Neuron to pick up the "just unlocking" state).
// ---------------------------------------------------------------------------

type UnlockListener = (id: string) => void;
const unlockListeners = new Set<UnlockListener>();

/** Subscribe to unlock events. Returns an unsubscribe function suitable
 * as a `useEffect` cleanup. */
export function onUnlock(listener: UnlockListener): () => void {
  unlockListeners.add(listener);
  return () => {
    unlockListeners.delete(listener);
  };
}

function emitUnlock(id: string): void {
  for (const listener of unlockListeners) {
    try {
      listener(id);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[useExplorationStore] unlock listener threw', err);
    }
  }
}

/**
 * SSR-safe localStorage fallback — returned when `window` is undefined
 * (Next.js server-rendering pass). The real `localStorage` is used in the
 * browser.
 */
const ssrSafeStorage: Storage = {
  length: 0,
  clear: () => {},
  getItem: () => null,
  key: () => null,
  removeItem: () => {},
  setItem: () => {},
};

type PersistedExploration = {
  visitedNodes: Set<string>;
  unlockedNodes: Set<string>;
};

export const useExplorationStore = create<ExplorationState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        visitedNodes: new Set<string>(),
        unlockedNodes: new Set<string>(),
        explorationPercent: 0,

        visit: (id) => {
          const state = get();
          if (state.visitedNodes.has(id)) return;

          const nextVisited = new Set(state.visitedNodes);
          nextVisited.add(id);

          set({
            visitedNodes: nextVisited,
            explorationPercent: computePercent(nextVisited),
          });

          get().checkUnlocks();
        },

        checkUnlocks: () => {
          const { visitedNodes, unlockedNodes, explorationPercent } = get();
          const next = new Set(unlockedNodes);
          const newlyUnlocked: string[] = [];

          if (
            PRIMARY_CLUSTERS.every((id) => visitedNodes.has(id)) &&
            !unlockedNodes.has('hidden-funfacts')
          ) {
            next.add('hidden-funfacts');
            newlyUnlocked.push('hidden-funfacts');
          }
          if (
            explorationPercent >= 90 &&
            !unlockedNodes.has('hidden-future')
          ) {
            next.add('hidden-future');
            newlyUnlocked.push('hidden-future');
          }

          if (newlyUnlocked.length > 0) {
            set({ unlockedNodes: next });
            // Emit AFTER the state update so listeners that read the store
            // (e.g. UnlockReveal looking up the node) see the new set.
            for (const id of newlyUnlocked) emitUnlock(id);
          }
        },
      }),
      {
        name: 'neural-nexus-exploration',
        storage: createJSONStorage<PersistedExploration>(
          () => (typeof window !== 'undefined' ? localStorage : ssrSafeStorage),
          {
            // Revive arrays back into Sets when reading from storage.
            reviver: (key, value) => {
              if (
                (key === 'visitedNodes' || key === 'unlockedNodes') &&
                Array.isArray(value)
              ) {
                return new Set(value as string[]);
              }
              return value;
            },
            // Serialize Sets as arrays when writing to storage.
            replacer: (_key, value) => {
              if (value instanceof Set) return Array.from(value);
              return value;
            },
          },
        ),
        partialize: (state) => ({
          visitedNodes: state.visitedNodes,
          unlockedNodes: state.unlockedNodes,
        }),
        // Recompute percent from the hydrated visited set so the number
        // is always in sync with the stored evidence.
        merge: (persisted, current) => {
          const p = persisted as Partial<PersistedExploration> | undefined;
          const visited = p?.visitedNodes ?? new Set<string>();
          const unlocked = p?.unlockedNodes ?? new Set<string>();
          return {
            ...current,
            visitedNodes: visited,
            unlockedNodes: unlocked,
            explorationPercent: computePercent(visited),
          };
        },
      },
    ),
  ),
);
