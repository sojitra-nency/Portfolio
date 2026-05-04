'use client';

/**
 * ConnectionsLayer — renders every visible edge as a `<Synapse>`.
 *
 * Filters the graph's 115 connections to those whose endpoints are both
 * structurally visible (level ≤ 1 or inside an expanded cluster), so
 * unexpanded children's edges don't dangle between invisible neurons.
 *
 * Per-Synapse props are all primitives (ids / color / dashed flag), so
 * `memo(Synapse)` prevents rebuilds when this layer re-renders for
 * unrelated reasons (e.g. expanding a cluster that doesn't affect a
 * given edge).
 */

import { useMemo } from 'react';

import { useGraphStore } from '@/store/useGraphStore';
import { useExplorationStore } from '@/store/useExplorationStore';
import { CATEGORY_COLORS } from '@/data/types';
import Synapse from './Synapse';

/** Fallback color when the source node can't be resolved (shouldn't happen
 * in practice — every connection's endpoints are seeded in data). */
const FALLBACK_COLOR = '#7CD3FF'; // --synapse

export default function ConnectionsLayer() {
  const connections = useGraphStore((s) => s.connections);
  const nodes = useGraphStore((s) => s.nodes);
  const expandedClusters = useGraphStore((s) => s.expandedClusters);
  const unlockedNodes = useExplorationStore((s) => s.unlockedNodes);

  // Stable id → node lookup; nodes array is immutable post-seed.
  const nodeById = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  // Build visible id set directly from the subscribed state values instead
  // of calling getState() inside the memo (which bypasses Zustand's
  // subscription and can read stale data). Combining both memos into one
  // also halves the number of useMemo evaluations on cluster expand.
  const visibleConnections = useMemo(() => {
    // Visible node ids: level 0/1 always visible, level 2+ only when their
    // parent cluster is expanded, plus any unlocked hidden nodes.
    const visibleIds = new Set<string>();
    for (const n of nodes) {
      if (n.isHidden) {
        if (unlockedNodes.has(n.id)) visibleIds.add(n.id);
        continue;
      }
      if (n.level <= 1) { visibleIds.add(n.id); continue; }
      if (n.parentId && expandedClusters.has(n.parentId)) visibleIds.add(n.id);
    }
    return connections.filter(
      (c) => visibleIds.has(c.sourceId) && visibleIds.has(c.targetId),
    );
  }, [nodes, connections, expandedClusters, unlockedNodes]);

  return (
    <>
      {visibleConnections.map((conn) => {
        const sourceNode = nodeById.get(conn.sourceId);
        const color = sourceNode
          ? CATEGORY_COLORS[sourceNode.category]
          : FALLBACK_COLOR;
        return (
          <Synapse
            key={conn.id}
            sourceId={conn.sourceId}
            targetId={conn.targetId}
            color={color}
            dashed={conn.type === 'cross-domain'}
          />
        );
      })}
    </>
  );
}
