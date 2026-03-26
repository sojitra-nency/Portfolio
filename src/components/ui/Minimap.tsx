'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNetworkStore } from '@/store/useNetworkStore';
import { useExplorationStore } from '@/store/useExplorationStore';
import { useUIStore } from '@/store/useUIStore';
import { CATEGORY_COLORS } from '@/data/types';
import { nodes as allNodes } from '@/data/nodes';
import { connections as allConnections } from '@/data/connections';

const MAP_SIZE = 140;
const OFFSET = MAP_SIZE / 2;

const mapNodes = allNodes.filter((n) => n.level <= 1 && !n.isHidden);

export default function Minimap() {
  const isMinimapVisible = useUIStore((s) => s.isMinimapVisible);
  const isMobile = useUIStore((s) => s.isMobile);
  const activeNodeId = useNetworkStore((s) => s.activeNodeId);
  const visitedNodes = useExplorationStore((s) => s.visitedNodes);

  // Simple radial layout for minimap
  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const primaries = mapNodes.filter((n) => n.level === 1);
    pos['origin'] = { x: OFFSET, y: OFFSET };

    primaries.forEach((node, i) => {
      const angle = (i / primaries.length) * Math.PI * 2 - Math.PI / 2;
      const radius = 40;
      pos[node.id] = {
        x: OFFSET + Math.cos(angle) * radius,
        y: OFFSET + Math.sin(angle) * radius,
      };
    });
    return pos;
  }, []);

  if (isMobile || !isMinimapVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 2.5 }}
      className="fixed bottom-6 right-6 z-40"
    >
      <div className="bg-[#12121F]/80 backdrop-blur-md rounded-xl border border-white/5 p-2">
        <svg width={MAP_SIZE} height={MAP_SIZE} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}>
          {/* Connections */}
          {allConnections
            .filter((c) => c.type === 'primary' && positions[c.sourceId] && positions[c.targetId])
            .map((conn) => (
              <line
                key={conn.id}
                x1={positions[conn.sourceId]?.x}
                y1={positions[conn.sourceId]?.y}
                x2={positions[conn.targetId]?.x}
                y2={positions[conn.targetId]?.y}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
            ))}

          {/* Nodes */}
          {mapNodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            const isActive = activeNodeId === node.id;
            const isVisited = visitedNodes.has(node.id);
            const color = CATEGORY_COLORS[node.category];
            const r = node.level === 0 ? 5 : 3.5;

            return (
              <g key={node.id}>
                {isActive && (
                  <circle
                    cx={pos.x} cy={pos.y} r={r + 4}
                    fill="none" stroke={color} strokeWidth="1" opacity={0.4}
                  />
                )}
                <circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill={color}
                  opacity={isActive ? 1 : isVisited ? 0.8 : 0.4}
                />
                <text
                  x={pos.x} y={pos.y + r + 8}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.5)"
                  fontSize="6"
                  fontFamily="sans-serif"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </motion.div>
  );
}
