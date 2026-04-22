'use client';

/**
 * Neuron — the composable wrapper for a single neural node.
 *
 * Responsibilities:
 * - Look up world position (force-layout) + hover/active state (graph store)
 *   via fine-grained selectors so each neuron only re-renders when its own
 *   slice of state changes.
 * - Compose `NeuronCore` (body) + `NeuronHalo` (glow) + `<Html>` label,
 *   positioned at the node's world coordinates.
 * - Own a `pulseRef` — the shared `MutableRefObject<number>` read every
 *   frame by both core and halo materials. The ref is published to
 *   `useChainReaction`'s central registry so `fire()` / `preFire()` can
 *   write into it across the graph.
 * - Pointer handlers translate into graph-store actions **and** chain-
 *   reaction events: click → `fire(id)`, hover-enter → `preFire(id)`.
 *
 * Wrapped in `React.memo` so a parent re-render with the same `node` ref
 * doesn't recreate subtrees. Per-neuron state changes still propagate
 * through the store subscriptions inside.
 */

import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

import { useGraphStore } from '@/store/useGraphStore';
import { useCinemaStore } from '@/store/useCinemaStore';
import { CATEGORY_COLORS } from '@/data/types';
import type { NeuralNode, NodeLevel } from '@/data/types';
import { fire, preFire, registerPulse } from '@/hooks/useChainReaction';
import { registerVelocity } from '@/hooks/usePointerMagnetism';
import { playFX } from '@/hooks/useAudio';

import NeuronCore from './NeuronCore';
import NeuronHalo from './NeuronHalo';
import { geometryFor } from './geometries';

// ---------------------------------------------------------------------------
// Level-derived defaults
// ---------------------------------------------------------------------------

/** Fallback node radius when `node.size` isn't set on the data. */
const SIZE_BY_LEVEL: Record<NodeLevel, number> = {
  0: 2.0, // origin
  1: 1.4, // primary clusters
  2: 0.9, // details
  3: 0.6, // tools
  4: 0.5, // hidden
};

// ---------------------------------------------------------------------------
// Neuron
// ---------------------------------------------------------------------------

interface NeuronProps {
  node: NeuralNode;
}

function Neuron({ node }: NeuronProps) {
  // Fine-grained subscriptions: each returns a primitive that Zustand
  // compares with Object.is — only the two neurons involved in a hover
  // transition re-render, not all 77.
  const isHovered = useGraphStore((s) => s.hoveredNodeId === node.id);
  const isActive = useGraphStore((s) => s.activeNodeId === node.id);
  const position = useGraphStore((s) => s.positions.get(node.id));

  // Stable action refs (Zustand doesn't recreate actions).
  const hover = useGraphStore((s) => s.hover);
  const activate = useGraphStore((s) => s.activate);
  const focusOn = useCinemaStore((s) => s.focusOn);

  // Shared pulse envelope read by NeuronCore + NeuronHalo every frame.
  // Written centrally by `useChainReaction`'s useFrame (Task 19).
  const pulseRef = useRef<number>(0);

  // Pointer-magnetism offset — written by `usePointerMagnetism` (Task 22)
  // and applied to the group's position below. Zero when the cursor is
  // out of range or magnetism is disabled (mobile / reduced motion).
  const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3());

  // Group ref — used to set world position imperatively each frame so
  // the magnetism nudge composites cleanly on top of the base position.
  const groupRef = useRef<THREE.Group>(null);

  // Publish our pulse ref to the chain-reaction registry on mount.
  useEffect(() => {
    return registerPulse(node.id, pulseRef);
  }, [node.id]);

  // Publish our velocity ref to the pointer-magnetism registry on mount.
  useEffect(() => {
    return registerVelocity(node.id, velocityRef);
  }, [node.id]);

  // Each frame: compose the group's position from the base (force-layout)
  // position plus the magnetism offset. When velocity is zero the result
  // equals the base, so this is effectively a no-op on low-end / reduced-
  // motion paths.
  useFrame(() => {
    if (!position || !groupRef.current) return;
    const v = velocityRef.current;
    groupRef.current.position.set(
      position.x + v.x,
      position.y + v.y,
      position.z + v.z,
    );
  });

  // Cached geometry for this node's category. Shared across all neurons
  // of the same category — geometryFor memoizes.
  const geometry = useMemo(
    () => geometryFor(node.category, node.level),
    [node.category, node.level],
  );

  const color = CATEGORY_COLORS[node.category];
  const size = node.size ?? SIZE_BY_LEVEL[node.level];
  // Steady activation multiplier: 0 idle, 0.6 hover, 1 active.
  const state = isActive ? 1 : isHovered ? 0.6 : 0;
  const showLabel = node.level <= 1 || isHovered || isActive;

  // ── Pointer handlers ────────────────────────────────────────────────────

  const onPointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = 'pointer';
      hover(node.id);
      // Shimmer 1-hop neighbors (no cascade) — cancels any in-flight event.
      preFire(node.id);
      playFX('hover-blip');
    },
    [hover, node.id],
  );

  const onPointerOut = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = 'auto';
      hover(null);
    },
    [hover],
  );

  const onClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      activate(node.id);
      // Full chain reaction: source + 1-hop + 2-hop waves.
      fire(node.id);
      // Cinema focus — CinemaCamera lerps to the node.
      focusOn(node.id);
      playFX('select-chime');
      playFX('fire-whoosh');
    },
    [activate, focusOn, node.id],
  );

  // Force layout still settling — skip render until a position is written.
  if (!position) return null;

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <NeuronCore
        color={color}
        pulseRef={pulseRef}
        state={state}
        size={size}
        geometry={geometry}
      />
      <NeuronHalo
        color={color}
        pulseRef={pulseRef}
        scale={size}
        opacity={isHovered || isActive ? 1 : 0.85}
      />
      {showLabel && (
        <Html
          position={[0, size + 0.6, 0]}
          center
          distanceFactor={12}
          // Pointer-events off so the DOM label never swallows a click
          // meant for the neuron beneath it.
          style={{
            color: 'white',
            fontFamily: 'var(--font-syne)',
            fontSize: '13px',
            fontWeight: 500,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            textShadow: '0 0 8px rgba(0, 0, 0, 0.85)',
            letterSpacing: '0.02em',
          }}
        >
          {node.label}
        </Html>
      )}
    </group>
  );
}

// React.memo with identity-based comparison: the node object reference is
// stable across parent re-renders (the nodes array is seeded once from
// `src/data/nodes.ts` and never mutated), so default shallow compare is
// sufficient. Hover / active / position changes flow through the store
// subscriptions inside, not via prop changes.
export default memo(Neuron, (prev, next) => prev.node.id === next.node.id);
