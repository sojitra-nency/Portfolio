'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nodes } from '@/data/nodes';

interface ExplorationStore {
  visitedNodes: Set<string>;
  unlockedNodes: Set<string>;
  explorationPercent: number;

  visitNode: (id: string) => void;
  isNodeVisited: (id: string) => boolean;
  checkUnlockConditions: () => void;
  isNodeUnlocked: (id: string) => boolean;
  reset: () => void;
}

const totalExplorableNodes = nodes.filter((n) => !n.isHidden && n.level > 0).length;

export const useExplorationStore = create<ExplorationStore>()(
  persist(
    (set, get) => ({
      visitedNodes: new Set<string>(),
      unlockedNodes: new Set<string>(),
      explorationPercent: 0,

      visitNode: (id: string) => {
        set((state) => {
          const next = new Set(state.visitedNodes);
          next.add(id);
          const percent = Math.round((next.size / totalExplorableNodes) * 100);
          return { visitedNodes: next, explorationPercent: Math.min(percent, 100) };
        });
        get().checkUnlockConditions();
      },

      isNodeVisited: (id: string) => {
        return get().visitedNodes.has(id);
      },

      checkUnlockConditions: () => {
        const { visitedNodes, unlockedNodes } = get();
        const nextUnlocked = new Set(unlockedNodes);

        // "Fun Facts" — visit all 6 primary clusters
        const primaryIds = ['about', 'skills', 'projects', 'experience', 'education', 'contact'];
        const allPrimaryVisited = primaryIds.every((id) => visitedNodes.has(id));
        if (allPrimaryVisited) nextUnlocked.add('hidden-funfacts');

        // "What's Next" — 90% exploration
        const percent = Math.round((visitedNodes.size / totalExplorableNodes) * 100);
        if (percent >= 90) nextUnlocked.add('hidden-future');

        set({ unlockedNodes: nextUnlocked });
      },

      isNodeUnlocked: (id: string) => {
        return get().unlockedNodes.has(id);
      },

      reset: () => {
        set({
          visitedNodes: new Set(),
          unlockedNodes: new Set(),
          explorationPercent: 0,
        });
      },
    }),
    {
      name: 'neural-nexus-exploration',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              visitedNodes: new Set(parsed.state.visitedNodes || []),
              unlockedNodes: new Set(parsed.state.unlockedNodes || []),
            },
          };
        },
        setItem: (name, value) => {
          const serialized = {
            ...value,
            state: {
              ...value.state,
              visitedNodes: Array.from(value.state.visitedNodes),
              unlockedNodes: Array.from(value.state.unlockedNodes),
            },
          };
          localStorage.setItem(name, JSON.stringify(serialized));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
