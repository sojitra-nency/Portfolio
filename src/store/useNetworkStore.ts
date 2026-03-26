'use client';

import { create } from 'zustand';
import { nodes } from '@/data/nodes';
import { connections } from '@/data/connections';
import { NeuralNode, NeuralConnection } from '@/data/types';

interface NetworkStore {
  // Data
  nodes: NeuralNode[];
  connections: NeuralConnection[];

  // Current state
  activeNodeId: string | null;
  hoveredNodeId: string | null;
  zoomLevel: number;
  cameraTarget: [number, number, number];

  // Expanded clusters
  expandedClusters: Set<string>;

  // Computed helpers
  getVisibleNodes: () => NeuralNode[];
  getVisibleConnections: () => NeuralConnection[];
  getNodeById: (id: string) => NeuralNode | undefined;
  getChildNodes: (parentId: string) => NeuralNode[];

  // Actions
  activateNode: (id: string) => void;
  deactivateNode: () => void;
  hoverNode: (id: string | null) => void;
  expandCluster: (parentId: string) => void;
  collapseCluster: (parentId: string) => void;
  toggleCluster: (parentId: string) => void;
  setZoom: (level: number) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  resetView: () => void;
}

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  nodes,
  connections,
  activeNodeId: null,
  hoveredNodeId: null,
  zoomLevel: 50,
  cameraTarget: [0, 0, 0],
  expandedClusters: new Set<string>(),

  getNodeById: (id: string) => {
    return get().nodes.find((n) => n.id === id);
  },

  getChildNodes: (parentId: string) => {
    return get().nodes.filter((n) => n.parentId === parentId && !n.isHidden);
  },

  getVisibleNodes: () => {
    const { nodes, expandedClusters } = get();
    return nodes.filter((node) => {
      if (node.isHidden) return false;
      if (node.level === 0 || node.level === 1) return true;
      // Show level 2+ only if parent cluster is expanded
      let current = node;
      while (current.parentId) {
        const parent = nodes.find((n) => n.id === current.parentId);
        if (!parent) break;
        if (parent.level >= 1 && !expandedClusters.has(parent.id)) return false;
        current = parent;
      }
      return true;
    });
  },

  getVisibleConnections: () => {
    const visibleNodes = get().getVisibleNodes();
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    return get().connections.filter(
      (c) =>
        c.type !== 'hidden' &&
        visibleIds.has(c.sourceId) &&
        visibleIds.has(c.targetId)
    );
  },

  activateNode: (id: string) => {
    const node = get().getNodeById(id);
    if (!node) return;
    const hasChildren = get().nodes.some((n) => n.parentId === id && !n.isHidden);
    set({ activeNodeId: id });
    if (hasChildren) {
      get().expandCluster(id);
    }
  },

  deactivateNode: () => {
    set({ activeNodeId: null });
  },

  hoverNode: (id: string | null) => {
    set({ hoveredNodeId: id });
  },

  expandCluster: (parentId: string) => {
    set((state) => {
      const next = new Set(state.expandedClusters);
      next.add(parentId);
      return { expandedClusters: next };
    });
  },

  collapseCluster: (parentId: string) => {
    set((state) => {
      const next = new Set(state.expandedClusters);
      next.delete(parentId);
      return { expandedClusters: next };
    });
  },

  toggleCluster: (parentId: string) => {
    const expanded = get().expandedClusters;
    if (expanded.has(parentId)) {
      get().collapseCluster(parentId);
    } else {
      get().expandCluster(parentId);
    }
  },

  setZoom: (level: number) => {
    set({ zoomLevel: level });
  },

  setCameraTarget: (target: [number, number, number]) => {
    set({ cameraTarget: target });
  },

  resetView: () => {
    set({
      activeNodeId: null,
      hoveredNodeId: null,
      zoomLevel: 50,
      cameraTarget: [0, 0, 0],
      expandedClusters: new Set(),
    });
  },
}));
