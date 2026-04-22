'use client';

/**
 * useForceLayout — runs a one-shot 3D force-directed layout over the
 * graph data on mount and writes final positions into the graph store.
 *
 * Forces (per the plan):
 *   - Charge repulsion:     forceManyBody().strength(-120)
 *   - Link attraction:      forceLink().distance(12).strength(0.4)
 *   - Gravity toward origin: forceCenter(0,0,0).strength(0.03)
 *   - Collision prevention:  forceCollide().radius(size * 3)
 *
 * The simulation is ticked synchronously until `alpha` decays below
 * `alphaMin` (~300 iterations with d3 defaults). At 77 nodes this runs
 * in a few milliseconds on mount — fine to block briefly. Positions
 * are then written once per node into `useGraphStore.setPosition`.
 *
 * Hidden nodes participate in layout too (they keep positions reserved
 * for when unlock reveals them). Once positions are written,
 * `getVisibleNodes()` filters which actually render.
 */

import { useEffect } from 'react';
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
} from 'd3-force-3d';
import * as THREE from 'three';

import { useGraphStore } from '@/store/useGraphStore';
import type { NodeLevel } from '@/data/types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Radius of the randomised initial sphere-shell scatter. Avoids zero-
 * distance overlaps at t = 0 which would otherwise detonate forceCollide. */
const INITIAL_RADIUS = 40;

/** Fallback radius per level when `node.size` isn't set on the data. */
const SIZE_BY_LEVEL: Record<NodeLevel, number> = {
  0: 2.0,
  1: 1.4,
  2: 0.9,
  3: 0.6,
  4: 0.5,
};

// ---------------------------------------------------------------------------
// Sim types
// ---------------------------------------------------------------------------

interface SimNode {
  id: string;
  radius: number;
  x: number;
  y: number;
  z: number;
}

interface SimLink {
  source: string;
  target: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export default function useForceLayout(): void {
  useEffect(() => {
    const { nodes, connections, setPosition } = useGraphStore.getState();
    const nodeIds = new Set(nodes.map((node) => node.id));

    // Build sim nodes with random initial positions on a sphere shell.
    const simNodes: SimNode[] = nodes.map((node) => {
      const radius = node.size ?? SIZE_BY_LEVEL[node.level];
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = INITIAL_RADIUS * (0.3 + Math.random() * 0.7);
      return {
        id: node.id,
        radius,
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
      };
    });

    const simLinks: SimLink[] = connections.flatMap((connection) => {
      const hasSource = nodeIds.has(connection.sourceId);
      const hasTarget = nodeIds.has(connection.targetId);

      if (!hasSource || !hasTarget) {
        console.warn('[useForceLayout] Skipping connection with missing node reference.', {
          connectionId: connection.id,
          sourceId: connection.sourceId,
          targetId: connection.targetId,
        });
        return [];
      }

      return [
        {
          source: connection.sourceId,
          target: connection.targetId,
        },
      ];
    });

    const simulation = forceSimulation<SimNode>(simNodes, 3)
      .force('charge', forceManyBody<SimNode>().strength(-120))
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(12)
          .strength(0.4),
      )
      .force('center', forceCenter(0, 0, 0).strength(0.03))
      .force(
        'collide',
        forceCollide<SimNode>().radius((d) => d.radius * 3),
      );

    // Synchronously tick until alpha decays below alphaMin.
    simulation.stop();
    let guard = 0;
    while (simulation.alpha() > simulation.alphaMin() && guard < 600) {
      simulation.tick();
      guard++;
    }

    // Write final positions into the store. setPosition creates a new Map
    // per call, which is fine for 77 one-time writes at startup.
    for (const sim of simNodes) {
      setPosition(sim.id, new THREE.Vector3(sim.x, sim.y, sim.z));
    }
  }, []);
}
