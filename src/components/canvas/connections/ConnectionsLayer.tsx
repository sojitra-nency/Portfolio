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

  // Stable id → node index; `nodes` is immutable post-seed so this
  // builds once per mount.
  const nodeById = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  // Derive visible ids from the same source the network uses so a
  // connection is rendered iff both its neurons are. Includes unlocked
  // hidden nodes so edges to freshly-revealed neurons show up.
  const unlockedNodes = useExplorationStore((s) => s.unlockedNodes);
  const visibleIds = useMemo(() => {
    const base = useGraphStore.getState().getVisibleNodes();
    const all = useGraphStore.getState().nodes;
    const unlockedHidden = all.filter(
      (n) => n.isHidden && unlockedNodes.has(n.id),
    );
    return new Set([...base, ...unlockedHidden].map((n) => n.id));
  }, [expandedClusters, unlockedNodes]);

  const visibleConnections = useMemo(() => {
    return connections.filter(
      (c) => visibleIds.has(c.sourceId) && visibleIds.has(c.targetId),
    );
  }, [connections, visibleIds]);

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
