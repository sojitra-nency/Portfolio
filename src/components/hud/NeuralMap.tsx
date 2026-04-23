'use client';

/**
 * NeuralMap — bottom-right spatial overview of the graph.
 *
 * Renders the origin + 6 primary clusters as dots in a 180×180 SVG,
 * projected from their 3D force-layout positions to 2D (x/y pass through;
 * z is dropped; Y is flipped for SVG's top-down coordinate system).
 * Radial lines connect origin → each primary. Visited clusters render
 * at full opacity in their category color; unvisited sit at 30 % as a
 * fog-of-war hint. The currently-active node gets an expanding pulse
 * ring. Click a dot to trigger `useCinemaStore.focusOn(id)`. Hover
 * scales the dot 1.15× and shows a floating label.
 *
 * Hidden below 768 px (mobile). Fades in via `hudEnter` on first mount
 * once force-layout has written positions.
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';

import { useGraphStore } from '@/store/useGraphStore';
import { useExplorationStore } from '@/store/useExplorationStore';
import { useHudStore } from '@/store/useHudStore';
import { useCinemaStore } from '@/store/useCinemaStore';
import { CATEGORY_COLORS } from '@/data/types';
import { EASE_EXPO, hudEnter } from '@/lib/neural-motion';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const SIZE = 180;
const PADDING = 18;
const INNER = SIZE - 2 * PADDING;

const ORIGIN_ID = 'origin';
const PRIMARY_IDS = [
  'about',
  'skills',
  'projects',
  'experience',
  'education',
  'contact',
] as const;
const ALL_IDS: readonly string[] = [ORIGIN_ID, ...PRIMARY_IDS];

interface ProjectedPoint {
  id: string;
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NeuralMap() {
  const isMobile = useHudStore((s) => s.isMobile);
  const reducedMotion = useHudStore((s) => s.isReducedMotion);
  const positions = useGraphStore((s) => s.positions);
  const activeNodeId = useGraphStore((s) => s.activeNodeId);
  const nodes = useGraphStore((s) => s.nodes);
  const visitedNodes = useExplorationStore((s) => s.visitedNodes);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Project origin + 6 primary clusters from 3D → 2D, normalised to the
  // SVG viewBox with padding.
  const projected = useMemo<ProjectedPoint[]>(() => {
    const pairs: { id: string; pos: THREE.Vector3 }[] = [];
    for (const id of ALL_IDS) {
      const pos = positions.get(id);
      if (pos) pairs.push({ id, pos });
    }
    if (pairs.length === 0) return [];

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const { pos } of pairs) {
      if (pos.x < minX) minX = pos.x;
      if (pos.x > maxX) maxX = pos.x;
      if (pos.y < minY) minY = pos.y;
      if (pos.y > maxY) maxY = pos.y;
    }
    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;

    return pairs.map(({ id, pos }) => ({
      id,
      x: PADDING + ((pos.x - minX) / xRange) * INNER,
      // Flip Y so "up" in world = "up" on screen.
      y: PADDING + (1 - (pos.y - minY) / yRange) * INNER,
    }));
  }, [positions]);

  const nodesById = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  if (isMobile) return null;
  if (projected.length === 0) return null;

  const origin = projected.find((p) => p.id === ORIGIN_ID);
  const primaries = projected.filter((p) => p.id !== ORIGIN_ID);

  return (
    <motion.div
      variants={hudEnter(reducedMotion)}
      initial="hidden"
      animate="visible"
      className="fixed bottom-6 right-6 z-30"
    >
      <div className="rounded-xl border border-white/10 bg-[color:var(--void-warm)]/70 backdrop-blur-lg p-1.5">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="Neural graph minimap"
        >
          {/* Radial spokes origin → each primary. */}
          {origin &&
            primaries.map((p) => (
              <line
                key={`line-${p.id}`}
                x1={origin.x}
                y1={origin.y}
                x2={p.x}
                y2={p.y}
                stroke="white"
                strokeOpacity={0.12}
                strokeWidth={0.8}
              />
            ))}

          {/* Cluster dots (origin + primaries). */}
          {projected.map((p) => {
            const node = nodesById.get(p.id);
            if (!node) return null;
            const color = CATEGORY_COLORS[node.category];
            const visited = visitedNodes.has(p.id);
            const active = activeNodeId === p.id;
            const baseR = p.id === ORIGIN_ID ? 4 : 3.2;

            return (
              <g key={p.id}>
                {/* Pulsing ring on the active node. Reduced motion gets
                    a static thicker ring instead of an infinite animation. */}
                {active && !reducedMotion && (
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    initial={{ r: baseR, opacity: 0.85 }}
                    animate={{ r: baseR + 8, opacity: 0 }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: 'easeOut',
                    }}
                  />
                )}
                {active && reducedMotion && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={baseR + 3}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.2}
                    opacity={0.7}
                  />
                )}

                {/* Interactive dot — full color + opacity per visited state. */}
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r={baseR}
                  fill={color}
                  opacity={visited ? 1 : 0.3}
                  whileHover={{ scale: 1.15 }}
                  transition={{ duration: 0.18, ease: EASE_EXPO }}
                  style={{
                    transformOrigin: `${p.x}px ${p.y}px`,
                    cursor: 'pointer',
                  }}
                  onClick={() => useCinemaStore.getState().focusOn(p.id)}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                />
              </g>
            );
          })}

          {/* Hover tooltip — rendered last so it sits above the dots. */}
          {hoveredId &&
            (() => {
              const p = projected.find((x) => x.id === hoveredId);
              const node = p && nodesById.get(p.id);
              if (!p || !node) return null;
              const label = node.label.toUpperCase();
              const textWidth = Math.max(48, label.length * 5 + 16);
              const tooltipY = p.y - 14;
              return (
                <g pointerEvents="none">
                  <rect
                    x={p.x - textWidth / 2}
                    y={tooltipY - 8}
                    width={textWidth}
                    height={13}
                    rx={3}
                    fill="black"
                    fillOpacity={0.85}
                    stroke="white"
                    strokeOpacity={0.12}
                  />
                  <text
                    x={p.x}
                    y={tooltipY + 1}
                    textAnchor="middle"
                    fill="white"
                    fontSize={8}
                    fontFamily="var(--font-jetbrains), monospace"
                    letterSpacing={0.8}
                  >
                    {label}
                  </text>
                </g>
              );
            })()}
        </svg>
      </div>
    </motion.div>
  );
}
