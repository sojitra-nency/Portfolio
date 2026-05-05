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

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useHudStore } from '@/store/useHudStore';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MAX_PARTICLES_DESKTOP = 8;
const INACTIVE_COUNT_DESKTOP = 4;
const MAX_PARTICLES_MOBILE = 4;
const INACTIVE_COUNT_MOBILE = 2;
const SPEED_INACTIVE = 0.4;
const SPEED_ACTIVE = 0.8;
const POINT_SIZE = 0.32;
// Warm white sparks travel along cool-blue dendrites — the contrast matches
// the reference image's bioluminescent terminal glow.
const PARTICLE_COLOR = '#FFF5E0';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  color: _color,
}: EnergyParticlesProps) {
  const tier = useHudStore((s) => s.gpuTier);
  const isMobile = useHudStore((s) => s.isMobile);
  const skip = tier <= 1;

  // Mobile halves the particle budget: 1 per idle edge, 3 when active.
  const maxParticles = isMobile
    ? MAX_PARTICLES_MOBILE
    : MAX_PARTICLES_DESKTOP;
  const inactiveCount = isMobile
    ? INACTIVE_COUNT_MOBILE
    : INACTIVE_COUNT_DESKTOP;

  // Evenly-phased offsets along [0, 1). Spread across all slots so the
  // "hidden" particles are already in motion when `active` flips on.
  const offsets = useMemo(() => {
    const arr = new Float32Array(maxParticles);
    for (let i = 0; i < maxParticles; i++) arr[i] = i / maxParticles;
    return arr;
  }, [maxParticles]);

  // Pre-allocated points buffer sized for the effective max.
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, inactiveCount);
    return geo;
  }, [maxParticles, inactiveCount]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: POINT_SIZE,
        sizeAttenuation: true,
        color: new THREE.Color(PARTICLE_COLOR),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  // Flip draw range when active toggles.
  useEffect(() => {
    geometry.setDrawRange(0, active ? maxParticles : inactiveCount);
  }, [active, geometry, maxParticles, inactiveCount]);

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
    const count = active ? maxParticles : inactiveCount;

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
