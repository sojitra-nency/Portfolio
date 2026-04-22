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
import { useExplorationStore } from '@/store/useExplorationStore';
import { CATEGORY_COLORS } from '@/data/types';
import type { NeuralNode, NodeLevel } from '@/data/types';
import { fire, preFire, registerPulse } from '@/hooks/useChainReaction';
import { registerVelocity } from '@/hooks/usePointerMagnetism';
import { playFX } from '@/hooks/useAudio';
import { hasActiveReveal, registerReveal } from './UnlockReveal';

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

/** Maximum jitter magnitude (world units) at reveal = 0. Damps to zero
 * as the reveal envelope approaches 1. */
const REVEAL_JITTER = 0.5;

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

  // Reveal envelope — 0 while a hidden node is glitch-materialising,
  // 1 when fully revealed (or always 1 for non-hidden nodes). Written
  // by UnlockReveal's per-frame loop.
  //
  // Initial value: if this node is hidden AND an unlock just fired for it,
  // start at 0 so the Neuron mounts invisible and scales in. Otherwise
  // (non-hidden, or hidden-but-previously-unlocked across sessions) start
  // at 1 so it's immediately visible.
  const revealRef = useRef<number>(
    node.isHidden && hasActiveReveal(node.id) ? 0 : 1,
  );

  // Group ref — used to set world position + scale imperatively each frame.
  const groupRef = useRef<THREE.Group>(null);

  // Publish our pulse ref to the chain-reaction registry on mount.
  useEffect(() => {
    return registerPulse(node.id, pulseRef);
  }, [node.id]);

  // Publish our velocity ref to the pointer-magnetism registry on mount.
  useEffect(() => {
    return registerVelocity(node.id, velocityRef);
  }, [node.id]);

  // Publish our reveal ref to UnlockReveal's registry on mount.
  useEffect(() => {
    return registerReveal(node.id, revealRef);
  }, [node.id]);

  // Each frame: compose the group's position/scale from:
  //   base (force-layout) position  +  magnetism velocity  +  reveal jitter
  // Scale derives from the reveal envelope (0 → 1.08 → 1). Jitter amount
  // damps as the reveal progresses so the node trembles heavily at first
  // and settles smoothly. For non-hidden nodes the reveal is pinned to 1
  // and this reduces to the same base+velocity update we had before.
  useFrame(() => {
    if (!position || !groupRef.current) return;
    const v = velocityRef.current;
    const reveal = revealRef.current;
    const jitter = Math.max(0, 1 - reveal) * REVEAL_JITTER;
    groupRef.current.position.set(
      position.x + v.x + (Math.random() - 0.5) * jitter,
      position.y + v.y + (Math.random() - 0.5) * jitter,
      position.z + v.z + (Math.random() - 0.5) * jitter,
    );
    groupRef.current.scale.setScalar(Math.max(0, reveal));
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
      // Mark as visited for progressive-discovery tracking — feeds the
      // CoherenceMeter percentage and the unlock detection in
      // useExplorationStore.checkUnlocks.
      useExplorationStore.getState().visit(node.id);
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
