'use client';

import { useRef, useEffect, useCallback } from 'react';
import { NeuralNode, NeuralConnection, NodePosition } from '@/data/types';
import { FORCE_CONFIG, NODE_SIZES } from '@/lib/constants';

interface SimNode {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
  level: number;
  parentId: string | null;
  radius: number;
}

interface SimLink {
  source: string;
  target: string;
  strength: number;
}

export function useForceLayout(
  visibleNodes: NeuralNode[],
  visibleConnections: NeuralConnection[],
  expandedClusters: Set<string>
) {
  const positionsRef = useRef<Map<string, NodePosition>>(new Map());
  const simNodesRef = useRef<Map<string, SimNode>>(new Map());
  const frameRef = useRef<number>(0);
  const alphaRef = useRef(1);

  const initializeNode = useCallback((node: NeuralNode): SimNode => {
    const existing = simNodesRef.current.get(node.id);
    if (existing) return existing;

    // Position children near their parent
    const parent = simNodesRef.current.get(node.parentId || '');
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 5;

    const baseX = parent ? parent.x : 0;
    const baseY = parent ? parent.y : 0;

    return {
      id: node.id,
      x: baseX + Math.cos(angle) * dist * (node.level === 0 ? 0 : 1),
      y: baseY + Math.sin(angle) * dist * (node.level === 0 ? 0 : 1),
      z: (node.level || 0) * -1.5,
      vx: 0,
      vy: 0,
      vz: 0,
      fx: node.level === 0 ? 0 : null,
      fy: node.level === 0 ? 0 : null,
      fz: null,
      level: node.level,
      parentId: node.parentId,
      radius: NODE_SIZES[node.level] || 1,
    };
  }, []);

  // Update simulation when visible nodes change
  useEffect(() => {
    const nodeMap = new Map<string, SimNode>();

    for (const node of visibleNodes) {
      nodeMap.set(node.id, initializeNode(node));
    }

    simNodesRef.current = nodeMap;
    alphaRef.current = 0.8; // reheat
    // expandedClusters change triggers new visibleNodes which triggers this effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleNodes, expandedClusters, initializeNode]);

  const tick = useCallback(() => {
    const nodesMap = simNodesRef.current;
    const nodesArr = Array.from(nodesMap.values());
    const links: SimLink[] = visibleConnections.map((c) => ({
      source: c.sourceId,
      target: c.targetId,
      strength: c.strength,
    }));

    if (alphaRef.current < 0.001) return;
    alphaRef.current *= 1 - FORCE_CONFIG.alphaDecay;

    const alpha = alphaRef.current;

    // Charge repulsion (simplified n-body)
    for (let i = 0; i < nodesArr.length; i++) {
      for (let j = i + 1; j < nodesArr.length; j++) {
        const a = nodesArr[i];
        const b = nodesArr[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy + 0.01;
        const dist = Math.sqrt(distSq);
        const force = (FORCE_CONFIG.chargeStrength * alpha) / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (a.fx == null) a.vx -= fx;
        if (a.fy == null) a.vy -= fy;
        if (b.fx == null) b.vx += fx;
        if (b.fy == null) b.vy += fy;
      }
    }

    // Link attraction
    for (const link of links) {
      const source = nodesMap.get(link.source);
      const target = nodesMap.get(link.target);
      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const targetDist = FORCE_CONFIG.linkDistance;
      const force = (dist - targetDist) * FORCE_CONFIG.linkStrength * link.strength * alpha;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (source.fx == null) source.vx += fx;
      if (source.fy == null) source.vy += fy;
      if (target.fx == null) target.vx -= fx;
      if (target.fy == null) target.vy -= fy;
    }

    // Center gravity
    for (const node of nodesArr) {
      if (node.fx == null) node.vx -= node.x * FORCE_CONFIG.centerStrength * alpha;
      if (node.fy == null) node.vy -= node.y * FORCE_CONFIG.centerStrength * alpha;
    }

    // Collision
    for (let i = 0; i < nodesArr.length; i++) {
      for (let j = i + 1; j < nodesArr.length; j++) {
        const a = nodesArr[i];
        const b = nodesArr[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const minDist = (a.radius + b.radius) * FORCE_CONFIG.collisionRadius;
        if (dist < minDist) {
          const overlap = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const ny = dy / dist;
          if (a.fx == null) a.x -= nx * overlap;
          if (a.fy == null) a.y -= ny * overlap;
          if (b.fx == null) b.x += nx * overlap;
          if (b.fy == null) b.y += ny * overlap;
        }
      }
    }

    // Apply velocity
    for (const node of nodesArr) {
      node.vx *= 1 - FORCE_CONFIG.velocityDecay;
      node.vy *= 1 - FORCE_CONFIG.velocityDecay;

      if (node.fx != null) {
        node.x = node.fx;
        node.vx = 0;
      } else {
        node.x += node.vx;
      }
      if (node.fy != null) {
        node.y = node.fy;
        node.vy = 0;
      } else {
        node.y += node.vy;
      }
    }

    // Write positions
    const positions = new Map<string, NodePosition>();
    for (const node of nodesArr) {
      positions.set(node.id, {
        id: node.id,
        x: node.x,
        y: node.y,
        z: node.z,
      });
    }
    positionsRef.current = positions;
    frameRef.current++;
  }, [visibleConnections]);

  const getPosition = useCallback((id: string): NodePosition => {
    return positionsRef.current.get(id) || { id, x: 0, y: 0, z: 0 };
  }, []);

  const getPositions = useCallback((): Map<string, NodePosition> => {
    return positionsRef.current;
  }, []);

  const reheat = useCallback(() => {
    alphaRef.current = 0.5;
  }, []);

  return { tick, getPosition, getPositions, reheat, frameCount: frameRef };
}
