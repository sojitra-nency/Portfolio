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
import { useGraphStore } from '@/store/useGraphStore';
import Neuron from './nodes/Neuron';
import ConnectionsLayer from './connections/ConnectionsLayer';

export default function NeuralNetwork() {
  useForceLayout();
  // Centralised pulse orchestration — single useFrame that writes into
  // every registered neuron's pulseRef. Mounted once here so individual
  // Neuron components don't each register their own useFrame.
  useChainReaction();

  // Re-derive the visible set when the expanded-cluster set changes. The
  // store's `nodes` array is immutable post-seed, so no other dependency
  // is needed.
  const expandedClusters = useGraphStore((s) => s.expandedClusters);
  const visibleNodes = useMemo(
    () => useGraphStore.getState().getVisibleNodes(),
    [expandedClusters],
  );

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
