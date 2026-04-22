/**
 * Graph state for the Neural View.
 *
 * Owns the node/connection data, force-layout positions, and the
 * interaction state directly tied to graph topology (active, hovered,
 * expanded clusters). Camera, HUD, audio, and exploration state live in
 * their own stores — this one stays purely about "what's in the graph
 * and where it is".
 *
 * Middleware: `subscribeWithSelector` so consumers (e.g. `CinemaCamera`,
 * `NebulaBackground`) can subscribe to individual slices of state
 * efficiently without re-rendering on unrelated changes.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as THREE from 'three';

import { nodes as seedNodes } from '@/data/nodes';
import { connections as seedConnections } from '@/data/connections';
import type { NeuralNode, NeuralConnection } from '@/data/types';

export interface GraphState {
  /** Immutable seed of nodes from `src/data/nodes.ts`. */
  readonly nodes: readonly NeuralNode[];
  /** Immutable seed of connections from `src/data/connections.ts`. */
  readonly connections: readonly NeuralConnection[];
  /** World-space positions keyed by node id. Written by the force-layout hook. */
  readonly positions: ReadonlyMap<string, THREE.Vector3>;
  /** Node id of the currently-focused neuron, or `null` for ambient mode. */
  readonly activeNodeId: string | null;
  /** Node id currently under the pointer, or `null`. */
  readonly hoveredNodeId: string | null;
  /** Cluster parent ids that are currently expanded — their children render. */
  readonly expandedClusters: ReadonlySet<string>;

  // ── Actions ──────────────────────────────────────────────────────────────

  /** Focus a neuron. Does not auto-expand its cluster — call `toggleCluster`
   * separately if the activated node is a parent and you want its children
   * revealed. Passing an unknown id is allowed (consumers resolve it). */
  activate: (id: string) => void;

  /** Clear the active neuron. */
  deactivate: () => void;

  /** Set the hovered neuron id, or pass `null` to clear. */
  hover: (id: string | null) => void;

  /** Toggle whether a cluster's children are visible. Idempotent. */
  toggleCluster: (id: string) => void;

  /** Write a single node's world position. Creates a new Map reference so
   * `subscribeWithSelector` listeners on `positions` fire correctly. */
  setPosition: (id: string, pos: THREE.Vector3) => void;

  // ── Selectors ────────────────────────────────────────────────────────────

  /**
   * Structurally-visible nodes: every level-0 and level-1 node, plus the
   * children of clusters present in `expandedClusters`. `isHidden` nodes
   * (hidden unlockables) are filtered out here — renderers that want
   * unlocked hidden nodes should union the result with
   * `useExplorationStore.unlockedNodes`.
   */
  getVisibleNodes: () => NeuralNode[];
}

export const useGraphStore = create<GraphState>()(
  subscribeWithSelector((set, get) => ({
    nodes: seedNodes,
    connections: seedConnections,
    positions: new Map<string, THREE.Vector3>(),
    activeNodeId: null,
    hoveredNodeId: null,
    expandedClusters: new Set<string>(),

    activate: (id) => set({ activeNodeId: id }),

    deactivate: () => set({ activeNodeId: null }),

    hover: (id) => set({ hoveredNodeId: id }),

    toggleCluster: (id) =>
      set((state) => {
        const next = new Set(state.expandedClusters);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return { expandedClusters: next };
      }),

    setPosition: (id, pos) =>
      set((state) => {
        const next = new Map(state.positions);
        next.set(id, pos);
        return { positions: next };
      }),

    getVisibleNodes: () => {
      const { nodes, expandedClusters } = get();
      return nodes.filter((node) => {
        if (node.isHidden) return false;
        if (node.level <= 1) return true;
        return node.parentId !== null && expandedClusters.has(node.parentId);
      });
    },
  })),
);
