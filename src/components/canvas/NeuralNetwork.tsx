'use client';

/**
 * NeuralNetwork — orchestrates the graph layer of the scene.
 *
 * Runs the one-shot force layout (positions flow into the graph store)
 * and then renders one `<Neuron>` per structurally-visible node. Hidden
 * (unlockable) nodes are filtered by `getVisibleNodes`; connections
 * layer is wired separately in Task 17.
 *
 * Subscribes to `expandedClusters` so that toggling a cluster re-runs
 * `getVisibleNodes()` through `useMemo`. The node list itself is seeded
 * once from data and never mutated, so we read the filtered list via
 * `useGraphStore.getState().getVisibleNodes()` and trust the memo dep
 * on `expandedClusters` to keep it fresh.
 */

import { useMemo } from 'react';

import useForceLayout from '@/hooks/useForceLayout';
import useChainReaction from '@/hooks/useChainReaction';
import usePointerMagnetism from '@/hooks/usePointerMagnetism';
import { useGraphStore } from '@/store/useGraphStore';
import { useExplorationStore } from '@/store/useExplorationStore';
import Neuron from './nodes/Neuron';
import ConnectionsLayer from './connections/ConnectionsLayer';

export default function NeuralNetwork() {
  useForceLayout();
  // Centralised pulse orchestration — single useFrame that writes into
  // every registered neuron's pulseRef. Mounted once here so individual
  // Neuron components don't each register their own useFrame.
  useChainReaction();
  // Pointer-magnetism — cursor attracts nearby neurons (desktop only,
  // skipped on reduced motion). Writes per-node velocity refs that
  // Neuron.tsx applies as a position offset.
  usePointerMagnetism();

  // Re-derive the visible set when the expanded-cluster set OR the
  // unlocked-nodes set changes. Unlocked hidden nodes are unioned into
  // the base visibility so they can materialise in via UnlockReveal.
  const expandedClusters = useGraphStore((s) => s.expandedClusters);
  const unlockedNodes = useExplorationStore((s) => s.unlockedNodes);
  const visibleNodes = useMemo(() => {
    const base = useGraphStore.getState().getVisibleNodes();
    const all = useGraphStore.getState().nodes;
    const unlockedHidden = all.filter(
      (n) => n.isHidden && unlockedNodes.has(n.id),
    );
    return [...base, ...unlockedHidden];
  }, [expandedClusters, unlockedNodes]);

  return (
    <>
      {/* Connections render first so transparent tubes sit behind
       * neurons in R3F's render order. */}
      <ConnectionsLayer />
      {visibleNodes.map((node) => (
        <Neuron key={node.id} node={node} />
      ))}
    </>
  );
}
