'use client';

/**
 * EnergyParticles — a handful of glowing points riding along a synapse
 * tube's curve. Pre-allocates 6 buffer slots; renders 3 idle, 6 when the
 * synapse is active. Speed doubles under activation (0.3 → 0.6 per second
 * of tube length).
 *
 * The buffer is fixed-size, so toggling `active` is cheap — we only move
 * the `drawRange` end. All 6 positions are updated every frame regardless,
 * keeping the offsets phased evenly so the three hidden particles are
 * already in flight when activation promotes them.
 *
 * Disabled on GPU tier 0/1 (detect-gpu). Hooks still run to keep React's
 * rule-of-hooks happy; `useFrame` short-circuits and render returns null.
 */

import { useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { getGPUTier } from 'detect-gpu';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MAX_PARTICLES = 6;
const INACTIVE_COUNT = 3;
const SPEED_INACTIVE = 0.3;
const SPEED_ACTIVE = 0.6;
const POINT_SIZE = 0.22;

// ---------------------------------------------------------------------------
// GPU tier (local fallback — folded into useResponsive in Task 23)
// ---------------------------------------------------------------------------

function useGPUTier(): number {
  const [tier, setTier] = useState<number>(2);
  useEffect(() => {
    let cancelled = false;
    getGPUTier().then((result) => {
      if (!cancelled) setTier(result.tier ?? 2);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return tier;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface EnergyParticlesProps {
  /** Curve the particles ride along — typically the same CatmullRomCurve3
   * the parent Synapse's TubeGeometry was built from. */
  curve: THREE.CatmullRomCurve3;
  /** When true: 6 particles at 2× speed. When false: 3 at 1× speed. */
  active: boolean;
  /** Color of the particle spark — usually the source node's category color. */
  color: string;
}

export default function EnergyParticles({
  curve,
  active,
  color,
}: EnergyParticlesProps) {
  const tier = useGPUTier();
  const skip = tier <= 1;

  // Evenly-phased offsets along [0, 1). Spread across all 6 slots so the
  // "hidden" particles are already in motion when `active` flips on.
  const offsets = useMemo(() => {
    const arr = new Float32Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) arr[i] = i / MAX_PARTICLES;
    return arr;
  }, []);

  // Pre-allocated points buffer — 6 positions × 3 floats = 72 bytes total.
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_PARTICLES * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, INACTIVE_COUNT);
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: POINT_SIZE,
        sizeAttenuation: true,
        color: new THREE.Color(color),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    // Color is synced via useEffect below — material is constructed once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    material.color.set(color);
  }, [color, material]);

  // Flip draw range when active toggles.
  useEffect(() => {
    geometry.setDrawRange(0, active ? MAX_PARTICLES : INACTIVE_COUNT);
  }, [active, geometry]);

  // Per-instance scratch vector avoids churn inside useFrame.
  const scratch = useMemo(() => new THREE.Vector3(), []);

  // Dispose the per-synapse buffers when unmounting.
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((_, delta) => {
    if (skip) return;

    const attr = geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const speed = active ? SPEED_ACTIVE : SPEED_INACTIVE;
    const count = active ? MAX_PARTICLES : INACTIVE_COUNT;

    for (let i = 0; i < count; i++) {
      let t = offsets[i] + speed * delta;
      if (t >= 1) t -= 1; // wrap
      offsets[i] = t;

      curve.getPoint(t, scratch);
      arr[i * 3] = scratch.x;
      arr[i * 3 + 1] = scratch.y;
      arr[i * 3 + 2] = scratch.z;
    }

    attr.needsUpdate = true;
  });

  if (skip) return null;

  return <points geometry={geometry} material={material} />;
}
