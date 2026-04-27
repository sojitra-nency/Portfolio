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
 * When a node is active, its direct level-2 neighbors are shown as
 * smaller satellite dots with dashed spokes, fading in/out with the
 * active selection. Visited satellites render at full opacity; unvisited
 * at 25% as a fog-of-war hint.
 *
 * Hidden below 768 px (mobile). Fades in via `hudEnter` on first mount
 * once force-layout has written positions.
 */

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
// Projection helper — reusable given pre-computed bounds
// ---------------------------------------------------------------------------

interface Bounds {
  minX: number; maxX: number; minY: number; maxY: number;
}

function projectPoint(
  pos: THREE.Vector3,
  bounds: Bounds,
  clamp = false,
): { x: number; y: number } {
  const xRange = bounds.maxX - bounds.minX || 1;
  const yRange = bounds.maxY - bounds.minY || 1;
  const x = PADDING + ((pos.x - bounds.minX) / xRange) * INNER;
  const y = PADDING + (1 - (pos.y - bounds.minY) / yRange) * INNER;
  if (clamp) {
    const margin = PADDING * 0.5;
    return {
      x: Math.min(SIZE - margin, Math.max(margin, x)),
      y: Math.min(SIZE - margin, Math.max(margin, y)),
    };
  }
  return { x, y };
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
  const connections = useGraphStore((s) => s.connections);
  const visitedNodes = useExplorationStore((s) => s.visitedNodes);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const nodesById = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  // Compute bounds from primary nodes only — satellites project into the
  // same coordinate space so they stay spatially coherent.
  const bounds = useMemo<Bounds | null>(() => {
    const pairs: THREE.Vector3[] = [];
    for (const id of ALL_IDS) {
      const pos = positions.get(id);
      if (pos) pairs.push(pos);
    }
    if (pairs.length === 0) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const pos of pairs) {
      if (pos.x < minX) minX = pos.x;
      if (pos.x > maxX) maxX = pos.x;
      if (pos.y < minY) minY = pos.y;
      if (pos.y > maxY) maxY = pos.y;
    }
    return { minX, maxX, minY, maxY };
  }, [positions]);

  // Project origin + 6 primary clusters from 3D → 2D.
  const projected = useMemo<ProjectedPoint[]>(() => {
    if (!bounds) return [];
    return ALL_IDS.flatMap((id) => {
      const pos = positions.get(id);
      if (!pos) return [];
      return [{ id, ...projectPoint(pos, bounds) }];
    });
  }, [positions, bounds]);

  // Satellite nodes: direct level-2 (non-hidden) neighbors of the active node.
  // Only shown when there is an active node and it has child/neighbor nodes.
  const satellites = useMemo<ProjectedPoint[]>(() => {
    if (!activeNodeId || !bounds) return [];

    // Collect all node IDs directly connected to the active node.
    const neighborIds = new Set<string>();
    for (const c of connections) {
      if (c.sourceId === activeNodeId) neighborIds.add(c.targetId);
      else if (c.targetId === activeNodeId) neighborIds.add(c.sourceId);
    }

    const result: ProjectedPoint[] = [];
    for (const id of neighborIds) {
      const node = nodesById.get(id);
      if (!node || node.isHidden || node.level < 2) continue;
      const pos = positions.get(id);
      if (!pos) continue;
      result.push({ id, ...projectPoint(pos, bounds, true) });
    }
    return result;
  }, [activeNodeId, connections, nodesById, positions, bounds]);

  if (isMobile) return null;
  if (projected.length === 0) return null;

  const origin = projected.find((p) => p.id === ORIGIN_ID);
  const primaries = projected.filter((p) => p.id !== ORIGIN_ID);

  // Find the primary dot that is the parent of the active node (for spoke origin).
  const activeNode = activeNodeId ? nodesById.get(activeNodeId) : null;
  const activeParentId = activeNode?.parentId ?? activeNodeId;
  const activeParentDot = projected.find((p) => p.id === activeParentId);

  return (
    <div className="fixed bottom-6 left-6 z-50">
    <motion.div
      variants={hudEnter(reducedMotion)}
      initial="hidden"
      animate="visible"
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

          {/* Satellite spokes: parent-primary → each satellite dot.
              Dashed + dimmer than primary spokes. */}
          <AnimatePresence>
            {activeParentDot &&
              satellites.map((s) => {
                const node = nodesById.get(s.id);
                if (!node) return null;
                const color = CATEGORY_COLORS[node.category];
                return (
                  <motion.line
                    key={`sat-line-${s.id}`}
                    x1={activeParentDot.x}
                    y1={activeParentDot.y}
                    x2={s.x}
                    y2={s.y}
                    stroke={color}
                    strokeWidth={0.7}
                    strokeDasharray="2 2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.35 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE_EXPO }}
                  />
                );
              })}
          </AnimatePresence>

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

          {/* Satellite dots — rendered above primaries so they're always
              visible even if positions overlap. */}
          <AnimatePresence>
            {satellites.map((s) => {
              const node = nodesById.get(s.id);
              if (!node) return null;
              const color = CATEGORY_COLORS[node.category];
              const visited = visitedNodes.has(s.id);
              const isActiveSat = activeNodeId === s.id;

              return (
                <motion.g
                  key={`sat-${s.id}`}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.25, ease: EASE_EXPO }}
                  style={{ transformOrigin: `${s.x}px ${s.y}px` }}
                >
                  {/* Active satellite pulse ring */}
                  {isActiveSat && !reducedMotion && (
                    <motion.circle
                      cx={s.x}
                      cy={s.y}
                      fill="none"
                      stroke={color}
                      strokeWidth={0.8}
                      initial={{ r: 2, opacity: 0.85 }}
                      animate={{ r: 8, opacity: 0 }}
                      transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                    />
                  )}

                  <motion.circle
                    cx={s.x}
                    cy={s.y}
                    r={2}
                    fill={color}
                    opacity={visited ? 1 : 0.25}
                    whileHover={{ scale: 1.6 }}
                    transition={{ duration: 0.18, ease: EASE_EXPO }}
                    style={{
                      transformOrigin: `${s.x}px ${s.y}px`,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      useGraphStore.getState().expandCluster(node.parentId ?? '');
                      useGraphStore.getState().activate(s.id);
                      useExplorationStore.getState().visit(s.id);
                      useCinemaStore.getState().focusOn(s.id);
                      useHudStore.getState().setDetailOpen(true);
                    }}
                    onMouseEnter={() => setHoveredId(s.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                </motion.g>
              );
            })}
          </AnimatePresence>

          {/* Hover tooltip — rendered last so it sits above everything.
              Rect x is clamped so the label never overflows the SVG edges. */}
          {hoveredId &&
            (() => {
              // Check satellites first, then primaries.
              const allDots = [
                ...satellites.map((s) => ({ ...s, isSat: true })),
                ...projected.map((p) => ({ ...p, isSat: false })),
              ];
              const p = allDots.find((x) => x.id === hoveredId);
              const node = p && nodesById.get(p.id);
              if (!p || !node) return null;
              const label = node.label.toUpperCase();
              const textWidth = Math.max(48, label.length * 5 + 16);
              const tooltipY = p.y - 14;
              const rectX = Math.min(
                SIZE - textWidth,
                Math.max(0, p.x - textWidth / 2),
              );
              const textX = rectX + textWidth / 2;
              return (
                <g pointerEvents="none">
                  <rect
                    x={rectX}
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
                    x={textX}
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
    </div>
  );
}
