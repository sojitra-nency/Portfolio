'use client';

/**
 * usePointerMagnetism — subtle "presence" effect: neurons near the cursor
 * gently lean toward it. Implemented as a per-node velocity vector
 * (capped at 0.15 units) that `Neuron.tsx` applies as a position offset.
 *
 * Flow:
 * - A single pointer listener on the R3F canvas records the latest
 *   client-space cursor coords (cheap). No raycast in the event handler.
 * - A single central `useFrame` — the natural rAF-throttle — does the
 *   raycast onto a z=0 plane and computes each in-range node's velocity
 *   based on 3D distance. (So pointer events are rate-limited to one
 *   compute per frame, satisfying the "throttle pointer event to rAF"
 *   requirement without explicit setTimeout / RAF scheduling.)
 * - Per-node velocity refs are published via `registerVelocity(id, ref)`
 *   (same registry pattern as useChainReaction's `registerPulse`). Each
 *   Neuron mutates its own ref only via this hook.
 *
 * Disabled on reduced-motion users and on mobile (< 768 px width):
 * - Pointer listeners aren't attached.
 * - Velocities are drained to zero so any in-flight nudges cleanly snap
 *   back to base positions.
 *
 * Should be mounted once inside the R3F Canvas tree (called from
 * `NeuralNetwork`, alongside `useForceLayout` + `useChainReaction`).
 */

import { useEffect, useMemo } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { useGraphStore } from '@/store/useGraphStore';
import { useReducedMotion } from '@/lib/animations';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Maximum 3D distance at which magnetism applies. */
const RADIUS = 15;
const RADIUS_SQ = RADIUS * RADIUS;

/** Hard cap on per-node velocity magnitude (world units). */
const MAX_MAGNITUDE = 0.15;

/** Multiplier on the inverse-square falloff — tuned so close nodes
 *  approach MAX_MAGNITUDE without being aggressive. */
const STRENGTH_SCALE = 8;

const MOBILE_BREAKPOINT = 768;

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const velocityRegistry = new Map<string, MutableRefObject<THREE.Vector3>>();

/**
 * Publish a neuron's velocity ref so this hook can mutate it. Returns
 * the matching unregister function for use in `useEffect` cleanup.
 */
export function registerVelocity(
  id: string,
  ref: MutableRefObject<THREE.Vector3>,
): () => void {
  velocityRegistry.set(id, ref);
  return () => {
    if (velocityRegistry.get(id) === ref) velocityRegistry.delete(id);
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export default function usePointerMagnetism(): void {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const width = useThree((s) => s.size.width);
  const reducedMotion = useReducedMotion();
  const isMobile = width < MOBILE_BREAKPOINT;
  const enabled = !reducedMotion && !isMobile;

  // One-time scratch allocations (re-used per-frame, never re-assigned).
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    [],
  );
  const cursor3D = useMemo(() => new THREE.Vector3(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const scratch = useMemo(() => new THREE.Vector3(), []);

  // Mutable pointer state — plain object, not a ref (no triggering).
  const pointerState = useMemo(
    () => ({ hasPointer: false, clientX: 0, clientY: 0 }),
    [],
  );

  // Attach listeners (pointermove + pointerleave) when enabled.
  useEffect(() => {
    if (!enabled) {
      pointerState.hasPointer = false;
      for (const ref of velocityRegistry.values()) ref.current.set(0, 0, 0);
      return;
    }
    const canvas = gl.domElement;
    const handleMove = (e: PointerEvent) => {
      pointerState.clientX = e.clientX;
      pointerState.clientY = e.clientY;
      pointerState.hasPointer = true;
    };
    const handleLeave = () => {
      pointerState.hasPointer = false;
    };
    canvas.addEventListener('pointermove', handleMove);
    canvas.addEventListener('pointerleave', handleLeave);
    return () => {
      canvas.removeEventListener('pointermove', handleMove);
      canvas.removeEventListener('pointerleave', handleLeave);
    };
  }, [enabled, gl, pointerState]);

  // Per-frame compute: raycast to z=0 plane, then walk the registry and
  // write each node's velocity. Automatically rAF-throttled by useFrame.
  useFrame(() => {
    if (!enabled || !pointerState.hasPointer) {
      // Drain any lingering velocities when the cursor leaves the canvas
      // or the feature is disabled mid-session.
      for (const ref of velocityRegistry.values()) {
        if (ref.current.lengthSq() > 1e-6) ref.current.set(0, 0, 0);
      }
      return;
    }

    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    ndc.set(
      ((pointerState.clientX - rect.left) / rect.width) * 2 - 1,
      -((pointerState.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    // If the ray runs parallel to the plane this returns null.
    const hit = raycaster.ray.intersectPlane(plane, cursor3D);
    if (!hit) return;

    const positions = useGraphStore.getState().positions;
    for (const [id, velRef] of velocityRegistry.entries()) {
      const pos = positions.get(id);
      if (!pos) {
        velRef.current.set(0, 0, 0);
        continue;
      }

      scratch.subVectors(cursor3D, pos);
      const distSq = scratch.lengthSq();
      // Guard against div-by-zero (cursor ON the node) and skip
      // out-of-range nodes outright.
      if (distSq < 1e-4 || distSq > RADIUS_SQ) {
        velRef.current.set(0, 0, 0);
        continue;
      }

      // Inverse-square falloff → strength grows rapidly as cursor nears.
      const strength = STRENGTH_SCALE / (1 + distSq);
      scratch.normalize().multiplyScalar(strength);
      // Clamp to the 0.15-unit ceiling the task specifies.
      scratch.clampLength(0, MAX_MAGNITUDE);
      velRef.current.copy(scratch);
    }
  });
}
